<template>
  <view class="tabbar-shell">
    <view class="tabbar">
      <view
        v-for="item in tabItems"
        :key="item.pagePath"
        class="tab-item"
        :class="{ active: isActive(item), center: item.isCenter }"
        @tap="switchTo(item)"
      >
        <view v-if="item.isCenter" class="center-btn">
          <uni-icons type="plus" size="28" color="#ffffff"></uni-icons>
        </view>
        <template v-else>
          <uni-icons
            :type="isActive(item) ? item.activeIcon : item.icon"
            size="22"
            :color="isActive(item) ? '#14B8A6' : '#2f3f45'"
          ></uni-icons>
          <text class="tab-text">{{ item.text }}</text>
        </template>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from "@dcloudio/uni-app";
import { onMounted, ref } from "vue";

type TabItem = {
  text: string;
  pagePath: string;
  icon: string;
  activeIcon: string;
  isCenter?: boolean;
};

const tabItems: TabItem[] = [
  {
    text: "油耗曲线",
    pagePath: "/pkg-curve/index",
    icon: "fire",
    activeIcon: "fire-filled",
  },
  {
    text: "列表",
    pagePath: "/pkg-records/index",
    icon: "list",
    activeIcon: "list",
  },
  {
    text: "加油",
    pagePath: "/pkg-refuel/index",
    icon: "plus",
    activeIcon: "plus",
    isCenter: true,
  },
  {
    text: "保养记录",
    pagePath: "/pkg-maintenance/index",
    icon: "gear",
    activeIcon: "gear-filled",
  },
  {
    text: "我的",
    pagePath: "/pkg-mine/index",
    icon: "person",
    activeIcon: "person-filled",
  },
];

const CREATE_PAGE_PATH = "/subpkg-action/create/index";

const activePath = ref("");
const isNavigating = ref(false);

const normalizePath = (path: string) => `/${path.replace(/^\//, "")}`;

const syncActivePath = () => {
  const pages = getCurrentPages();
  if (!pages.length) {
    return;
  }
  const current = pages[pages.length - 1] as { route?: string };
  activePath.value = normalizePath(current.route || "");
};

const isActive = (item: TabItem) => activePath.value === item.pagePath;

const openCreatePage = () => {
  if (isNavigating.value) {
    return;
  }
  isNavigating.value = true;
  uni.navigateTo({
    url: CREATE_PAGE_PATH,
    complete: () => {
      isNavigating.value = false;
    },
  });
};

const switchTo = (item: TabItem) => {
  if (item.isCenter) {
    openCreatePage();
    return;
  }
  if (isActive(item)) {
    return;
  }
  activePath.value = item.pagePath;
  uni.switchTab({
    url: item.pagePath,
    fail: () => {
      syncActivePath();
    },
  });
};

onMounted(syncActivePath);
onShow(syncActivePath);
</script>

<style lang="scss" scoped>
.tabbar-shell {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 99;
}

.tabbar {
  display: flex;
  align-items: flex-end;
  padding: 12rpx 12rpx calc(14rpx + env(safe-area-inset-bottom));
  background: #f3f5f6;
  border-top: 1rpx solid rgba(16, 60, 66, 0.08);
  box-shadow: 0 -8rpx 24rpx rgba(10, 26, 34, 0.06);
}

.tab-item {
  flex: 1;
  min-width: 0;
  height: 88rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
  color: #6f8086;
}

.tab-item.active {
  color: #14b8a6;
}

.tab-item.center {
  transform: translateY(-22rpx);
}

.center-btn {
  width: 88rpx;
  height: 88rpx;
  border-radius: 999rpx;
  background: #12bb63;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 16rpx 28rpx rgba(18, 187, 99, 0.34);
}

.tab-text {
  font-size: 22rpx;
  line-height: 1.1;
  white-space: nowrap;
}
</style>
