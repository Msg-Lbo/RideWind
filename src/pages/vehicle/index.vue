<template>
  <app-page title="我的爱车" subtitle="维护车辆档案，让油耗记录更精准" :pills="heroPills">
    <app-card title="爱车信息" desc="用于计算油耗与续航">
      <view class="form-grid">
        <app-field v-model="vehicleForm.name" label="爱车名字" placeholder="比如：小风" />
        <app-field v-model="vehicleForm.tankCapacity" label="油箱容量 (L)" type="digit" placeholder="比如：12.5" />
        <app-field v-model="vehicleForm.displacement" label="排量 (cc)" type="number" placeholder="比如：250" />
      </view>
      <template #actions>
        <view class="actions-row">
          <view class="actions-col">
            <app-button @tap="saveVehicle">保存爱车信息</app-button>
          </view>
          <view class="actions-col">
            <app-button variant="ghost" @tap="resetVehicle">清空</app-button>
          </view>
        </view>
      </template>
    </app-card>

    <app-card title="车辆概览" desc="基于当前信息与历史记录">
      <app-metric-grid :items="summaryItems" />
    </app-card>

    <app-card title="最近一次记录" desc="快速回看最近的油耗数据">
      <app-empty v-if="!latestRecord" text="还没有记录，先去添加一次加油。" />
      <app-metric-grid v-else :items="latestItems" />
    </app-card>
  </app-page>
</template>

<script setup lang="ts">
import { computed } from "vue";
import AppPage from "@/components/AppPage.vue";
import AppCard from "@/components/AppCard.vue";
import AppField from "@/components/AppField.vue";
import AppButton from "@/components/AppButton.vue";
import AppMetricGrid from "@/components/AppMetricGrid.vue";
import AppEmpty from "@/components/AppEmpty.vue";
import { useMotoStore } from "@/composables/useMotoStore";

const {
  vehicleForm,
  stats,
  latestRecord,
  vehicleDisplayName,
  tankCapacityDisplay,
  displacementDisplay,
  formatValue,
  toNumber,
  saveVehicle,
  resetVehicle,
} = useMotoStore();

const heroPills = computed(() => [
  { label: "爱车", value: vehicleDisplayName.value },
  { label: "油箱", value: tankCapacityDisplay.value },
  { label: "排量", value: displacementDisplay.value },
]);

const formatWithUnit = (value: number, unit: string, digits = 2) => {
  const formatted = formatValue(value, digits);
  return formatted === "--" ? "--" : `${formatted} ${unit}`;
};

const avgRange = computed(() => {
  const tankCapacity = toNumber(vehicleForm.tankCapacity);
  const avgConsumption = stats.value.avgConsumption;
  return tankCapacity > 0 && avgConsumption > 0 ? (tankCapacity * 100) / avgConsumption : 0;
});

const summaryItems = computed(() => [
  { label: "爱车名字", value: vehicleDisplayName.value },
  { label: "油箱容量", value: tankCapacityDisplay.value },
  { label: "排量", value: displacementDisplay.value },
  {
    label: "平均油耗",
    value: stats.value.hasData ? formatWithUnit(stats.value.avgConsumption, "L/100km") : "--",
  },
  {
    label: "平均续航",
    value: avgRange.value > 0 ? formatWithUnit(avgRange.value, "km", 0) : "--",
  },
]);

const latestItems = computed(() => {
  if (!latestRecord.value) {
    return [];
  }

  return [
    { label: "加油量", value: formatWithUnit(latestRecord.value.fuelAmount, "L") },
    { label: "小计里程", value: formatWithUnit(latestRecord.value.distance, "km", 0) },
    { label: "油耗", value: formatWithUnit(latestRecord.value.consumption, "L/100km") },
    { label: "油费", value: formatWithUnit(latestRecord.value.costPer100, "元/100km") },
  ];
});
</script>

<style lang="scss" scoped>
.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 18rpx;

  @media (min-width: 700px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.actions-row {
  display: flex;
  width: 100%;
  gap: 12rpx;
}

.actions-col {
  flex: 1;
  min-width: 0;
}

.actions-col app-button {
  display: block;
  width: 100%;
}
</style>
