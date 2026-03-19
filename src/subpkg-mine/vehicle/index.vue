<template>
  <app-page title="我的爱车" subtitle="维护车辆档案，让油耗记录更精准" :pills="heroPills">
    <app-card title="爱车信息" desc="用于计算油耗与续航">
      <view class="form-grid">
        <app-field v-model="vehicleForm.name" label="爱车名字" placeholder="比如：小风" />
        <app-field v-model="vehicleForm.tankCapacity" label="油箱容量 (L)" type="digit" placeholder="比如：12.5" />
        <app-field v-model="vehicleForm.displacement" label="排量 (cc)" type="number" placeholder="比如：250" />
      </view>
      <template #actions>
        <view class="actions-row">
          <view class="actions-col">
            <app-button @tap="saveVehicle">保存爱车信息</app-button>
          </view>
          <view class="actions-col">
            <app-button variant="ghost" @tap="resetVehicle">清空</app-button>
          </view>
        </view>
      </template>
    </app-card>

  </app-page>
</template>

<script setup lang="ts">
import { computed } from "vue";
import AppPage from "@/components/AppPage.vue";
import AppCard from "@/components/AppCard.vue";
import AppField from "@/components/AppField.vue";
import AppButton from "@/components/AppButton.vue";
import { useMotoStore } from "@/composables/useMotoStore";

const {
  vehicleForm,
  vehicleDisplayName,
  tankCapacityDisplay,
  displacementDisplay,
  saveVehicle,
  resetVehicle,
} = useMotoStore();

const heroPills = computed(() => [
  { label: "爱车", value: vehicleDisplayName.value },
  { label: "油箱", value: tankCapacityDisplay.value },
  { label: "排量", value: displacementDisplay.value },
]);
</script>

<style lang="scss" scoped>
.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 18rpx;

  @media (min-width: 700px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.actions-row {
  display: flex;
  width: 100%;
  gap: 12rpx;
}

.actions-col {
  flex: 1;
  min-width: 0;
}

.actions-col app-button {
  display: block;
  width: 100%;
}
</style>
