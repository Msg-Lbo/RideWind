<template>
  <app-page
    title="油耗曲线"
    subtitle="把每次加油变成清晰可读的趋势"
    :pills="heroPills"
    :show-hero="false"
  >
    <view class="curve-hero">
      <text class="curve-hero-title">油耗曲线</text>
      <text class="curve-hero-sub">把每次加油变成清晰可读的趋势</text>
      <view class="curve-hero-pills">
        <view v-for="pill in heroPills" :key="pill.label" class="curve-pill">
          <text class="curve-pill-label">{{ pill.label }}</text>
          <text class="curve-pill-value">{{ pill.value }}</text>
        </view>
      </view>
    </view>

    <app-card title="油耗趋势" desc="近期开销与油耗走势">
      <app-empty v-if="!records.length" text="暂无油耗记录，先去添加一条记录吧。" />
      <app-chart v-else :option="chartOption" height="420rpx" @point-click="showPointDetail" />
    </app-card>

    <app-card title="统计与历史" desc="基于已保存的加油记录">
      <app-metric-grid :items="summaryItems" />
    </app-card>
  </app-page>
</template>

<script setup lang="ts">
import { computed } from "vue";
import AppPage from "@/components/AppPage.vue";
import AppCard from "@/components/AppCard.vue";
import AppMetricGrid from "@/components/AppMetricGrid.vue";
import AppEmpty from "@/components/AppEmpty.vue";
import AppChart from "@/components/AppChart.vue";
import { useMotoStore } from "@/composables/useMotoStore";

const {
  records,
  stats,
  vehicleDisplayName,
  tankCapacityDisplay,
  displacementDisplay,
  formatValue,
} = useMotoStore();

const heroPills = computed(() => [
  { label: "爱车", value: vehicleDisplayName.value },
  { label: "油箱", value: tankCapacityDisplay.value },
  { label: "排量", value: displacementDisplay.value },
]);

const pad = (value: number) => `${value}`.padStart(2, "0");
const formatShortDate = (timestamp: number) => {
  const date = new Date(timestamp);
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const buildAxisRange = (values: number[], fallback: { min: number; max: number }) => {
  if (!values.length) {
    return fallback;
  }
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const span = rawMax - rawMin;
  const baseSpan = span > 0 ? span : Math.max(rawMax * 0.2, 1);
  const padding = baseSpan * 0.28;
  const min = Math.max(0, rawMin - padding);
  const max = rawMax + padding;
  return {
    min: Number(min.toFixed(2)),
    max: Number(max.toFixed(2)),
  };
};

const formatChartValue = (value: unknown) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return "--";
  }
  return formatValue(numeric, 2);
};

