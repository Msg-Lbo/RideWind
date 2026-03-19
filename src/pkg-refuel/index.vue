<template>
  <app-page title="油耗记录" subtitle="记录每一次加油，形成可视化趋势" :pills="heroPills">
    <app-card title="本次加油" desc="填写加油明细，自动计算金额与油耗">
      <view class="form-panel">
        <picker
          class="form-row-picker"
          mode="date"
          :value="recordForm.date"
          @change="onDateChange"
        >
          <view class="form-row">
            <text class="row-label">
              加油日期
              <text class="required">*</text>
            </text>
            <view class="row-right">
              <text class="row-value">{{ dateDisplay }}</text>
              <uni-icons type="arrow-right" size="16" color="#8aa2a8"></uni-icons>
            </view>
          </view>
        </picker>
        <picker
          class="form-row-picker"
          mode="time"
          :value="recordForm.time"
          @change="onTimeChange"
        >
          <view class="form-row">
            <text class="row-label">
              加油时间
              <text class="required">*</text>
            </text>
            <view class="row-right">
              <text class="row-value">{{ recordForm.time || "--:--" }}</text>
              <uni-icons type="arrow-right" size="16" color="#8aa2a8"></uni-icons>
            </view>
          </view>
        </picker>
        <view class="form-row">
          <view class="row-label row-label-flex">
            <text>当前里程</text>
            <view class="help-icon" @tap.stop="showMileageHelp">
              <uni-icons type="help" size="14" color="#8aa2a8"></uni-icons>
            </view>
            <text class="required">*</text>
          </view>
          <view class="row-right row-input-wrap">
            <input
              v-model="recordForm.mileage"
              class="row-input"
              type="digit"
              placeholder="例如：12034.6"
            />
            <text class="row-unit">公里</text>
          </view>
        </view>
      </view>

      <view class="calc-block">
        <view class="calc-caption">
          <text>机显单价（元/升） X 加油量（升） = 机显金额（元）</text>
          <text class="required">*</text>
        </view>
        <view class="calc-grid">
          <view class="calc-cell">
            <input
              v-model="recordForm.displayUnitPrice"
              class="calc-input"
              type="digit"
              placeholder="0.00"
              @input="onDisplayUnitPriceInput"
              @blur="onTopFieldBlur"
            />
          </view>
          <view class="calc-cell">
            <input
              v-model="recordForm.fuelAmount"
              class="calc-input"
              type="digit"
              placeholder="0.00"
              @input="onFuelAmountInput"
              @blur="onTopFieldBlur"
            />
          </view>
          <view class="calc-cell">
            <input
              v-model="recordForm.displayAmount"
              class="calc-input"
              type="digit"
              placeholder="0.00"
              @input="onDisplayAmountInput"
              @blur="onTopFieldBlur"
            />
          </view>
        </view>

        <view class="calc-labels">
          <text>实付单价</text>
          <text>优惠金额</text>
          <text>实付金额</text>
        </view>
        <view class="calc-grid">
          <view class="calc-cell">
            <input
              v-model="recordForm.actualUnitPrice"
              class="calc-input"
              type="digit"
              placeholder="0.00"
              @input="onActualUnitPriceInput"
              @blur="onBottomFieldBlur"
            />
          </view>
          <view class="calc-cell">
            <input
              v-model="recordForm.discountAmount"
              class="calc-input"
              type="digit"
              placeholder="0.00"
              @input="onDiscountAmountInput"
              @blur="onBottomFieldBlur"
            />
          </view>
          <view class="calc-cell">
            <input
              v-model="recordForm.actualAmount"
              class="calc-input"
              type="digit"
              placeholder="0.00"
              @input="onActualAmountInput"
              @blur="onBottomFieldBlur"
            />
          </view>
        </view>
      </view>

      <view class="preview-wrap">
        <app-metric-grid :items="previewItems" />
      </view>
      <template #actions>
        <view class="actions-row">
          <view class="actions-col">
            <app-button @tap="handleSave">{{ primaryActionText }}</app-button>
          </view>
          <view class="actions-col">
            <app-button variant="ghost" @tap="handleReset">重置</app-button>
          </view>
        </view>
      </template>
    </app-card>

  </app-page>
</template>

