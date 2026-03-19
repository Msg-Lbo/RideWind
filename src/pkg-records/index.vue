<template>
  <app-page title="记录列表" subtitle="回看每次加油的详细数据" :pills="heroPills">
    <view v-if="records.length" class="year-summary">
      <view class="year-head">
        <view class="year-title">
          <text>{{ activeYear }}年</text>
          <uni-icons type="arrow-down" size="14" color="#7f97a1"></uni-icons>
        </view>
      </view>
      <view class="year-metrics">
        <view class="year-item">
          <text class="year-value">{{ yearAmountText }}</text>
        </view>
        <view class="year-item">
          <text class="year-value">{{ yearConsumptionText }}</text>
        </view>
        <view class="year-item">
          <text class="year-value">{{ yearDistanceText }}</text>
        </view>
      </view>
    </view>

    <app-empty v-if="!records.length" text="暂无记录，先去添加一条记录吧。" />
    <view v-else class="records-panel">
      <record-list :records="records" :format-value="formatValue" @edit="handleEdit" />
      <view class="records-actions">
        <app-button variant="warn" @tap="clearRecords">清空全部记录</app-button>
      </view>
    </view>
  </app-page>
</template>

<script setup lang="ts">
import { computed } from "vue";
import AppPage from "@/components/AppPage.vue";
import AppEmpty from "@/components/AppEmpty.vue";
import AppButton from "@/components/AppButton.vue";
import RecordList from "@/components/RecordList.vue";
import { useMotoStore } from "@/composables/useMotoStore";
import type { RecordItem } from "@/composables/useMotoStore";

const {
  records,
  vehicleDisplayName,
  tankCapacityDisplay,
  displacementDisplay,
  formatValue,
  startEditRecord,
  clearRecords,
} = useMotoStore();

const heroPills = computed(() => [
  { label: "爱车", value: vehicleDisplayName.value },
  { label: "油箱", value: tankCapacityDisplay.value },
  { label: "排量", value: displacementDisplay.value },
  { label: "记录", value: records.value.length ? `${records.value.length} 条` : "暂无" },
]);

const activeYear = computed(() => {
  if (!records.value.length) {
    return new Date().getFullYear();
  }
  return new Date(records.value[0].timestamp).getFullYear();
});

const yearRecords = computed(() =>
  records.value.filter((item) => new Date(item.timestamp).getFullYear() === activeYear.value)
);

const yearStats = computed(() => {
  const totalAmount = yearRecords.value.reduce((sum, item) => sum + item.amount, 0);
  const totalDistance = yearRecords.value.reduce((sum, item) => sum + item.distance, 0);
  const totalFuel = yearRecords.value.reduce((sum, item) => sum + item.fuelAmount, 0);
  const avgConsumption = totalDistance > 0 ? (totalFuel / totalDistance) * 100 : 0;

  return {
    totalAmount,
    totalDistance,
    avgConsumption,
  };
});

const formatWithUnit = (value: number, unit: string, digits = 2) => {
  const formatted = formatValue(value, digits);
  return formatted === "--" ? "--" : `${formatted}${unit}`;
};

const yearAmountText = computed(() => formatWithUnit(yearStats.value.totalAmount, "元"));
const yearConsumptionText = computed(() =>
  formatWithUnit(yearStats.value.avgConsumption, "升/百公里")
);
const yearDistanceText = computed(() => formatWithUnit(yearStats.value.totalDistance, "公里", 0));

const handleEdit = (record: RecordItem) => {
  const started = startEditRecord(record.id);
  if (!started) {
    return;
  }
  uni.switchTab({ url: "/pkg-refuel/index" });
};
</script>

<style lang="scss" scoped>
.year-summary {
  padding: 18rpx 20rpx;
  border-radius: 22rpx;
  background: rgba(233, 239, 241, 0.8);
  border: 1rpx solid rgba(16, 60, 66, 0.08);
  box-shadow: 0 14rpx 26rpx rgba(16, 29, 34, 0.06);
  margin-bottom: 20rpx;
}

.year-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.year-title {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 26rpx;
  font-weight: 600;
  color: var(--ink);
}

.year-metrics {
  margin-top: 14rpx;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12rpx;
}

.year-item {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.year-value {
  font-size: 26rpx;
  font-weight: 600;
  color: var(--ink);
}

.records-panel {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.records-actions {
  margin-top: 6rpx;
}
</style>
