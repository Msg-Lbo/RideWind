<template>
  <view class="empty">
    <text>{{ text }}</text>
  </view>
</template>

<script setup lang="ts">
defineProps<{ text: string }>();
</script>

<style lang="scss" scoped>
.empty {
  padding: 24rpx;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.6);
  border: 1rpx dashed rgba(17, 42, 49, 0.18);
  text-align: center;
  font-size: 24rpx;
  color: var(--ink-muted);

  text {
    line-height: 1.45;
  }
}
</style>
