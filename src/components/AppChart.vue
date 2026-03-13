<template>
  <view class="chart">
    <!-- #ifdef MP-WEIXIN -->
    <view
      class="chart-wrap"
      :style="{ height: chartHeight }"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    >
      <canvas
        class="chart-canvas"
        type="2d"
        :id="chartId"
        :canvas-id="chartId"
        :style="{ height: chartHeight, width: '100%' }"
      ></canvas>
    </view>
    <!-- #endif -->
    <!-- #ifndef MP-WEIXIN -->
    <view
      class="chart-canvas"
      :id="chartId"
      :style="{ height: chartHeight }"
      :prop="option"
      :change:prop="echarts.update"
      @pointClick="onPointClick"
    ></view>
    <!-- #endif -->
  </view>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, watch } from "vue";
// #ifdef MP-WEIXIN
import * as echarts from "echarts";
// #endif

const props = withDefaults(
  defineProps<{ option: Record<string, any>; height?: string; canvasId?: string }>(),
  { height: "360rpx" }
);

const emit = defineEmits<{
  (e: "pointClick", payload: { dataIndex: number; date: string; consumption: number; costPer100: number }): void;
}>();

const onPointClick = (e: any) => {
  const detail = e?.detail ?? e;
  if (detail && typeof detail.dataIndex === "number") {
    emit("pointClick", detail);
  }
};

const chartId = computed(
  () => props.canvasId || `chart-${Math.random().toString(36).slice(2, 9)}`
);
const chartHeight = computed(() => props.height || "360rpx");

// #ifdef MP-WEIXIN
const instance = getCurrentInstance();
let chart: any = null;
let chartWrapRect: { left: number; top: number } = { left: 0, top: 0 };
let initTries = 0;
let initTimer: ReturnType<typeof setTimeout> | null = null;
let platformReady = false;

const getTouchPos = (e: any) => {
  const touch = e?.touches?.[0] || e?.changedTouches?.[0];
  if (!touch) return null;
  return {
    clientX: touch.clientX ?? touch.x,
    clientY: touch.clientY ?? touch.y,
  };
};

const dispatchChartTouch = (type: "mousedown" | "mousemove" | "mouseup", e: any, rect?: { left: number; top: number }) => {
  if (!chart) return;
  const pos = getTouchPos(e);
  if (!pos) return;
  const base = rect || chartWrapRect;
  const zrX = pos.clientX - base.left;
  const zrY = pos.clientY - base.top;
  const event = { zrX, zrY, zrByTouch: true };
  chart.getZr().handler.dispatch(type, event);
};

const onTouchStart = (e: any) => {
  const query = uni.createSelectorQuery().in(instance?.proxy as any);
  query.select(".chart-wrap").boundingClientRect((res: any) => {
    if (res) {
      chartWrapRect = { left: res.left, top: res.top };
      dispatchChartTouch("mousedown", e, res);
    }
  }).exec();
};

const onTouchMove = (e: any) => {
  dispatchChartTouch("mousemove", e);
};

const onTouchEnd = (e: any) => {
  dispatchChartTouch("mouseup", e);
};

const resolveHeightPx = (value: string) => {
  const numeric = Number.parseFloat(value);
  if (Number.isNaN(numeric)) {
    return 0;
  }
  if (value.endsWith("rpx")) {
    return uni.upx2px(numeric);
  }
  if (value.endsWith("px")) {
    return numeric;
  }
  return numeric;
};

const getFallbackSize = () => {
  const info = uni.getSystemInfoSync();
  const width = info.windowWidth || 320;
  const height = resolveHeightPx(chartHeight.value) || 240;
  return { width, height };
};

const ensurePlatformApi = (canvas: any) => {
  if (platformReady || typeof (echarts as any).setPlatformAPI !== "function") {
    return;
  }

  const wxa = (globalThis as any).wx;
  const createOffscreenCanvas = () => {
    if (wxa?.createOffscreenCanvas) {
      return wxa.createOffscreenCanvas({ type: "2d", width: 1, height: 1 });
    }
    return canvas;
  };

  const createImage = () => {
    if (canvas?.createImage) {
      return canvas.createImage();
    }
    if (wxa?.createImage) {
      return wxa.createImage();
    }
    return null;
  };

  (echarts as any).setPlatformAPI({
    createCanvas: createOffscreenCanvas,
    loadImage: (src: string, onload: () => void, onerror: () => void) => {
      const image = createImage();
      if (!image) {
        if (onerror) {
          onerror();
        }
        return null;
      }
      image.onload = onload;
      image.onerror = onerror;
      image.src = src;
      return image;
    },
  });

  platformReady = true;
};

const scheduleInit = () => {
  if (chart) {
    return;
  }
  if (initTimer) {
    clearTimeout(initTimer);
  }
  initTimer = setTimeout(() => {
    initChart();
  }, 60);
};

