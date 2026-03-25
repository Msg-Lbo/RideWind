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
        <view class="record-consumption">
          <text class="record-consumption-value">{{ formatConsumption(record) }}</text>
        </view>
        <view class="record-mile">
          <text class="record-mile-value">{{ formatDistance(record) }}</text>
          <text v-if="formatDistance(record) !== '--'" class="record-mile-unit">公里</text>
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

/**
 * 列表组件入参。
 *
 * - records: 待展示的记录数组
 * - formatValue: 父组件提供的数值格式化函数
 */
const props = defineProps<{
  records: RecordItem[];
  formatValue: (value: number, digits?: number) => string;
}>();

/**
 * 组件事件。
 * `edit`：通知父组件编辑指定记录。
 */
defineEmits<{ (e: "edit", record: RecordItem): void }>();

/** 记录展开状态映射表，key 为记录 id。 */
const expandedMap = reactive<Record<string, boolean>>({});

/**
 * 判断记录是否展开。
 *
 * @param id 记录 ID
 * @returns 是否展开
 */
const isExpanded = (id: string) => !!expandedMap[id];

/**
 * 切换记录展开状态。
 *
 * @param id 记录 ID
 */
const toggle = (id: string) => {
  expandedMap[id] = !expandedMap[id];
};

/**
 * 数字补零到两位。
 *
 * @param value 原始数字
 * @returns 两位字符串
 */
const padNumber = (value: number) => `${value}`.padStart(2, "0");

/**
 * 格式化短日期（MM/DD）。
 *
 * @param timestamp 时间戳
 * @returns 日期文本
 */
const formatShortDate = (timestamp: number) => {
  const d = new Date(timestamp);
  return `${padNumber(d.getMonth() + 1)}/${padNumber(d.getDate())}`;
};

/**
 * 拼接单位展示。
 *
 * @param value 原始值
 * @param unit 单位
 * @param digits 小数位
 * @returns 展示字符串
 */
const formatWithUnit = (value: number, unit: string, digits = 2) => {
  const formatted = props.formatValue(value, digits);
  return formatted === "--" ? "--" : `${formatted}${unit}`;
};

/**
 * 统一显示里程字段。
 * 优先使用 `distance`（本次里程），缺失时回退到 `mileage`。
 *
 * @param record 记录对象
 * @returns 展示用里程文本
 */
const formatDistance = (record: RecordItem) => {
  const distance = record.distance > 0 ? record.distance : record.mileage;
  return props.formatValue(distance, 1);
};

/**
 * 展示对应记录的百公里油耗。
 *
 * @param record 记录对象
 * @returns 油耗文本，例如 `5.96L/100km`
 */
const formatConsumption = (record: RecordItem) => {
  return formatWithUnit(record.consumption, "L/100km");
};

/**
 * 带正号的单位展示（例如 +5.96升）。
 *
 * @param value 原始值
 * @param unit 单位
 * @param digits 小数位
 * @returns 展示字符串
 */
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

  .record {
    padding: 18rpx 20rpx;
    border-radius: 20rpx;
    background: rgba(255, 255, 255, 0.95);
    border: 1rpx solid rgba(16, 60, 66, 0.1);
    box-shadow: 0 12rpx 26rpx rgba(10, 82, 78, 0.08);

    &-head {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: 12rpx;
    }

    &-consumption {
      min-width: 0;
      display: flex;
      justify-content: center;

      &-value {
        max-width: 100%;
        font-size: 24rpx;
        font-weight: 600;
        color: var(--ink-soft);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    &-date {
      display: flex;
      align-items: center;
      gap: 10rpx;
    }

    &-mark {
      width: 6rpx;
      height: 26rpx;
      border-radius: 999rpx;
      background: #22c55e;
      box-shadow: 0 6rpx 12rpx rgba(34, 197, 94, 0.2);
    }

    &-day {
      font-size: 26rpx;
      font-weight: 600;
      color: var(--ink);
    }

    &-mile {
      display: flex;
      align-items: center;
      gap: 8rpx;
      font-size: 26rpx;
      font-weight: 600;
      color: var(--ink);

      &-unit {
        font-size: 22rpx;
        color: var(--ink-muted);
        margin-right: 2rpx;
      }
    }

    &-body {
      margin-top: 14rpx;
      padding-top: 14rpx;
      border-top: 1rpx dashed var(--line);
      display: flex;
      flex-direction: column;
      gap: 12rpx;
    }

    &-metrics {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12rpx;
    }

    &-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12rpx;
    }

    &-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8rpx;
      min-height: 28rpx;
    }

    &-edit {
      width: 44rpx;
      height: 44rpx;
      border-radius: 14rpx;
      background: rgba(34, 197, 94, 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .metric {
    display: flex;
    align-items: center;

    &-value {
      font-size: 26rpx;
      font-weight: 600;
      color: var(--ink);
    }
  }
}
</style>