<script setup lang="ts">
import { onShow } from "@dcloudio/uni-app";
import { computed, ref } from "vue";
import AppPage from "@/components/AppPage.vue";
import AppCard from "@/components/AppCard.vue";
import AppButton from "@/components/AppButton.vue";
import AppMetricGrid from "@/components/AppMetricGrid.vue";
import { useMotoStore } from "@/composables/useMotoStore";

const {
  recordForm,
  preview,
  vehicleDisplayName,
  tankCapacityDisplay,
  displacementDisplay,
  isEditing,
  formatValue,
  addRecord,
  resetRecord,
} = useMotoStore();

const sanitizeField = (value: string) => (value === "--" ? "" : value);
recordForm.displayUnitPrice = sanitizeField(recordForm.displayUnitPrice);
recordForm.fuelAmount = sanitizeField(recordForm.fuelAmount);
recordForm.displayAmount = sanitizeField(recordForm.displayAmount);
recordForm.actualUnitPrice = sanitizeField(recordForm.actualUnitPrice);
recordForm.discountAmount = sanitizeField(recordForm.discountAmount);
recordForm.actualAmount = sanitizeField(recordForm.actualAmount);

const onDateChange = (event: { detail: { value: string } }) => {
  recordForm.date = event.detail.value;
};

const onTimeChange = (event: { detail: { value: string } }) => {
  recordForm.time = event.detail.value;
};

const showMileageHelp = () => {
  uni.showModal({
    title: "当前里程说明",
    content:
      "填写本次加油时的仪表盘总里程，用于自动计算小计里程。若没有历史记录，将按填写值作为小计里程。建议按时间顺序录入。",
    showCancel: false,
  });
};

const handleSave = () => {
  if (topEditedField.value) {
    syncTopByEditedField(topEditedField.value);
  }
  const bottomTarget = bottomEditedField.value || bottomAnchorField.value;
  if (bottomTarget) {
    syncBottomByField(bottomTarget);
    if (bottomEditedField.value) {
      bottomAnchorField.value = bottomEditedField.value;
      bottomEditedField.value = "";
    }
  }
  const wasEditing = isEditing.value;
  const saved = addRecord();
  if (saved) {
    resetSyncSource();
  }
  if (saved && wasEditing) {
    uni.switchTab({ url: "/pkg-records/index" });
  }
};

const handleReset = () => {
  resetRecord();
  resetSyncSource();
};

const heroPills = computed(() => [
  { label: "爱车", value: vehicleDisplayName.value },
  { label: "油箱", value: tankCapacityDisplay.value },
  { label: "排量", value: displacementDisplay.value },
]);

const dateDisplay = computed(() =>
  recordForm.date ? recordForm.date.replace(/-/g, "/") : "----/--/--"
);

const primaryActionText = computed(() => (isEditing.value ? "保存修改" : "保存本次记录"));

type InputEventPayload = {
  detail?: {
    value?: string | number;
  } | number;
  target?: {
    value?: string | number;
  } | EventTarget | null;
  currentTarget?: {
    value?: string | number;
  } | EventTarget | null;
};

type InputEventLike = InputEvent | InputEventPayload;

const readInput = (event: InputEventLike) => {
  const detail = (event as InputEventPayload).detail;
  if (detail && typeof detail === "object" && "value" in detail) {
    const detailValue = detail.value;
    return detailValue === undefined || detailValue === null ? "" : `${detailValue}`;
  }

  const target = (event as InputEventPayload).target;
  if (target && typeof target === "object" && "value" in target) {
    const targetValue = target.value;
    return targetValue === undefined || targetValue === null ? "" : `${targetValue}`;
  }

  const currentTarget = (event as InputEventPayload).currentTarget;
  if (currentTarget && typeof currentTarget === "object" && "value" in currentTarget) {
    const currentValue = currentTarget.value;
    return currentValue === undefined || currentValue === null ? "" : `${currentValue}`;
  }

  return "";
};
const topEditedField = ref<"unit" | "fuel" | "display" | "">("");
const bottomEditedField = ref<"unit" | "discount" | "actual" | "">("");
const bottomAnchorField = ref<"unit" | "discount" | "actual" | "">("");

const resetSyncSource = () => {
  topEditedField.value = "";
  bottomEditedField.value = "";
  bottomAnchorField.value = "";
};

onShow(() => {
  resetSyncSource();
});

