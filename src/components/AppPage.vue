<template>
  <view class="page" :style="{
    '--nav-height': `${navHeight}px`,
    '--nav-content-height': `${navContentHeight}px`,
    '--nav-status-height': `${statusBarHeight}px`,
    '--nav-side-padding': `${navSidePadding}px`,
  }">
    <view class="page-nav" :class="{ 'is-scrolled': isScrolled }">
      <view class="nav-content">
        <view v-if="canGoBack" class="nav-back" @tap="goBack">
          <uni-icons type="back" size="28" color="#1e6a5a"></uni-icons>
        </view>
        <text class="nav-title">{{ props.title }}</text>
      </view>
    </view>
    <view class="bg-orb orb-1"></view>
    <view class="bg-orb orb-2"></view>
    <view class="bg-orb orb-3"></view>

    <view v-if="props.showHero && hasHeroContent" class="hero">
      <text v-if="props.title" class="hero-title">{{ props.title }}</text>
      <text v-if="props.subtitle" class="hero-sub">{{ props.subtitle }}</text>
      <view v-if="props.pills.length" class="hero-pills">
        <view v-for="pill in props.pills" :key="pill.label" class="pill">
          <text class="pill-label">{{ pill.label }}</text>
          <text class="pill-value">{{ pill.value }}</text>
        </view>
      </view>
    </view>

    <slot />
  </view>
</template>

<script setup lang="ts">
import { onPageScroll, onShow } from "@dcloudio/uni-app";
import { computed, onMounted, ref } from "vue";

type Pill = {
  label: string;
  value: string;
};

const props = withDefaults(
  defineProps<{ title?: string; subtitle?: string; pills?: Pill[]; showHero?: boolean }>(),
  {
    title: "",
    subtitle: "",
    pills: () => [],
    showHero: true,
  }
);
const hasHeroContent = computed(() => !!(props.title || props.subtitle || props.pills.length));

const statusBarHeight = ref(0);
const navBarHeight = ref(44);
const navSidePadding = ref(16);
const isScrolled = ref(false);
const canGoBack = ref(false);

const navHeight = computed(() => statusBarHeight.value + navBarHeight.value);
const navContentHeight = computed(() => navBarHeight.value || 44);

const updateNavMetrics = () => {
  const info = uni.getSystemInfoSync();
  statusBarHeight.value = info.statusBarHeight || 0;
  const windowWidth = info.windowWidth || 0;

  if (typeof uni.getMenuButtonBoundingClientRect === "function") {
    const menuRect = uni.getMenuButtonBoundingClientRect();
    if (menuRect && menuRect.height) {
      navBarHeight.value = menuRect.height + (menuRect.top - statusBarHeight.value) * 2;
      navSidePadding.value = Math.max(16, windowWidth - menuRect.left + 8);
      return;
    }
  }

  navBarHeight.value = 44;
  navSidePadding.value = 16;
};

const TAB_PAGES = [
  "pkg-curve/index",
  "pkg-records/index",
  "pkg-refuel/index",
  "pkg-maintenance/index",
  "pkg-mine/index",
];
const TAB_PAGE_PATHS = TAB_PAGES.map((path) => `/${path}`);

const syncCustomTabbar = () => {
  const pages = getCurrentPages() as Array<{ route?: string; getTabBar?: () => any }>;
  if (!pages.length) {
    return;
  }
  const current = pages[pages.length - 1];
  const route = `/${(current.route || "").replace(/^\//, "")}`;
  const tabIndex = TAB_PAGE_PATHS.indexOf(route);
  if (tabIndex < 0 || typeof current.getTabBar !== "function") {
    return;
  }
  const tabBar = current.getTabBar();
  if (!tabBar) {
    return;
  }
  if (typeof tabBar.updateSelectedByPath === "function") {
    tabBar.updateSelectedByPath(route);
    return;
  }
  if (typeof tabBar.setData !== "function") {
    return;
  }
  const selected = typeof tabBar.data?.selected === "number" ? tabBar.data.selected : -1;
  if (selected !== tabIndex) {
    tabBar.setData({ selected: tabIndex });
  }
};

