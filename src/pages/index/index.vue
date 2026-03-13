<template>
  <app-page title="油耗记录" subtitle="记录每一次加油，形成可视化趋势" :pills="heroPills">
    <app-card title="本次加油" desc="输入加油量、小计里程与金额">
      <view class="form-grid">
        <app-field v-model="recordForm.fuelAmount" label="加油量 (L)" type="digit" placeholder="比如：6.2" />
        <app-field v-model="recordForm.distance" label="小计里程 (km)" type="digit" placeholder="比如：180" />
        <app-field v-model="recordForm.amount" label="加油金额 (元)" type="digit" placeholder="比如：53.8" />
      </view>
      <view class="preview-wrap">
        <app-metric-grid :items="previewItems" />
      </view>
      <template #actions>
        <view class="actions-row">
          <view class="actions-col">
            <app-button @tap="addRecord">保存本次记录</app-button>
          </view>
          <view class="actions-col">
            <app-button variant="ghost" @tap="resetRecord">重置</app-button>
          </view>
        </view>
      </template>
    </app-card>

    <app-card class="solid-card" title="统计与历史" desc="基于已保存的加油记录">
      <app-metric-grid :items="statItems" />
      <view class="records-wrap">
        <app-empty v-if="!records.length" text="还没有记录，先从一次加油开始吧。" />
        <view v-else class="records-summary">
          <text class="records-title">已记录 {{ records.length }} 次加油</text>
          <text class="records-sub">进入列表查看详情与管理记录</text>
        </view>
      </view>
      <template #actions>
        <app-button variant="ghost" @tap="goToRecords">查看记录列表</app-button>
      </template>
    </app-card>
  </app-page>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import AppPage from "@/components/AppPage.vue";
import AppCard from "@/components/AppCard.vue";
import AppField from "@/components/AppField.vue";
import AppButton from "@/components/AppButton.vue";
import AppMetricGrid from "@/components/AppMetricGrid.vue";
import AppEmpty from "@/components/AppEmpty.vue";
import { useMotoStore } from "@/composables/useMotoStore";

const {
  recordForm,
  records,
  preview,
  stats,
  vehicleDisplayName,
  tankCapacityDisplay,
  displacementDisplay,
  formatValue,
  addRecord,
  resetRecord,
} = useMotoStore();

const isNavigating = ref(false);

const goToRecords = () => {
  if (isNavigating.value) {
    return;
  }
  isNavigating.value = true;
  uni.navigateTo({
    url: "/pages/records/index",
    complete: () => {
      isNavigating.value = false;
    },
  });
};

const heroPills = computed(() => [
  { label: "爱车", value: vehicleDisplayName.value },
  { label: "油箱", value: tankCapacityDisplay.value },
  { label: "排量", value: displacementDisplay.value },
]);

const formatWithUnit = (value: number, unit: string, digits = 2) => {
  const formatted = formatValue(value, digits);
  return formatted === "--" ? "--" : `${formatted} ${unit}`;
};

const previewItems = computed(() => [
  {
    label: "油耗",
    value: preview.value.hasBasic
      ? formatWithUnit(preview.value.consumption, "L/100km")
      : "--",
  },
  {
    label: "油费",
    value: preview.value.hasCost
      ? formatWithUnit(preview.value.costPer100, "元/100km")
      : "--",
  },
  {
    label: "占油箱",
    value: preview.value.hasTank ? formatWithUnit(preview.value.tankPercent, "%") : "--",
  },
  {
    label: "满箱续航",
    value:
      preview.value.hasTank && preview.value.hasBasic
        ? formatWithUnit(preview.value.fullRange, "km", 0)
        : "--",
  },
]);

const statItems = computed(() => [
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
.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 18rpx;

  @media (min-width: 700px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.records-wrap {
  margin-top: 20rpx;
}

.records-summary {
  padding: 20rpx 22rpx;
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.75);
  border: 1rpx solid var(--card-border);
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.records-title {
  font-size: 24rpx;
  font-weight: 600;
}

.records-sub {
  font-size: 22rpx;
  color: var(--ink-muted);
}

.preview-wrap {
  margin-top: 18rpx;
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
