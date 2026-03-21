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
            <text>本次里程</text>
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
              placeholder="例如：100"
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

/**
 * 将占位值 `--` 清理为空字符串，避免带入输入框参与计算。
 *
 * @param value 原始表单值
 * @returns 可用于输入框的安全字符串
 */
const sanitizeField = (value: string) => (value === "--" ? "" : value);
recordForm.displayUnitPrice = sanitizeField(recordForm.displayUnitPrice);
recordForm.fuelAmount = sanitizeField(recordForm.fuelAmount);
recordForm.displayAmount = sanitizeField(recordForm.displayAmount);
recordForm.actualUnitPrice = sanitizeField(recordForm.actualUnitPrice);
recordForm.discountAmount = sanitizeField(recordForm.discountAmount);
recordForm.actualAmount = sanitizeField(recordForm.actualAmount);

/** 日期/时间选择器 change 事件结构。 */
type DateTimePickerChangeEvent = {
  detail: {
    /** 选中的字符串值，例如 `2026-03-21` 或 `17:19` */
    value: string;
  };
};

/**
 * 处理日期选择。
 *
 * @param event 日期选择器事件
 */
const onDateChange = (event: DateTimePickerChangeEvent) => {
  recordForm.date = event.detail.value;
};

/**
 * 处理时间选择。
 *
 * @param event 时间选择器事件
 */
const onTimeChange = (event: DateTimePickerChangeEvent) => {
  recordForm.time = event.detail.value;
};

/** 弹出“本次里程”说明。 */
const showMileageHelp = () => {
  uni.showModal({
    title: "本次里程说明",
    content:
      "填写这一箱油实际骑行的公里数。比如骑到 100 公里就加油，这里填 100。系统会按“加油量 ÷ 本次里程 × 100”计算油耗。",
    showCancel: false,
  });
};

/**
 * 提交保存。
 * 先对顶部/底部联动字段做同步与归一化，再调用 store 保存。
 */
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
  normalizeCalcFields();
  const wasEditing = isEditing.value;
  const saved = addRecord();
  if (saved) {
    resetSyncSource();
  }
  if (saved && wasEditing) {
    uni.switchTab({ url: "/pkg-records/index" });
  }
};

/** 重置当前录入表单。 */
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

/**
 * 输入事件兼容结构。
 * 不同平台下输入值可能出现在 `detail/target/currentTarget` 任一位置。
 */
type InputEventPayload = {
  /** uni-input 常见位置 */
  detail?: {
    value?: string | number;
  } | number;
  /** H5/部分端可能挂在 target */
  target?: {
    value?: string | number;
  } | EventTarget | null;
  /** 兜底位置 */
  currentTarget?: {
    value?: string | number;
  } | EventTarget | null;
};

/** 统一输入事件类型。 */
type InputEventLike = InputEvent | InputEventPayload;

/**
 * 从多端输入事件里提取文本值。
 *
 * @param event 输入事件
 * @returns 输入框值，提取失败返回空字符串
 */
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

/**
 * 清洗小数字符串并限制小数位。
 *
 * @param raw 原始输入
 * @param maxDigits 最大小数位，默认 2
 * @returns 规范化后的可编辑字符串
 */
const sanitizeDecimalInput = (raw: string, maxDigits = 2) => {
  const cleaned = raw.replace(/[^\d.]/g, "");
  if (!cleaned) {
    return "";
  }
  const firstDotIndex = cleaned.indexOf(".");
  if (firstDotIndex < 0) {
    return cleaned;
  }

  const integerPart = cleaned.slice(0, firstDotIndex) || "0";
  const decimalPart = cleaned.slice(firstDotIndex + 1).replace(/\./g, "").slice(0, maxDigits);
  if (cleaned.endsWith(".") && !decimalPart) {
    return `${integerPart}.`;
  }
  return `${integerPart}.${decimalPart}`;
};

/** 顶部三格（机显单价/加油量/机显金额）最后一次编辑来源。 */
const topEditedField = ref<"unit" | "fuel" | "display" | "">("");
/** 底部三格（实付单价/优惠金额/实付金额）当前编辑来源。 */
const bottomEditedField = ref<"unit" | "discount" | "actual" | "">("");
/** 底部三格上一次有效来源，用于跨字段联动时保持计算方向。 */
const bottomAnchorField = ref<"unit" | "discount" | "actual" | "">("");

/** 清空联动来源状态。 */
const resetSyncSource = () => {
  topEditedField.value = "";
  bottomEditedField.value = "";
  bottomAnchorField.value = "";
};

