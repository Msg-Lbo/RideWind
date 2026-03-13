<template>
  <view class="metrics" :class="gridClass">
    <view v-for="item in items" :key="item.label" class="metric">
      <text class="metric-label">{{ item.label }}</text>
      <text class="metric-value">{{ item.value }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue";

type MetricItem = {
  label: string;
  value: string;
};

const props = withDefaults(
  defineProps<{ items: MetricItem[]; columns?: number }>(),
  { columns: 2 }
);

const gridClass = computed(() => `cols-${props.columns}`);
</script>

<style lang="scss" scoped>
.metrics {
  display: grid;
  gap: 14rpx;
  grid-template-columns: repeat(2, minmax(0, 1fr));

  &.cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  &.cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .metric {
    padding: 14rpx;
    border-radius: 18rpx;
    background: rgba(255, 255, 255, 0.85);
    border: 1rpx solid var(--card-border);
    display: flex;
    flex-direction: column;
    gap: 6rpx;

    &-label {
      font-size: 22rpx;
      color: var(--ink-muted);
    }

    &-value {
      font-size: 26rpx;
      font-weight: 600;
    }
  }
}
</style>