const chartOption = computed(() => {
  if (!records.value.length) {
    return {};
  }

  const ordered = [...records.value].sort((a, b) => a.timestamp - b.timestamp);
  const labels = ordered.map((item) => formatShortDate(item.timestamp));
  const consumption = ordered.map((item) => Number(item.consumption.toFixed(2)));
  const costPer100 = ordered.map((item) => Number(item.costPer100.toFixed(2)));
  const consumptionRange = buildAxisRange(consumption, { min: 0, max: 10 });
  const costRange = buildAxisRange(costPer100, { min: 0, max: 80 });

  return {
    backgroundColor: "transparent",
    animationDuration: 820,
    animationEasing: "cubicOut",
    color: ["#10b5a4", "#ff845d"],
    tooltip: {
      trigger: "axis",
      padding: [10, 12],
      backgroundColor: "rgba(16, 31, 38, 0.9)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.16)",
      textStyle: {
        color: "#edf8fb",
        fontSize: 12,
      },
      axisPointer: {
        type: "cross",
        label: {
          backgroundColor: "rgba(16, 31, 38, 0.95)",
        },
        crossStyle: {
          color: "rgba(255, 255, 255, 0.2)",
        },
      },
      formatter: (params: any) => {
        const points = Array.isArray(params) ? params : [];
        const date = points[0]?.axisValue || "--";
        const consumptionValue = points.find((item: any) => item.seriesName === "油耗(L/100km)")?.data;
        const costValue = points.find((item: any) => item.seriesName === "油费(元/100km)")?.data;
        return [
          `${date}`,
          `油耗  ${formatChartValue(consumptionValue)} L/100km`,
          `油费  ${formatChartValue(costValue)} 元/100km`,
        ].join("\n");
      },
    },
    legend: {
      data: ["油耗(L/100km)", "油费(元/100km)"],
      top: 2,
      itemWidth: 18,
      itemHeight: 10,
      itemGap: 22,
      textStyle: {
        color: "#6f8086",
        fontSize: 12,
      },
    },
    grid: {
      left: "10%",
      right: "12%",
      top: "20%",
      bottom: "11%",
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: labels,
      axisTick: {
        show: false,
      },
      axisLine: {
        lineStyle: {
          color: "rgba(16, 60, 66, 0.14)",
        },
      },
      axisLabel: {
        color: "#6f8086",
        margin: 10,
      },
    },
    yAxis: [
      {
        type: "value",
        min: consumptionRange.min,
        max: consumptionRange.max,
        splitNumber: 4,
        axisLabel: {
          color: "#6f8086",
          formatter: (value: number) => `${value.toFixed(1)}`,
        },
        axisLine: {
          show: false,
        },
        splitLine: {
          lineStyle: {
            color: "rgba(16, 60, 66, 0.08)",
            type: "dashed",
          },
        },
      },
      {
        type: "value",
        min: costRange.min,
        max: costRange.max,
        splitNumber: 4,
        axisLabel: {
          color: "#7c8f95",
          formatter: (value: number) => `${value.toFixed(0)}`,
        },
        axisLine: {
          show: false,
        },
        splitLine: {
          show: false,
        },
      },
    ],
    series: [
      {
        name: "油耗(L/100km)",
        type: "line",
        yAxisIndex: 0,
        data: consumption,
        smooth: 0.38,
        showSymbol: true,
        symbol: "circle",
        symbolSize: 7,
        itemStyle: {
          color: "#10b5a4",
          borderWidth: 2,
          borderColor: "#ffffff",
        },
        emphasis: {
          itemStyle: {
            borderWidth: 3,
          },
        },
        lineStyle: {
          width: 4,
          shadowColor: "rgba(16, 181, 164, 0.34)",
          shadowBlur: 12,
          shadowOffsetY: 4,
        },
        markLine: {
          silent: true,
          symbol: "none",
          label: {
            show: false,
          },
          lineStyle: {
            color: "rgba(16, 181, 164, 0.45)",
            type: "dashed",
          },
          data: [{ type: "average" }],
        },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(16, 181, 164, 0.35)" },
              { offset: 1, color: "rgba(16, 181, 164, 0.03)" },
            ],
          },
        },
      },
      {
        name: "油费(元/100km)",
        type: "line",
        yAxisIndex: 1,
        data: costPer100,
        smooth: 0.38,
        showSymbol: true,
        symbol: "circle",
        symbolSize: 7,
        itemStyle: {
          color: "#ff845d",
          borderWidth: 2,
          borderColor: "#ffffff",
        },
        emphasis: {
          itemStyle: {
            borderWidth: 3,
          },
        },
        lineStyle: {
          width: 4,
          shadowColor: "rgba(255, 132, 93, 0.26)",
          shadowBlur: 10,
          shadowOffsetY: 4,
        },
        markLine: {
          silent: true,
          symbol: "none",
          label: {
            show: false,
          },
          lineStyle: {
            color: "rgba(255, 132, 93, 0.45)",
            type: "dashed",
          },
          data: [{ type: "average" }],
        },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(255, 132, 93, 0.3)" },
              { offset: 1, color: "rgba(255, 132, 93, 0.03)" },
            ],
          },
        },
      },
    ],
  };
});

const formatWithUnit = (value: number, unit: string, digits = 2) => {
  const formatted = formatValue(value, digits);
  return formatted === "--" ? "--" : `${formatted} ${unit}`;
};

const showPointDetail = (payload: {
  dataIndex: number;
  date: string;
  consumption: number;
  costPer100: number;
}) => {
  const consumptionStr = formatWithUnit(payload.consumption, "L/100km");
  const costStr = formatWithUnit(payload.costPer100, "元/100km");
  uni.showModal({
    title: `记录 ${payload.date}`,
    content: `百公里油耗：${consumptionStr}\n百公里油费：${costStr}`,
    showCancel: false,
  });
};

const summaryItems = computed(() => [
  {
    label: "累计里程",
    value: stats.value.hasData ? formatWithUnit(stats.value.totalDistance, "km", 0) : "--",
  },
  {
    label: "累计加油",
    value: stats.value.hasData ? formatWithUnit(stats.value.totalFuel, "L") : "--",
  },
  {
    label: "平均油耗",
    value: stats.value.hasData ? formatWithUnit(stats.value.avgConsumption, "L/100km") : "--",
  },
  {
    label: "累计花费",
    value: stats.value.hasData ? formatWithUnit(stats.value.totalAmount, "元") : "--",
  },
  {
    label: "平均油费",
    value: stats.value.hasData ? formatWithUnit(stats.value.avgCostPer100, "元/100km") : "--",
  },
]);
</script>

<style lang="scss" scoped>
.curve-hero {
  position: relative;
  z-index: 1;
  margin-bottom: 28rpx;
}

.curve-hero-title {
  font-family: var(--font-title);
  font-size: 44rpx;
  font-weight: 700;
  letter-spacing: 2rpx;
}

.curve-hero-sub {
  margin-top: 10rpx;
  font-size: 24rpx;
  color: var(--ink-soft);
}

.curve-hero-pills {
  margin-top: 18rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.curve-pill {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.75);
  border: 1rpx solid var(--card-border);
  box-shadow: 0 10rpx 30rpx rgba(16, 29, 34, 0.08);
}

.curve-pill-label {
  font-size: 22rpx;
  color: var(--ink-muted);
}

.curve-pill-value {
  font-size: 24rpx;
  font-weight: 600;
}
</style>
