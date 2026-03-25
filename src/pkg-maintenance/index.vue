<template>
  <app-page
    title="保养记录"
    subtitle="历史直接查看，新增在独立页面完成"
    :pills="heroPills"
    page-bg="linear-gradient(160deg, #fff4ea 0%, #fff9f3 52%, #eef8f6 100%)"
    nav-scrolled-bg="rgba(255, 244, 234, 0.92)"
  >
    <view class="maintenance-summary">
      <view class="maintenance-summary-head">
        <text class="maintenance-summary-title">保养统计</text>
        <text class="maintenance-summary-count">{{ summaryCountText }}</text>
      </view>
      <view class="maintenance-summary-metrics">
        <view class="maintenance-summary-item">
          <text class="maintenance-summary-label">累计花费</text>
          <text class="maintenance-summary-value">{{ summaryTotalCostText }}</text>
        </view>
        <view class="maintenance-summary-item">
          <text class="maintenance-summary-label">单次均值</text>
          <text class="maintenance-summary-value">{{ summaryAvgCostText }}</text>
        </view>
        <view class="maintenance-summary-item">
          <text class="maintenance-summary-label">最近保养</text>
          <text class="maintenance-summary-value">{{ summaryLatestDateText }}</text>
        </view>
      </view>
    </view>

    <app-empty v-if="!maintenanceRecords.length" text="暂无保养记录，先添加一条吧。" />

    <view v-else class="history-list">
      <view
        v-for="record in maintenanceRecords"
        :key="record.id"
        class="history-record"
        :class="{ 'is-expanded': isExpanded(record.id) }"
      >
        <view class="history-head" @tap="toggleRecord(record.id)">
          <view class="history-main">
            <text class="history-date">{{ record.date }}</text>
            <text class="history-mile">{{ formatDistance(record.odometer) }} 公里</text>
          </view>
          <view class="history-right">
            <text class="history-total">{{ formatMoney(record.totalCost) }} 元</text>
            <uni-icons
              :type="isExpanded(record.id) ? 'arrow-down' : 'arrow-right'"
              size="16"
              color="#8aa2a8"
            ></uni-icons>
          </view>
        </view>

        <view v-if="isExpanded(record.id)" class="history-body">
          <text v-if="record.note" class="history-note">备注：{{ record.note }}</text>

          <view v-for="category in record.categories" :key="category.id" class="history-category">
            <view class="history-category-head">
              <text class="history-category-name">{{ category.name }}</text>
              <text class="history-category-total">小计 {{ formatMoney(category.subtotal) }} 元</text>
            </view>

            <view v-for="item in category.items" :key="item.id" class="history-item">
              <view class="history-item-top">
                <text class="history-item-name">{{ item.name }}</text>
                <text class="history-item-amount">{{ formatMoney(item.amount) }} 元</text>
              </view>
              <text v-if="item.spec" class="history-item-spec">规格：{{ item.spec }}</text>
              <text class="history-item-meta">{{ buildItemMeta(item) }}</text>
            </view>
          </view>

          <view class="history-actions">
            <app-button variant="ghost" :block="false" @tap="goEdit(record.id)">编辑</app-button>
            <app-button variant="warn" :block="false" @tap="removeById(record.id)">删除</app-button>
          </view>
        </view>
      </view>

      <view class="history-bottom">
        <app-button variant="warn" @tap="clearAll">清空保养记录</app-button>
      </view>
    </view>
  </app-page>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import AppPage from "@/components/AppPage.vue";
import AppButton from "@/components/AppButton.vue";
import AppEmpty from "@/components/AppEmpty.vue";
import { useMotoStore } from "@/composables/useMotoStore";
import { useMaintenanceStore, type MaintenanceItem } from "@/composables/useMaintenanceStore";

const { vehicleDisplayName, tankCapacityDisplay, displacementDisplay } = useMotoStore();
const { maintenanceRecords, maintenanceStats, roundTo, removeRecord, clearRecords } = useMaintenanceStore();

const expandedMap = reactive<Record<string, boolean>>({});
const isConfirmingAction = ref(false);

const formatMoney = (value: number) => roundTo(value, 2).toFixed(2);

const formatDistance = (value: number) => {
  const normalized = roundTo(value, 1).toFixed(1);
  return normalized.endsWith(".0") ? normalized.slice(0, -2) : normalized;
};

const heroPills = computed(() => [
  { label: "爱车", value: vehicleDisplayName.value },
  { label: "油箱", value: tankCapacityDisplay.value },
  { label: "排量", value: displacementDisplay.value },
  {
    label: "保养",
    value: maintenanceStats.value.count ? `${maintenanceStats.value.count} 条` : "暂无",
  },
]);

const summaryCountText = computed(() =>
  maintenanceStats.value.count ? `${maintenanceStats.value.count} 条` : "暂无记录"
);

const summaryTotalCostText = computed(() =>
  maintenanceStats.value.count ? `${formatMoney(maintenanceStats.value.totalCost)} 元` : "--"
);

const summaryAvgCostText = computed(() => {
  if (!maintenanceStats.value.count) {
    return "--";
  }
  return `${formatMoney(maintenanceStats.value.totalCost / maintenanceStats.value.count)} 元`;
});

const summaryLatestDateText = computed(() => maintenanceRecords.value[0]?.date || "--");

const isExpanded = (id: string) => !!expandedMap[id];