const updateCanGoBack = () => {
  const pages = getCurrentPages();
  if (pages.length <= 1) {
    canGoBack.value = false;
    return;
  }
  const current = pages[pages.length - 1] as { route?: string };
  const route = (current.route || "").replace(/^\//, "");
  canGoBack.value = !TAB_PAGES.includes(route);
};

const goBack = () => {
  if (!canGoBack.value) {
    uni.switchTab({ url: "/pkg-curve/index" });
    return;
  }
  uni.navigateBack({
    delta: 1,
    fail: () => {
      uni.switchTab({ url: "/pkg-curve/index" });
    },
  });
};

onMounted(() => {
  updateNavMetrics();
  updateCanGoBack();
  syncCustomTabbar();
  setTimeout(syncCustomTabbar, 16);
});

onShow(() => {
  updateCanGoBack();
  syncCustomTabbar();
  setTimeout(syncCustomTabbar, 16);
});

onPageScroll((event) => {
  isScrolled.value = event.scrollTop > 6;
});
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  padding: calc(var(--nav-height, 0px) + 36rpx) 24rpx calc(152rpx + constant(safe-area-inset-bottom));
  padding: calc(var(--nav-height, 0px) + 36rpx) 24rpx calc(152rpx + env(safe-area-inset-bottom));
  position: relative;
  overflow: hidden;

  :deep(.card:last-child) {
    margin-bottom: 0;
  }

  .page-nav {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: var(--nav-height, 0px);
    padding-top: var(--nav-status-height, 0px);
    z-index: 10;
    background: transparent;
    transition: background 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
    border-bottom: 1rpx solid transparent;
    backdrop-filter: blur(12rpx);

    &.is-scrolled {
      background: rgba(233, 253, 247, 0.92);
      border-bottom-color: var(--line);
      box-shadow: 0 12rpx 24rpx rgba(16, 29, 34, 0.08);
    }
  }

  .nav-content {
    height: var(--nav-content-height, 44px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 var(--nav-side-padding, 16px);
    position: relative;
  }

  .nav-title {
    font-family: var(--font-title);
    font-size: 30rpx;
    font-weight: 600;
    color: var(--ink);
    max-width: 70%;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .nav-back {
    position: absolute;
    left: 24rpx;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16rpx 32rpx;
    border-radius: 999rpx;
    background: rgba(255, 255, 255, 0.7);
    border: 1rpx solid var(--line);
    box-shadow: 0 8rpx 20rpx rgba(10, 82, 78, 0.08);
  }

  .bg-orb {
    position: absolute;
    border-radius: 999rpx;
    filter: blur(60rpx);
    opacity: 0.4;
    z-index: 0;

    &.orb-1 {
      width: 420rpx;
      height: 420rpx;
      top: -120rpx;
      right: -140rpx;
      background: radial-gradient(circle at 30% 30%, rgba(20, 184, 166, 0.5), transparent 60%);
    }

    &.orb-2 {
      width: 360rpx;
      height: 360rpx;
      bottom: 280rpx;
      left: -120rpx;
      background: radial-gradient(circle at 70% 30%, rgba(255, 122, 89, 0.45), transparent 60%);
    }

    &.orb-3 {
      width: 260rpx;
      height: 260rpx;
      top: 420rpx;
      left: 60rpx;
      background: radial-gradient(circle at 30% 30%, rgba(92, 165, 255, 0.35), transparent 65%);
    }
  }

  .hero {
    position: relative;
    z-index: 1;
    margin-bottom: 28rpx;

    &-title {
      font-family: var(--font-title);
      font-size: 44rpx;
      font-weight: 700;
      letter-spacing: 2rpx;
    }

    &-sub {
      margin-top: 10rpx;
      font-size: 24rpx;
      color: var(--ink-soft);
    }

    &-pills {
      margin-top: 18rpx;
      display: flex;
      flex-wrap: wrap;
      gap: 12rpx;
    }
  }

  .pill {
    display: flex;
    align-items: center;
    gap: 8rpx;
    padding: 10rpx 18rpx;
    border-radius: 999rpx;
    background: rgba(255, 255, 255, 0.75);
    border: 1rpx solid var(--card-border);
    box-shadow: 0 10rpx 30rpx rgba(16, 29, 34, 0.08);

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
