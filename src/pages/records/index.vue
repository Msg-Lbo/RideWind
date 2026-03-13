<template>
  <app-page title="记录列表" subtitle="回看每次加油的详细数据" :pills="heroPills">
    <app-card title="全部记录" desc="按时间倒序排列">
      <app-empty v-if="!records.length" text="暂无记录，先去添加一条记录吧。" />
      <scroll-view scroll-y v-else style="height: calc(100vh - 670rpx)">
        <record-list :records="records" :format-value="formatValue" @remove="removeRecord" />
      </scroll-view>
      <template v-if="records.length" #actions>
        <app-button variant="warn" @tap="clearRecords">清空全部记录</app-button>
      </template>
    </app-card>
  </app-page>
</template>

<script setup lang="ts">
import { computed } from "vue";
import AppPage from "@/components/AppPage.vue";
import AppCard from "@/components/AppCard.vue";
import AppEmpty from "@/components/AppEmpty.vue";
import AppButton from "@/components/AppButton.vue";
import RecordList from "@/components/RecordList.vue";
import { useMotoStore } from "@/composables/useMotoStore";

const {
  records,
  vehicleDisplayName,
  tankCapacityDisplay,
  displacementDisplay,
  formatValue,
  removeRecord,
  clearRecords,
} = useMotoStore();

const heroPills = computed(() => [
  { label: "爱车", value: vehicleDisplayName.value },
  { label: "油箱", value: tankCapacityDisplay.value },
  { label: "排量", value: displacementDisplay.value },
  { label: "记录", value: records.value.length ? `${records.value.length} 条` : "暂无" },
]);
</script>