const toggleRecord = (id: string) => {
  expandedMap[id] = !expandedMap[id];
};

const buildItemMeta = (item: MaintenanceItem) => {
  const details: string[] = [];
  if (item.dosage > 0) {
    const dosageText = roundTo(item.dosage, 2).toFixed(2).replace(/\.00$/, "");
    const unitText = item.unit.trim() || "单位";
    details.push(`用量 ${dosageText}${unitText}`);
  }
  if (item.unitPrice > 0) {
    details.push(`单价 ${formatMoney(item.unitPrice)} 元`);
  }
  if (item.partDetail) {
    details.push(`配件 ${item.partDetail}`);
  }
  if (!details.length) {
    return "暂无补充信息";
  }
  return details.join(" · ");
};

const goEdit = (id: string) => {
  uni.navigateTo({ url: `/subpkg-maintenance/create/index?id=${encodeURIComponent(id)}` });
};

const removeById = (id: string) => {
  if (isConfirmingAction.value) {
    return;
  }
  isConfirmingAction.value = true;
  uni.showModal({
    title: "删除记录",
    content: "确定删除这条保养记录吗？",
    success: (res) => {
      if (!res.confirm) {
        return;
      }
      removeRecord(id);
      delete expandedMap[id];
    },
    complete: () => {
      isConfirmingAction.value = false;
    },
  });
};

const clearAll = () => {
  if (isConfirmingAction.value) {
    return;
  }
  isConfirmingAction.value = true;
  uni.showModal({
    title: "清空保养记录",
    content: "确定清空全部保养记录吗？",
    success: (res) => {
      if (!res.confirm) {
        return;
      }
      clearRecords();
      Object.keys(expandedMap).forEach((key) => {
        delete expandedMap[key];
      });
    },
    complete: () => {
      isConfirmingAction.value = false;
    },
  });
};
</script>

<style lang="scss" scoped>
.maintenance-summary {
  padding: 18rpx 20rpx;
  border-radius: 22rpx;
  background: rgba(255, 243, 234, 0.86);
  border: 1rpx solid rgba(221, 143, 102, 0.18);
  box-shadow: 0 14rpx 26rpx rgba(93, 65, 46, 0.08);
  margin-bottom: 20rpx;

  &-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12rpx;
  }

  &-title {
    font-size: 26rpx;
    font-weight: 600;
    color: #6e3f2c;
  }

  &-count {
    font-size: 22rpx;
    color: #8f6554;
  }

  &-metrics {
    margin-top: 14rpx;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12rpx;
  }

  &-item {
    display: flex;
    flex-direction: column;
    gap: 6rpx;
  }

  &-label {
    font-size: 22rpx;
    color: #8f6554;
  }

  &-value {
    font-size: 25rpx;
    font-weight: 600;
    color: #6e3f2c;
  }
}

.history {
  &-list {
    display: flex;
    flex-direction: column;
    gap: 14rpx;
  }

  &-record {
    border-radius: 20rpx;
    border: 1rpx solid rgba(16, 60, 66, 0.1);
    background: rgba(255, 255, 255, 0.93);
    box-shadow: 0 12rpx 24rpx rgba(16, 29, 34, 0.06);
    padding: 16rpx;
  }

  &-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14rpx;
  }

  &-main {
    display: flex;
    align-items: baseline;
    gap: 10rpx;
    min-width: 0;
  }

  &-date {
    font-size: 25rpx;
    font-weight: 600;
    color: var(--ink);
  }

  &-mile {
    font-size: 22rpx;
    color: var(--ink-muted);
  }

  &-right {
    display: flex;
    align-items: center;
    gap: 10rpx;
    flex-shrink: 0;
  }

  &-total {
    font-size: 25rpx;
    font-weight: 700;
    color: #0e7f74;
  }

  &-body {
    margin-top: 14rpx;
    padding-top: 14rpx;
    border-top: 1rpx dashed var(--line);
    display: flex;
    flex-direction: column;
    gap: 12rpx;
  }

  &-note {
    font-size: 22rpx;
    color: var(--ink-soft);
    line-height: 1.45;
  }

  &-category {
    border-radius: 14rpx;
    background: rgba(248, 251, 252, 0.94);
    border: 1rpx solid rgba(16, 60, 66, 0.08);
    padding: 10rpx 12rpx;
    display: flex;
    flex-direction: column;
    gap: 8rpx;

    &-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12rpx;
    }

    &-name {
      font-size: 24rpx;
      font-weight: 600;
      color: var(--ink);
    }

    &-total {
      font-size: 22rpx;
      color: #0f887d;
      font-weight: 600;
    }
  }

  &-item {
    padding: 8rpx 0;
    display: flex;
    flex-direction: column;
    gap: 4rpx;

    & + .history-item {
      border-top: 1rpx dashed rgba(16, 60, 66, 0.08);
    }

    &-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12rpx;
    }

    &-name {
      font-size: 23rpx;
      color: var(--ink);
      font-weight: 600;
    }

    &-amount {
      font-size: 22rpx;
      color: #0f887d;
      font-weight: 600;
    }

    &-spec {
      font-size: 21rpx;
      color: var(--ink-soft);
    }

    &-meta {
      font-size: 20rpx;
      color: var(--ink-muted);
      line-height: 1.45;
    }
  }

  &-actions {
    display: flex;
    gap: 12rpx;
  }

  &-bottom {
    margin-top: 2rpx;
  }
}
</style>
