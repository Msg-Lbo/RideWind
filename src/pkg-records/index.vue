<template>
  <app-page title="记录列表" subtitle="回看每次加油的详细数据" :pills="heroPills">
    <view v-if="records.length" class="year-summary">
      <picker class="year-picker" mode="selector" :range="yearOptions" :value="activeYearIndex" @change="onYearChange">
        <view class="year-head">
          <view class="year-title">
            <text>{{ activeYear }}年</text>
            <uni-icons type="arrow-down" size="14" color="#7f97a1"></uni-icons>
          </view>
          <text class="year-count">{{ yearRecords.length }} 条</text>
        </view>
      </picker>
      <view class="year-metrics">
        <view class="year-item">
          <text class="year-label">平均花费</text>
          <text class="year-value">{{ yearAvgAmountText }}</text>
        </view>
        <view class="year-item">
          <text class="year-label">平均油耗</text>
          <text class="year-value">{{ yearAvgConsumptionText }}</text>
        </view>
        <view class="year-item">
          <text class="year-label">平均里程</text>
          <text class="year-value">{{ yearAvgDistanceText }}</text>
        </view>
      </view>
    </view>

    <app-empty v-if="!records.length" text="暂无记录，先去添加一条记录吧。" />
    <view v-else class="records-panel">
      <record-list :records="yearRecords" :format-value="formatValue" @edit="handleEdit" />
      <view class="records-actions">
        <app-button variant="warn" @tap="clearRecords">清空全部记录</app-button>
      </view>
    </view>
  </app-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
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

/**
 * 由记录反推可选年份列表（按从新到旧排序）。
 */
const yearOptions = computed(() => {
  const years = records.value.map((item) => `${new Date(item.timestamp).getFullYear()}`);
  return [...new Set(years)].sort((a, b) => Number(b) - Number(a));
});

/** 当前选中的年份（字符串形式，便于与 picker range 对齐）。 */
const selectedYear = ref("");

/**
 * 当年份列表变化时，自动校正当前选中项。
 */
watch(
  yearOptions,
  (options) => {
    if (!options.length) {
      selectedYear.value = "";
      return;
    }
    if (!options.includes(selectedYear.value)) {
      selectedYear.value = options[0];
    }
  },
  { immediate: true }
);

/** 当前生效年份（数值形式）。 */
const activeYear = computed(() => {
  if (!selectedYear.value) {
    return new Date().getFullYear();
  }
  return Number(selectedYear.value);
});

/** picker 需要的下标值。 */
const activeYearIndex = computed(() => {
  const index = yearOptions.value.indexOf(`${activeYear.value}`);
  return index >= 0 ? index : 0;
});

/** 年份选择器事件结构。 */
type YearPickerChangeEvent = {
  detail: {
    /** picker 返回的是下标，可能是字符串或数字 */
    value: string | number;
  };
};

/**
 * 切换统计年份。
 *
 * @param event 年份选择器事件
 */
const onYearChange = (event: YearPickerChangeEvent) => {
  const index = Number(event.detail.value);
  if (Number.isNaN(index) || index < 0 || index >= yearOptions.value.length) {
    return;
  }
  selectedYear.value = yearOptions.value[index];
};

/** 当前年份的记录列表。 */
const yearRecords = computed(() =>
  records.value.filter((item) => new Date(item.timestamp).getFullYear() === activeYear.value)
);

/** 当前年份统计结果（平均值）。 */
const yearStats = computed(() => {
  const count = yearRecords.value.length;
  const totalAmount = yearRecords.value.reduce((sum, item) => sum + item.amount, 0);
  const totalDistance = yearRecords.value.reduce((sum, item) => sum + item.distance, 0);
  const totalFuel = yearRecords.value.reduce((sum, item) => sum + item.fuelAmount, 0);
  const avgAmount = count > 0 ? totalAmount / count : 0;
  const avgDistance = count > 0 ? totalDistance / count : 0;
  const avgConsumption = totalDistance > 0 ? (totalFuel / totalDistance) * 100 : 0;

  return {
    avgAmount,
    avgDistance,
    avgConsumption,
  };
});

/**
 * 统一拼接数值和单位。
 *
 * @param value 原始数值
 * @param unit 单位
 * @param digits 小数位
 * @returns 展示文本
 */
const formatWithUnit = (value: number, unit: string, digits = 2) => {
  const formatted = formatValue(value, digits);
  return formatted === "--" ? "--" : `${formatted}${unit}`;
};

const yearAvgAmountText = computed(() => formatWithUnit(yearStats.value.avgAmount, "元"));
const yearAvgConsumptionText = computed(() =>
  formatWithUnit(yearStats.value.avgConsumption, "升/百公里")
);
const yearAvgDistanceText = computed(() => formatWithUnit(yearStats.value.avgDistance, "公里", 1));

/**
 * 点击列表项“编辑”后，进入加油页编辑模式。
 *
 * @param record 当前选中的记录
 */
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

.year-picker {
  display: block;
}

.year-title {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 26rpx;
  font-weight: 600;
  color: var(--ink);
}

.year-count {
  font-size: 22rpx;
  color: var(--ink-muted);
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

.year-label {
  font-size: 22rpx;
  color: var(--ink-muted);
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
