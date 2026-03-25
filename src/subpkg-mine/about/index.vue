<template>
  <app-page title="关于" subtitle="行悉录（Xeloo）应用信息与说明">
    <app-card title="应用信息" desc="当前版本与功能说明">
      <view class="about-list">
        <view class="about-item">
          <text class="about-label">应用名称</text>
          <text class="about-value">行悉录</text>
        </view>
        <view class="about-item">
          <text class="about-label">英文名</text>
          <text class="about-value">Xeloo</text>
        </view>
        <view class="about-item">
          <text class="about-label">版本号</text>
          <text class="about-value">1.0.1</text>
        </view>
        <view class="about-item">
          <text class="about-label">功能简介</text>
          <text class="about-value">记录加油数据，统计油耗趋势与花费。</text>
        </view>
      </view>
    </app-card>
  </app-page>
</template>

<script setup lang="ts">
import AppPage from "@/components/AppPage.vue";
import AppCard from "@/components/AppCard.vue";
</script>

<style lang="scss" scoped>
.about-list {
  display: flex;
  flex-direction: column;
  gap: 14rpx;

  .about-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20rpx;
    padding: 16rpx 18rpx;
    border-radius: 16rpx;
    border: 1rpx solid var(--card-border);
    background: rgba(255, 255, 255, 0.75);

    .about-label {
      flex-shrink: 0;
      font-size: 24rpx;
      color: var(--ink-muted);
    }

    .about-value {
      font-size: 24rpx;
      color: var(--ink);
      text-align: right;
      line-height: 1.45;
    }
  }
}
</style>