const parseField = (raw: string) => ({
  has: raw.trim() !== "",
  value: Number.isFinite(Number.parseFloat(raw)) ? Number.parseFloat(raw) : 0,
});

const formatNum = (value: number) => {
  if (!Number.isFinite(value) || value < 0) {
    return "0.00";
  }
  return value.toFixed(2);
};

const syncTopByEditedField = (edited: "unit" | "fuel" | "display") => {
  const unit = parseField(recordForm.displayUnitPrice);
  const fuel = parseField(recordForm.fuelAmount);
  const display = parseField(recordForm.displayAmount);

  const setDisplayByUnitFuel = () => {
    if (unit.value > 0 && fuel.value > 0) {
      recordForm.displayAmount = formatNum(unit.value * fuel.value);
      return true;
    }
    return false;
  };

  const setFuelByUnitDisplay = () => {
    if (unit.value > 0 && display.value > 0) {
      recordForm.fuelAmount = formatNum(display.value / unit.value);
      return true;
    }
    return false;
  };

  const setUnitByFuelDisplay = () => {
    if (fuel.value > 0 && display.value > 0) {
      recordForm.displayUnitPrice = formatNum(display.value / fuel.value);
      return true;
    }
    return false;
  };

  if (edited === "unit") {
    if (display.has && setFuelByUnitDisplay()) {
      return;
    }
    if (fuel.has) {
      setDisplayByUnitFuel();
    }
    return;
  }

  if (edited === "fuel") {
    if (display.has && setUnitByFuelDisplay()) {
      return;
    }
    if (unit.has) {
      setDisplayByUnitFuel();
    }
    return;
  }

  if (unit.has && setFuelByUnitDisplay()) {
    return;
  }
  if (fuel.has) {
    setUnitByFuelDisplay();
  }
};

const syncBottomByField = (edited: "unit" | "discount" | "actual") => {
  const setUnitByActual = () => {
    const actual = parseField(recordForm.actualAmount);
    const fuel = parseField(recordForm.fuelAmount);
    if (!actual.has || fuel.value <= 0) {
      return false;
    }
    recordForm.actualUnitPrice = formatNum(actual.value / fuel.value);
    return true;
  };

  const setActualByUnit = () => {
    const actualUnit = parseField(recordForm.actualUnitPrice);
    const fuel = parseField(recordForm.fuelAmount);
    if (!actualUnit.has || fuel.value <= 0) {
      return false;
    }
    recordForm.actualAmount = formatNum(actualUnit.value * fuel.value);
    return true;
  };

  const setDiscountByActual = () => {
    const actual = parseField(recordForm.actualAmount);
    const display = parseField(recordForm.displayAmount);
    if (!actual.has || !display.has) {
      return false;
    }
    recordForm.discountAmount = formatNum(Math.max(0, display.value - actual.value));
    return true;
  };

  const setActualByDiscount = () => {
    const discount = parseField(recordForm.discountAmount);
    const display = parseField(recordForm.displayAmount);
    if (!discount.has || !display.has) {
      return false;
    }
    recordForm.actualAmount = formatNum(Math.max(0, display.value - discount.value));
    return true;
  };

  if (edited === "unit") {
    if (setActualByUnit()) {
      setDiscountByActual();
    }
    return;
  }

  if (edited === "discount") {
    if (setActualByDiscount()) {
      setUnitByActual();
    }
    return;
  }

  if (setUnitByActual()) {
    setDiscountByActual();
  }
};

const onDisplayUnitPriceInput = (event: InputEventLike) => {
  recordForm.displayUnitPrice = sanitizeField(readInput(event));
  topEditedField.value = "unit";
};

const onFuelAmountInput = (event: InputEventLike) => {
  recordForm.fuelAmount = sanitizeField(readInput(event));
  topEditedField.value = "fuel";
};

const onDisplayAmountInput = (event: InputEventLike) => {
  recordForm.displayAmount = sanitizeField(readInput(event));
  topEditedField.value = "display";
};

const onTopFieldBlur = () => {
  if (!topEditedField.value) {
    return;
  }
  syncTopByEditedField(topEditedField.value);
  topEditedField.value = "";
  const bottomTarget = bottomEditedField.value || bottomAnchorField.value;
  if (bottomTarget) {
    syncBottomByField(bottomTarget);
    if (bottomEditedField.value) {
      bottomAnchorField.value = bottomEditedField.value;
      bottomEditedField.value = "";
    }
  }
};

