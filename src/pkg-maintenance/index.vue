<template>
  <app-page title="保养记录" subtitle="功能开发中，先使用骨架屏占位">
    <view class="skeleton-card">
      <view class="skeleton-line title"></view>
      <view class="skeleton-line sub"></view>
      <view class="skeleton-grid">
        <view class="skeleton-pill"></view>
        <view class="skeleton-pill"></view>
      </view>
    </view>

    <view class="skeleton-card">
      <view class="skeleton-line title short"></view>
      <view class="skeleton-row" v-for="item in 4" :key="item">
        <view class="skeleton-dot"></view>
        <view class="skeleton-line row"></view>
        <view class="skeleton-line value"></view>
      </view>
    </view>
  </app-page>
</template>

<script setup lang="ts">
import AppPage from "@/components/AppPage.vue";
</script>

<style lang="scss" scoped>
.skeleton-card {
  margin-bottom: 24rpx;
  padding: 26rpx;
  border-radius: 28rpx;
  border: 1rpx solid var(--card-border);
  background: rgba(255, 255, 255, 0.85);
  box-shadow: var(--shadow);
}

.skeleton-line,
.skeleton-pill,
.skeleton-dot {
  background: linear-gradient(90deg, rgba(220, 232, 236, 0.9) 25%, rgba(241, 247, 249, 0.9) 50%, rgba(220, 232, 236, 0.9) 75%);
  background-size: 220% 100%;
  animation: shimmer 1.2s linear infinite;
}

.skeleton-line {
  height: 24rpx;
  border-radius: 12rpx;
}

.skeleton-line.title {
  width: 42%;
}

.skeleton-line.title.short {
  width: 30%;
}

.skeleton-line.sub {
  width: 64%;
  margin-top: 14rpx;
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12rpx;
  margin-top: 20rpx;
}

.skeleton-pill {
  height: 70rpx;
  border-radius: 16rpx;
}

.skeleton-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 18rpx;
}

.skeleton-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
}

.skeleton-line.row {
  flex: 1;
}

.skeleton-line.value {
  width: 26%;
}

@keyframes shimmer {
  0% {
    background-position: 100% 0;
  }

  100% {
    background-position: -120% 0;
  }
}
</style>
