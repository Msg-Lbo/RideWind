<template>
  <app-page title="保养记录" subtitle="历史直接查看，新增在独立页面完成" :pills="heroPills">
    <app-card title="保养历史" :desc="historyDesc">
      <view class="top-actions">
        <app-button @tap="goCreate">新增保养记录</app-button>
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
    </app-card>
  </app-page>
</template>

<script setup lang="ts">
import { computed, reactive } from "vue";
import AppPage from "@/components/AppPage.vue";
import AppCard from "@/components/AppCard.vue";
import AppButton from "@/components/AppButton.vue";
import AppEmpty from "@/components/AppEmpty.vue";
import { useMotoStore } from "@/composables/useMotoStore";
import { useMaintenanceStore, type MaintenanceItem } from "@/composables/useMaintenanceStore";

const { vehicleDisplayName, tankCapacityDisplay, displacementDisplay } = useMotoStore();
const { maintenanceRecords, maintenanceStats, roundTo, removeRecord, clearRecords } = useMaintenanceStore();

const expandedMap = reactive<Record<string, boolean>>({});

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

const historyDesc = computed(() => {
  if (!maintenanceStats.value.count) {
    return "按日期和里程归档，每次保养都可追溯";
  }
  return `共 ${maintenanceStats.value.count} 条，累计 ${formatMoney(maintenanceStats.value.totalCost)} 元`;
});

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

const goCreate = () => {
  uni.navigateTo({ url: "/subpkg-maintenance/create/index" });
};

const goEdit = (id: string) => {
  uni.navigateTo({ url: `/subpkg-maintenance/create/index?id=${encodeURIComponent(id)}` });
};

const removeById = (id: string) => {
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
  });
};

const clearAll = () => {
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
  });
};
</script>

<style lang="scss" scoped>
.top-actions {
  margin-bottom: 14rpx;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.history-record {
  border-radius: 20rpx;
  border: 1rpx solid rgba(16, 60, 66, 0.1);
  background: rgba(255, 255, 255, 0.93);
  box-shadow: 0 12rpx 24rpx rgba(16, 29, 34, 0.06);
  padding: 16rpx;
}

.history-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14rpx;
}

.history-main {
  display: flex;
  align-items: baseline;
  gap: 10rpx;
  min-width: 0;
}

.history-date {
  font-size: 25rpx;
  font-weight: 600;
  color: var(--ink);
}

.history-mile {
  font-size: 22rpx;
  color: var(--ink-muted);
}

.history-right {
  display: flex;
  align-items: center;
  gap: 10rpx;
  flex-shrink: 0;
}

.history-total {
  font-size: 25rpx;
  font-weight: 700;
  color: #0e7f74;
}

.history-body {
  margin-top: 14rpx;
  padding-top: 14rpx;
  border-top: 1rpx dashed var(--line);
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.history-note {
  font-size: 22rpx;
  color: var(--ink-soft);
  line-height: 1.45;
}

.history-category {
  border-radius: 14rpx;
  background: rgba(248, 251, 252, 0.94);
  border: 1rpx solid rgba(16, 60, 66, 0.08);
  padding: 10rpx 12rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.history-category-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}

.history-category-name {
  font-size: 24rpx;
  font-weight: 600;
  color: var(--ink);
}

.history-category-total {
  font-size: 22rpx;
  color: #0f887d;
  font-weight: 600;
}

.history-item {
  padding: 8rpx 0;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.history-item + .history-item {
  border-top: 1rpx dashed rgba(16, 60, 66, 0.08);
}

.history-item-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}

.history-item-name {
  font-size: 23rpx;
  color: var(--ink);
  font-weight: 600;
}

.history-item-amount {
  font-size: 22rpx;
  color: #0f887d;
  font-weight: 600;
}

.history-item-spec {
  font-size: 21rpx;
  color: var(--ink-soft);
}

.history-item-meta {
  font-size: 20rpx;
  color: var(--ink-muted);
  line-height: 1.45;
}

.history-actions {
  display: flex;
  gap: 12rpx;
}

.history-bottom {
  margin-top: 2rpx;
}
</style>