const initChart = () => {
  if (!instance || chart) {
    return;
  }

  const query = uni.createSelectorQuery().in(instance.proxy as any);
  query
    .select(`#${chartId.value}`)
    .fields({ node: true, size: true })
    .exec((res) => {
      const canvas = res?.[0]?.node;
      let width = res?.[0]?.width;
      let height = res?.[0]?.height;
      if (!canvas) {
        return;
      }
      if (!width || !height) {
        initTries += 1;
        if (initTries < 6) {
          scheduleInit();
          return;
        }
        const fallback = getFallbackSize();
        width = width || fallback.width;
        height = height || fallback.height;
      }

      const dpr = uni.getSystemInfoSync().pixelRatio || 1;
      const finalWidth = Math.max(1, width);
      const finalHeight = Math.max(1, height);

      if (!canvas.addEventListener) {
        canvas.addEventListener = () => {};
      }
      if (!canvas.removeEventListener) {
        canvas.removeEventListener = () => {};
      }
      if (!canvas.getBoundingClientRect) {
        canvas.getBoundingClientRect = () => ({
          left: 0,
          top: 0,
          width: finalWidth,
          height: finalHeight,
        });
      }
      if (!canvas.style) {
        canvas.style = {};
      }
      if (canvas.innerHTML === undefined) {
        canvas.innerHTML = "";
      }

      canvas.width = finalWidth * dpr;
      canvas.height = finalHeight * dpr;

      ensurePlatformApi(canvas);

      chart = echarts.init(canvas, null, {
        renderer: "canvas",
        width: finalWidth,
        height: finalHeight,
        devicePixelRatio: dpr,
      });

      if (typeof canvas.setChart === "function") {
        canvas.setChart(chart);
      }

      if (props.option) {
        chart.setOption(props.option, true);
      }
      chart.resize();

      const wrapQuery = uni.createSelectorQuery().in(instance.proxy as any);
      wrapQuery.select(".chart-wrap").boundingClientRect((res: any) => {
        if (res) chartWrapRect = { left: res.left, top: res.top };
      }).exec();

      chart.off("click");
      chart.on("click", (params: any) => {
        const opt = props.option;
        const dataIndex = params.dataIndex;
        const labels = opt?.xAxis?.data || [];
        const consumptionSeries = opt?.series?.[0];
        const costSeries = opt?.series?.[1];
        const date = labels[dataIndex] ?? "";
        const consumption = consumptionSeries?.data?.[dataIndex] ?? 0;
        const costPer100 = costSeries?.data?.[dataIndex] ?? 0;
        emit("pointClick", { dataIndex, date, consumption, costPer100 });
      });
    });
};

const updateChart = (option: Record<string, any>) => {
  if (!chart || !option) {
    return;
  }
  chart.setOption(option, true);
  chart.resize();
};

onMounted(() => {
  nextTick(() => {
    initChart();
  });
});

onBeforeUnmount(() => {
  if (initTimer) {
    clearTimeout(initTimer);
  }
  if (chart) {
    chart.dispose();
    chart = null;
  }
});

watch(
  () => props.option,
  (option) => {
    if (chart) {
      updateChart(option);
      return;
    }
    if (option) {
      nextTick(() => {
        initChart();
      });
    }
  },
  { deep: true }
);
// #endif
</script>

<!-- #ifndef MP-WEIXIN -->
<script module="echarts" lang="renderjs">
import * as echarts from "echarts";

export default {
  data() {
    return {
      chart: null,
      lastOption: null,
    };
  },
  mounted() {
    this.initChart();
  },
  beforeUnmount() {
    if (this.chart) {
      this.chart.dispose();
      this.chart = null;
    }
  },
  methods: {
    initChart() {
      if (this.chart || !this.$el) {
        return;
      }
      this.chart = echarts.init(this.$el, null, { renderer: "canvas" });
      if (this.lastOption) {
        this.chart.setOption(this.lastOption, true);
      }
      this.chart.off("click");
      this.chart.on("click", (params) => {
        const opt = this.lastOption || {};
        const dataIndex = params.dataIndex;
        const labels = opt.xAxis?.data || [];
        const consumption = opt.series?.[0]?.data?.[dataIndex] ?? 0;
        const costPer100 = opt.series?.[1]?.data?.[dataIndex] ?? 0;
        const date = labels[dataIndex] ?? "";
        const payload = { dataIndex, date, consumption, costPer100 };
        if (this.$el?.dispatchEvent) {
          this.$el.dispatchEvent(new CustomEvent("pointClick", { detail: payload }));
        }
      });
    },
    update(option) {
      this.lastOption = option;
      if (!this.chart) {
        this.initChart();
      }
      if (this.chart && option) {
        this.chart.setOption(option, true);
        this.chart.resize();
      }
    },
  },
};
</script>
<!-- #endif -->

<style lang="scss" scoped>
.chart {
  width: 100%;

  .chart-wrap {
    width: 100%;
    position: relative;
  }

  .chart-canvas {
    width: 100%;
    display: block;
  }
}
</style>
