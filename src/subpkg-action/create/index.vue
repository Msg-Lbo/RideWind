<template>
  <app-page title="新增记录" subtitle="选择要添加的记录类型" :show-hero="false" back-home>
    <view class="entry-hero">
      <text class="entry-title">新增记录</text>
      <text class="entry-sub">本次是要添加油耗记录，还是保养记录？</text>
    </view>

    <app-card title="记录类型" desc="选择后会进入对应录入页">
      <view class="choice-list">
        <view class="choice-item fuel" @tap="goToFuel">
          <view class="choice-icon fuel-icon">
            <uni-icons type="fire" size="22" color="#0ea59a"></uni-icons>
          </view>
          <view class="choice-main">
            <text class="choice-title">添加油耗记录</text>
            <text class="choice-desc">记录本次加油，自动计算油耗与油费趋势</text>
          </view>
          <uni-icons type="arrow-right" size="18" color="#8aa2a8"></uni-icons>
        </view>

        <view class="choice-item maintain" @tap="goToMaintenance">
          <view class="choice-icon maintain-icon">
            <uni-icons type="gear" size="22" color="#f07d4e"></uni-icons>
          </view>
          <view class="choice-main">
            <text class="choice-title">添加保养记录</text>
            <text class="choice-desc">记录保养项目与时间，方便后续维护管理</text>
          </view>
          <uni-icons type="arrow-right" size="18" color="#8aa2a8"></uni-icons>
        </view>
      </view>
    </app-card>

    <view class="cancel-wrap">
      <app-button variant="ghost" @tap="handleCancel">暂不添加</app-button>
    </view>
  </app-page>
</template>

<script setup lang="ts">
import { ref } from "vue";
import AppPage from "@/components/AppPage.vue";
import AppCard from "@/components/AppCard.vue";
import AppButton from "@/components/AppButton.vue";

const isNavigating = ref(false);

const releaseNavigationLock = (immediate = false) => {
  const delay = immediate ? 0 : 260;
  setTimeout(() => {
    isNavigating.value = false;
  }, delay);
};

const switchToTab = (url: string) => {
  if (isNavigating.value) {
    return;
  }
  isNavigating.value = true;
  uni.switchTab({
    url,
    success: () => {
      releaseNavigationLock();
    },
    fail: () => {
      releaseNavigationLock(true);
    },
  });
};

const goToFuel = () => {
  switchToTab("/pkg-refuel/index");
};

const goToMaintenance = () => {
  if (isNavigating.value) {
    return;
  }
  isNavigating.value = true;
  uni.navigateTo({
    url: "/subpkg-maintenance/create/index",
    success: () => {
      releaseNavigationLock();
    },
    fail: () => {
      releaseNavigationLock(true);
    },
  });
};

const handleCancel = () => {
  switchToTab("/pkg-curve/index");
};
</script>

<style lang="scss" scoped>

.entry {
  &-hero {
    position: relative;
    z-index: 1;
    margin-bottom: 28rpx;
  }

  &-title {
    font-family: var(--font-title);
    font-size: 42rpx;
    font-weight: 700;
    letter-spacing: 2rpx;
  }

  &-sub {
    margin-top: 10rpx;
    font-size: 24rpx;
    color: var(--ink-soft);
  }
}

.choice {
  &-list {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
  }

  &-item {
    border: 1rpx solid var(--card-border);
    border-radius: 22rpx;
    padding: 20rpx 18rpx;
    background: rgba(255, 255, 255, 0.85);
    display: flex;
    align-items: center;
    gap: 14rpx;

    &.fuel {
      box-shadow: 0 14rpx 26rpx rgba(20, 184, 166, 0.14);
    }

    &.maintain {
      box-shadow: 0 14rpx 26rpx rgba(255, 122, 89, 0.12);
    }
  }

  &-icon {
    width: 62rpx;
    height: 62rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &-main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 8rpx;
  }

  &-title {
    font-size: 28rpx;
    font-weight: 600;
    color: var(--ink);
  }

  &-desc {
    font-size: 22rpx;
    color: var(--ink-muted);
    line-height: 1.4;
  }
}

.fuel-icon {
  background: rgba(20, 184, 166, 0.14);
}

.maintain-icon {
  background: rgba(255, 122, 89, 0.16);
}

.cancel-wrap {
  margin-top: 12rpx;
}
</style>
