<template>
  <app-page title="我的" :show-hero="false">
    <view class="profile-card">
      <view class="avatar">
        <text class="avatar-text">骑</text>
      </view>
      <view class="profile-info">
        <text class="nickname">{{ nickname }}</text>
        <text class="vehicle-meta">{{ vehicleMeta }}</text>
      </view>
    </view>

    <view class="menu-card">
      <view class="menu-item" @tap="goToVehicle">
        <view class="menu-left">
          <text class="menu-title">爱车信息</text>
          <text class="menu-desc">填写车名、排量、油箱容量</text>
        </view>
        <uni-icons type="arrow-right" size="17" color="#8aa2a8"></uni-icons>
      </view>

      <view class="menu-item" @tap="goToAbout">
        <view class="menu-left">
          <text class="menu-title">关于</text>
          <text class="menu-desc">版本信息与应用说明</text>
        </view>
        <uni-icons type="arrow-right" size="17" color="#8aa2a8"></uni-icons>
      </view>
    </view>
  </app-page>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import AppPage from "@/components/AppPage.vue";
import { useMotoStore } from "@/composables/useMotoStore";

const { vehicleDisplayName, displacementDisplay, tankCapacityDisplay } = useMotoStore();

const nickname = computed(() =>
  vehicleDisplayName.value === "未命名" ? "行悉用户" : `${vehicleDisplayName.value} 车主`
);

const vehicleMeta = computed(
  () =>
    `车名 ${vehicleDisplayName.value}  ·  排量 ${displacementDisplay.value}  ·  油箱 ${tankCapacityDisplay.value}`
);

const isNavigating = ref(false);

const goTo = (url: string) => {
  if (isNavigating.value) {
    return;
  }
  isNavigating.value = true;
  uni.navigateTo({
    url,
    complete: () => {
      isNavigating.value = false;
    },
  });
};

const goToVehicle = () => {
  goTo("/subpkg-mine/vehicle/index");
};

const goToAbout = () => {
  goTo("/subpkg-mine/about/index");
};
</script>

<style lang="scss" scoped>
.profile-card,
.menu-card {
  margin-bottom: 24rpx;
  padding: 26rpx;
  border-radius: 28rpx;
  border: 1rpx solid var(--card-border);
  background: rgba(255, 255, 255, 0.85);
  box-shadow: var(--shadow);
}

.profile-card {
  display: flex;
  align-items: center;
  gap: 20rpx;

  .avatar {
    width: 98rpx;
    height: 98rpx;
    border-radius: 50%;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(140deg, #9ed7d1 0%, #5ec4b9 100%);
    box-shadow: 0 10rpx 24rpx rgba(20, 184, 166, 0.24);

    &-text {
      color: #ffffff;
      font-size: 40rpx;
      font-weight: 600;
    }
  }

  .profile-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 10rpx;

    .nickname {
      font-size: 30rpx;
      font-weight: 600;
      color: var(--ink);
    }

    .vehicle-meta {
      font-size: 22rpx;
      color: var(--ink-soft);
      line-height: 1.45;
    }
  }
}

.menu-card {
  .menu-item {
    padding: 22rpx 2rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16rpx;
    border-bottom: 1rpx solid rgba(16, 60, 66, 0.08);

    &:last-child {
      border-bottom: none;
    }
  }

  .menu-left {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 8rpx;

    .menu-title {
      font-size: 28rpx;
      font-weight: 600;
      color: var(--ink);
    }

    .menu-desc {
      font-size: 22rpx;
      color: var(--ink-muted);
    }
  }
}
</style>