const onActualUnitPriceInput = (event: InputEventLike) => {
  recordForm.actualUnitPrice = sanitizeField(readInput(event));
  bottomEditedField.value = "unit";
};

const onDiscountAmountInput = (event: InputEventLike) => {
  recordForm.discountAmount = sanitizeField(readInput(event));
  bottomEditedField.value = "discount";
};

const onActualAmountInput = (event: InputEventLike) => {
  recordForm.actualAmount = sanitizeField(readInput(event));
  bottomEditedField.value = "actual";
};

const onBottomFieldBlur = () => {
  const bottomTarget = bottomEditedField.value || bottomAnchorField.value;
  if (!bottomTarget) {
    return;
  }
  syncBottomByField(bottomTarget);
  if (bottomEditedField.value) {
    bottomAnchorField.value = bottomEditedField.value;
  }
  bottomEditedField.value = "";
};

const formatWithUnit = (value: number, unit: string, digits = 2) => {
  const formatted = formatValue(value, digits);
  return formatted === "--" ? "--" : `${formatted} ${unit}`;
};

const previewItems = computed(() => [
  {
    label: "油耗",
    value: preview.value.hasBasic
      ? formatWithUnit(preview.value.consumption, "L/100km")
      : "--",
  },
  {
    label: "油费",
    value: preview.value.hasCost
      ? formatWithUnit(preview.value.costPer100, "元/100km")
      : "--",
  },
  {
    label: "占油箱",
    value: preview.value.hasTank ? formatWithUnit(preview.value.tankPercent, "%") : "--",
  },
  {
    label: "满箱续航",
    value:
      preview.value.hasTank && preview.value.hasBasic
        ? formatWithUnit(preview.value.fullRange, "km", 0)
        : "--",
  },
]);

</script>

<style lang="scss" scoped>
.form-panel {
  background: rgba(255, 255, 255, 0.75);
  border: 1rpx solid var(--card-border);
  border-radius: 22rpx;
  padding: 0 20rpx;
  overflow: hidden;
}

.form-row-picker {
  display: block;
}

.form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18rpx 0;
  border-bottom: 1rpx dashed var(--line);
}

.form-row:last-child {
  border-bottom: none;
}

.row-label {
  font-size: 24rpx;
  color: var(--ink-soft);
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.row-label-flex {
  gap: 6rpx;
}

.row-right {
  display: flex;
  align-items: center;
  gap: 10rpx;
  color: var(--ink);
  font-weight: 600;
}

.row-value {
  font-size: 26rpx;
}

.row-input-wrap {
  background: rgba(255, 255, 255, 0.95);
  border: 1rpx solid rgba(16, 60, 66, 0.16);
  border-radius: 16rpx;
  padding: 0 12rpx;
  height: 64rpx;
  gap: 8rpx;
}

.row-input {
  flex: 1;
  min-width: 0;
  height: 64rpx;
  line-height: 64rpx;
  font-size: 26rpx;
  text-align: right;
  color: var(--ink);
  background: transparent;
  border: none;
}

.row-unit {
  font-size: 22rpx;
  color: var(--ink-muted);
}

.help-icon {
  width: 26rpx;
  height: 26rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(20, 184, 166, 0.12);
}

.required {
  color: #f87171;
  font-size: 22rpx;
}

.calc-block {
  margin-top: 22rpx;
}

.calc-caption {
  display: flex;
  align-items: center;
  gap: 6rpx;
  flex-wrap: wrap;
  font-size: 24rpx;
  color: var(--ink-soft);
  margin-bottom: 14rpx;
}

.calc-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12rpx;
}

.calc-cell {
  display: flex;
  align-items: center;
}

.calc-input,
.calc-static {
  width: 100%;
  height: 64rpx;
  border-radius: 16rpx;
  padding: 0 12rpx;
  font-size: 26rpx;
  text-align: center;
  background: rgba(255, 255, 255, 0.95);
  border: 1rpx solid rgba(16, 60, 66, 0.16);
  color: var(--ink);
  position: relative;
  z-index: 1;
  pointer-events: auto;
}

.calc-static {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.calc-labels {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12rpx;
  margin: 14rpx 0 10rpx;
  font-size: 22rpx;
  color: var(--ink-muted);
  text-align: center;
}

.preview-wrap {
  margin-top: 18rpx;
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
