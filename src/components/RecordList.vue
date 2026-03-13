<template>
  <view class="records">
    <view v-for="record in records" :key="record.id" class="record">
      <view class="record-top">
        <view class="record-time">{{ record.time }}</view>
        <button class="record-delete" @tap="$emit('remove', record.id)">删除</button>
      </view>
      <view class="record-grid">
        <view class="record-item">
          <text class="record-label">加油量</text>
          <text class="record-value">{{ formatValue(record.fuelAmount) }} L</text>
        </view>
        <view class="record-item">
          <text class="record-label">里程</text>
          <text class="record-value">{{ formatValue(record.distance, 0) }} km</text>
        </view>
        <view class="record-item">
          <text class="record-label">金额</text>
          <text class="record-value">{{ formatValue(record.amount) }} 元</text>
        </view>
        <view class="record-item">
          <text class="record-label">油耗</text>
          <text class="record-value">{{ formatValue(record.consumption) }} L/100km</text>
        </view>
        <view class="record-item">
          <text class="record-label">油费</text>
          <text class="record-value">{{ formatValue(record.costPer100) }} 元/100km</text>
        </view>
        <view class="record-item">
          <text class="record-label">满箱续航</text>
          <text class="record-value">
            {{ record.fullRange ? formatValue(record.fullRange, 0) : "--" }} km
          </text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { RecordItem } from "@/composables/useMotoStore";

defineProps<{
  records: RecordItem[];
  formatValue: (value: number, digits?: number) => string;
}>();

defineEmits<{ (e: "remove", id: string): void }>();
</script>

<style lang="scss" scoped>
.records {
  display: flex;
  flex-direction: column;
  gap: 16rpx;

  .record {
    padding: 20rpx;
    border-radius: 20rpx;
    background: rgba(255, 255, 255, 0.9);
    border: 1rpx solid var(--card-border);
    box-shadow: 0 12rpx 26rpx rgba(10, 82, 78, 0.08);

    &-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 14rpx;
    }

    &-time {
      font-size: 22rpx;
      color: var(--ink-muted);
    }

    &-delete {
      font-size: 24rpx;
      padding: 0 24rpx;
      border-radius: 12rpx;
      background: rgba(220, 95, 68, 0.08);
      color: #b3532d;
      border: none;
      flex-shrink: 0;
      margin: 0;
      
      &::after {
        border: none;
      }
    }

    &-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12rpx;
    }

    &-item {
      display: flex;
      flex-direction: column;
      gap: 6rpx;
    }

    &-label {
      font-size: 22rpx;
      color: var(--ink-muted);
    }

    &-value {
      font-size: 24rpx;
      font-weight: 600;
    }
  }
}
</style>
