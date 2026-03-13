<template>
  <app-page
    title="油耗曲线"
    subtitle="把每次加油变成清晰可读的趋势"
    :pills="heroPills"
  >
    <app-card title="油耗趋势" desc="近期开销与油耗走势">
      <app-empty v-if="!records.length" text="暂无油耗记录，先去添加一条记录吧。" />
      <app-chart v-else :option="chartOption" @point-click="showPointDetail" />
    </app-card>

    <app-card title="趋势摘要" desc="基于全部记录的统计">
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

const chartOption = computed(() => {
  if (!records.value.length) {
    return {};
  }

  const ordered = [...records.value].sort((a, b) => a.timestamp - b.timestamp);
  const labels = ordered.map((item) => formatShortDate(item.timestamp));
  const consumption = ordered.map((item) => Number(item.consumption.toFixed(2)));
  const costPer100 = ordered.map((item) => Number(item.costPer100.toFixed(2)));

  return {
    backgroundColor: "transparent",
    color: ["#14b8a6", "#ff7a59"],
    tooltip: {
      trigger: "axis",
    },
    legend: {
      data: ["油耗(L/100km)", "油费(元/100km)"],
      bottom: 0,
      textStyle: {
        color: "#6f8086",
      },
    },
    grid: {
      left: "8%",
      right: "8%",
      top: "12%",
      bottom: "22%",
    },
    xAxis: {
      type: "category",
      data: labels,
      axisLine: {
        lineStyle: {
          color: "rgba(16, 60, 66, 0.15)",
        },
      },
      axisLabel: {
        color: "#6f8086",
      },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        color: "#6f8086",
      },
      splitLine: {
        lineStyle: {
          color: "rgba(16, 60, 66, 0.08)",
        },
      },
    },
    series: [
      {
        name: "油耗(L/100km)",
        type: "line",
        data: consumption,
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        lineStyle: {
          width: 3,
        },
        areaStyle: {
          color: "rgba(20, 184, 166, 0.16)",
        },
      },
      {
        name: "油费(元/100km)",
        type: "line",
        data: costPer100,
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        lineStyle: {
          width: 3,
        },
        areaStyle: {
          color: "rgba(255, 122, 89, 0.16)",
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
]);
</script>

<style lang="scss" scoped></style>
