<template>
  <view class="records">
    <view
      v-for="record in records"
      :key="record.id"
      class="record"
      :class="{ 'is-expanded': isExpanded(record.id) }"
    >
      <view class="record-head" @tap="toggle(record.id)">
        <view class="record-date">
          <view class="record-mark"></view>
          <text class="record-day">{{ formatShortDate(record.timestamp) }}</text>
        </view>
        <view class="record-mile">
          <text class="record-mile-value">{{ formatValue(record.mileage, 1) }}</text>
          <text v-if="formatValue(record.mileage, 1) !== '--'" class="record-mile-unit">公里</text>
          <uni-icons
            :type="isExpanded(record.id) ? 'arrow-down' : 'arrow-right'"
            size="16"
            color="#8aa2a8"
          ></uni-icons>
        </view>
      </view>

      <view v-if="isExpanded(record.id)" class="record-body">
        <view class="record-metrics">
          <view class="metric">
            <text class="metric-value">{{ formatWithUnit(record.amount, "元") }}</text>
          </view>
          <view class="metric">
            <text class="metric-value">{{ formatWithUnit(record.actualUnitPrice, "元/升") }}</text>
          </view>
          <view class="metric">
            <text class="metric-value">{{ formatSignedWithUnit(record.fuelAmount, "升") }}</text>
          </view>
        </view>
        <view class="record-meta">
          <view class="record-tags"></view>
          <view class="record-edit" @tap.stop="$emit('edit', record)">
            <uni-icons type="compose" size="18" color="#22c55e"></uni-icons>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { reactive } from "vue";
import type { RecordItem } from "@/composables/useMotoStore";

const props = defineProps<{
  records: RecordItem[];
  formatValue: (value: number, digits?: number) => string;
}>();

defineEmits<{ (e: "edit", record: RecordItem): void }>();

const expandedMap = reactive<Record<string, boolean>>({});

const isExpanded = (id: string) => !!expandedMap[id];

const toggle = (id: string) => {
  expandedMap[id] = !expandedMap[id];
};

const padNumber = (value: number) => `${value}`.padStart(2, "0");

const formatShortDate = (timestamp: number) => {
  const d = new Date(timestamp);
  return `${padNumber(d.getMonth() + 1)}/${padNumber(d.getDate())}`;
};

const formatWithUnit = (value: number, unit: string, digits = 2) => {
  const formatted = props.formatValue(value, digits);
  return formatted === "--" ? "--" : `${formatted}${unit}`;
};

const formatSignedWithUnit = (value: number, unit: string, digits = 2) => {
  const formatted = props.formatValue(value, digits);
  return formatted === "--" ? "--" : `+${formatted}${unit}`;
};
</script>

<style lang="scss" scoped>
.records {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.record {
  padding: 18rpx 20rpx;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.95);
  border: 1rpx solid rgba(16, 60, 66, 0.1);
  box-shadow: 0 12rpx 26rpx rgba(10, 82, 78, 0.08);
}

.record-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}

.record-date {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.record-mark {
  width: 6rpx;
  height: 26rpx;
  border-radius: 999rpx;
  background: #22c55e;
  box-shadow: 0 6rpx 12rpx rgba(34, 197, 94, 0.2);
}

.record-day {
  font-size: 26rpx;
  font-weight: 600;
  color: var(--ink);
}

.record-mile {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 26rpx;
  font-weight: 600;
  color: var(--ink);
}

.record-mile-unit {
  font-size: 22rpx;
  color: var(--ink-muted);
  margin-right: 2rpx;
}

.record-body {
  margin-top: 14rpx;
  padding-top: 14rpx;
  border-top: 1rpx dashed var(--line);
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.record-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12rpx;
}

.metric {
  display: flex;
  align-items: center;
}

.metric-value {
  font-size: 26rpx;
  font-weight: 600;
  color: var(--ink);
}

.record-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}

.record-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  min-height: 28rpx;
}

.record-edit {
  width: 44rpx;
  height: 44rpx;
  border-radius: 14rpx;
  background: rgba(34, 197, 94, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
