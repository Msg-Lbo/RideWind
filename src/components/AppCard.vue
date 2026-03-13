<template>
  <view class="card">
    <view v-if="title || desc" class="card-head">
      <text v-if="title" class="card-title">{{ title }}</text>
      <text v-if="desc" class="card-desc">{{ desc }}</text>
    </view>
    <view class="card-body">
      <slot />
    </view>
    <view v-if="$slots.actions" class="actions">
      <slot name="actions" />
    </view>
  </view>
</template>

<script setup lang="ts">
defineProps<{ title?: string; desc?: string }>();
</script>

<style lang="scss">
.card {
  position: relative;
  z-index: 1;
  background: var(--card-bg);
  border-radius: 28rpx;
  padding: 26rpx;
  border: 1rpx solid var(--card-border);
  box-shadow: var(--shadow);
  margin-bottom: 24rpx;
  backdrop-filter: blur(6rpx);

  &.solid-card {
    background: #ffffff;
    backdrop-filter: none;
  }

  .card-head {
    display: flex;
    flex-direction: column;
    gap: 8rpx;
    margin-bottom: 18rpx;
  }

  .card-title {
    font-family: var(--font-title);
    font-size: 32rpx;
    font-weight: 600;
  }

  .card-desc {
    font-size: 24rpx;
    color: var(--ink-muted);
  }

  .actions {
    margin-top: 20rpx;
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    align-items: stretch;
    gap: 12rpx;
  }
}
</style>