onShow(() => {
  resetSyncSource();
});

/**
 * 解析输入字段，返回“是否有输入”与数值。
 *
 * @param raw 原始字符串
 * @returns 解析结果
 */
const parseField = (raw: string) => ({
  has: raw.trim() !== "",
  value: Number.isFinite(Number.parseFloat(raw)) ? Number.parseFloat(raw) : 0,
});

/**
 * 数字格式化为两位小数字符串。
 *
 * @param value 原始数字
 * @returns 两位小数字符串
 */
const formatNum = (value: number) => {
  if (!Number.isFinite(value) || value < 0) {
    return "0.00";
  }
  return value.toFixed(2);
};

/**
 * 归一化单个小数字段。
 *
 * @param raw 原始输入
 * @param allowZero 是否允许 0.00
 * @returns 归一化后的字段值
 */
const normalizeDecimalField = (raw: string, allowZero = true) => {
  const { has, value } = parseField(raw);
  if (!has) {
    return "";
  }
  if (value < 0) {
    return "";
  }
  if (!allowZero && value === 0) {
    return "";
  }
  return formatNum(value);
};

/** 将六个金额/单价字段统一归一化为两位小数。 */
const normalizeCalcFields = () => {
  recordForm.displayUnitPrice = normalizeDecimalField(recordForm.displayUnitPrice, false);
  recordForm.fuelAmount = normalizeDecimalField(recordForm.fuelAmount, false);
  recordForm.displayAmount = normalizeDecimalField(recordForm.displayAmount, false);
  recordForm.actualUnitPrice = normalizeDecimalField(recordForm.actualUnitPrice, false);
  recordForm.discountAmount = normalizeDecimalField(recordForm.discountAmount, true);
  recordForm.actualAmount = normalizeDecimalField(recordForm.actualAmount, false);
};

/**
 * 根据顶部最后编辑字段执行联动。
 *
 * @param edited 顶部来源：机显单价 / 加油量 / 机显金额
 */
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

/**
 * 根据底部最后编辑字段执行联动。
 *
 * @param edited 底部来源：实付单价 / 优惠金额 / 实付金额
 */
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

/**
 * 顶部-机显单价输入。
 *
 * @param event 输入事件
 */
const onDisplayUnitPriceInput = (event: InputEventLike) => {
  recordForm.displayUnitPrice = sanitizeField(sanitizeDecimalInput(readInput(event)));
  topEditedField.value = "unit";
};

/**
 * 顶部-加油量输入。
 *
 * @param event 输入事件
 */
const onFuelAmountInput = (event: InputEventLike) => {
  recordForm.fuelAmount = sanitizeField(sanitizeDecimalInput(readInput(event)));
  topEditedField.value = "fuel";
};

/**
 * 顶部-机显金额输入。
 *
 * @param event 输入事件
 */
const onDisplayAmountInput = (event: InputEventLike) => {
  recordForm.displayAmount = sanitizeField(sanitizeDecimalInput(readInput(event)));
  topEditedField.value = "display";
};

/** 顶部字段失焦后执行联动并归一化。 */
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
  normalizeCalcFields();
};

/**
 * 底部-实付单价输入。
 *
 * @param event 输入事件
 */
const onActualUnitPriceInput = (event: InputEventLike) => {
  recordForm.actualUnitPrice = sanitizeField(sanitizeDecimalInput(readInput(event)));
  bottomEditedField.value = "unit";
};

/**
 * 底部-优惠金额输入。
 *
 * @param event 输入事件
 */
const onDiscountAmountInput = (event: InputEventLike) => {
  recordForm.discountAmount = sanitizeField(sanitizeDecimalInput(readInput(event)));
  bottomEditedField.value = "discount";
};

/**
 * 底部-实付金额输入。
 *
 * @param event 输入事件
 */
const onActualAmountInput = (event: InputEventLike) => {
  recordForm.actualAmount = sanitizeField(sanitizeDecimalInput(readInput(event)));
  bottomEditedField.value = "actual";
};

/** 底部字段失焦后执行联动并归一化。 */
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
  normalizeCalcFields();
};

/**
 * 统一拼接数值+单位。
 *
 * @param value 原始数字
 * @param unit 单位文本
 * @param digits 小数位
 * @returns 用于 UI 展示的字符串
 */
const formatWithUnit = (value: number, unit: string, digits = 2) => {
  const formatted = formatValue(value, digits);
  return formatted === "--" ? "--" : `${formatted} ${unit}`;
};

/** 录入页底部四宫格预览数据。 */
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
