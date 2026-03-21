<template>
  <app-page :title="pageTitle" :subtitle="pageSubtitle" :pills="heroPills">
    <app-card :title="editingRecordId ? '编辑保养记录' : '新增保养记录'" desc="日期和里程固定填写，分类和项目可动态增减">
      <view class="fixed-panel">
        <picker class="form-row-picker" mode="date" :value="maintenanceForm.date" @change="onDateChange">
          <view class="form-row">
            <text class="row-label">
              保养日期
              <text class="required">*</text>
            </text>
            <view class="row-right">
              <text class="row-value">{{ maintenanceForm.date || '----/--/--' }}</text>
              <uni-icons type="arrow-right" size="16" color="#8aa2a8"></uni-icons>
            </view>
          </view>
        </picker>

        <view class="form-row">
          <text class="row-label">
            保养里程
            <text class="required">*</text>
          </text>
          <view class="row-right row-input-wrap">
            <input v-model="maintenanceForm.odometer" class="row-input" type="digit" placeholder="例如：12345.6" />
            <text class="row-unit">公里</text>
          </view>
        </view>

        <view class="form-row no-border">
          <text class="row-label">本次备注</text>
          <view class="row-right row-input-wrap note-wrap">
            <input v-model="maintenanceForm.note" class="row-input note-input" placeholder="可记录异常、门店信息等" />
          </view>
        </view>
      </view>

      <view class="category-list">
        <view v-for="(category, categoryIndex) in maintenanceForm.categories" :key="category.id" class="category-card">
          <view class="category-head">
            <input
              v-model="category.name"
              class="category-name-input"
              placeholder="分类名称（例如：机油保养）"
            />
            <text class="category-subtotal">小计 {{ formatMoney(categoryPreviewSubtotal(category)) }} 元</text>
            <view class="icon-btn danger" @tap="removeCategory(categoryIndex)">
              <uni-icons type="trash" size="16" color="#dc6c50"></uni-icons>
            </view>
          </view>

          <view class="item-list">
            <view v-for="(item, itemIndex) in category.items" :key="item.id" class="item-card">
              <view class="item-row item-row-top">
                <input v-model="item.name" class="item-input item-input-main" placeholder="项目名称（必填）" />
                <input v-model="item.spec" class="item-input" placeholder="规格" />
                <view class="icon-btn" @tap="removeItem(categoryIndex, itemIndex)">
                  <uni-icons type="minus" size="14" color="#83989f"></uni-icons>
                </view>
              </view>

              <view class="item-grid">
                <view class="item-grid-cell">
                  <text class="cell-label">用量</text>
                  <input v-model="item.dosage" class="item-input" type="digit" placeholder="0.00" />
                </view>
                <view class="item-grid-cell small">
                  <text class="cell-label">单位</text>
                  <input v-model="item.unit" class="item-input" placeholder="L/个/瓶" />
                </view>
                <view class="item-grid-cell">
                  <text class="cell-label">单价(元)</text>
                  <input v-model="item.unitPrice" class="item-input" type="digit" placeholder="0.00" />
                </view>
                <view class="item-grid-cell">
                  <text class="cell-label">金额(元)</text>
                  <input v-model="item.amount" class="item-input" type="digit" placeholder="留空可自动算" />
                </view>
              </view>

              <view class="item-row">
                <input v-model="item.partDetail" class="item-input" placeholder="配件明细（品牌/型号）" />
              </view>
              <view class="item-auto">
                <text>计入金额：{{ formatMoney(itemPreviewAmount(item)) }} 元</text>
              </view>
            </view>
          </view>

          <view class="category-actions">
            <app-button variant="ghost" :block="false" @tap="addItem(categoryIndex)">新增项目</app-button>
          </view>
        </view>
      </view>

      <view class="top-actions">
        <app-button variant="ghost" :block="false" @tap="addCategory">新增分类</app-button>
        <app-button variant="ghost" :block="false" @tap="resetForm">重置表单</app-button>
      </view>

      <view class="form-total">
        <text class="form-total-label">本次预计总计</text>
        <text class="form-total-value">{{ formatMoney(formTotalCost) }} 元</text>
      </view>

      <template #actions>
        <view class="bottom-actions">
          <app-button @tap="saveMaintenanceRecord">{{ editingRecordId ? '保存修改' : '保存保养记录' }}</app-button>
          <app-button variant="ghost" @tap="goBackToHistory">返回保养历史</app-button>
        </view>
      </template>
    </app-card>
  </app-page>
</template>

<script setup lang="ts">
import { onLoad } from "@dcloudio/uni-app";
import { computed, reactive, ref } from "vue";
import AppPage from "@/components/AppPage.vue";
import AppCard from "@/components/AppCard.vue";
import AppButton from "@/components/AppButton.vue";
import { useMotoStore } from "@/composables/useMotoStore";
import {
  useMaintenanceStore,
  type MaintenanceCategory,
  type MaintenanceRecord,
  type MaintenanceItem,
} from "@/composables/useMaintenanceStore";

type MaintenanceItemForm = {
  id: string;
  name: string;
  spec: string;
  dosage: string;
  unit: string;
  unitPrice: string;
  amount: string;
  partDetail: string;
};

type MaintenanceCategoryForm = {
  id: string;
  name: string;
  items: MaintenanceItemForm[];
};

type DatePickerEvent = {
  detail: {
    value: string;
  };
};

type LoadQuery = {
  id?: string;
};

const { vehicleDisplayName, tankCapacityDisplay, displacementDisplay } = useMotoStore();
const { getRecordById, saveRecord, toNumber, roundTo } = useMaintenanceStore();

const createFormId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const padNumber = (value: number) => `${value}`.padStart(2, "0");

const getTodayDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${padNumber(now.getMonth() + 1)}-${padNumber(now.getDate())}`;
};

const formatMoney = (value: number) => roundTo(value, 2).toFixed(2);

const toFormNumber = (value: number, digits = 2) => {
  if (!Number.isFinite(value) || value <= 0) {
    return "";
  }
  const formatted = roundTo(value, digits).toFixed(digits);
  return formatted.replace(/\.00$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
};

const createItemForm = (): MaintenanceItemForm => ({
  id: createFormId(),
  name: "",
  spec: "",
  dosage: "",
  unit: "",
  unitPrice: "",
  amount: "",
  partDetail: "",
});

const createCategoryForm = (name = ""): MaintenanceCategoryForm => ({
  id: createFormId(),
  name,
  items: [createItemForm()],
});

const maintenanceForm = reactive({
  date: getTodayDate(),
  odometer: "",
  note: "",
  categories: [createCategoryForm()] as MaintenanceCategoryForm[],
});

const editingRecordId = ref("");

const replaceFormCategories = (categories: MaintenanceCategoryForm[]) => {
  maintenanceForm.categories.splice(0, maintenanceForm.categories.length, ...categories);
};

const itemHasContent = (item: MaintenanceItemForm) => {
  return !!(
    item.name.trim() ||
    item.spec.trim() ||
    item.unit.trim() ||
    item.partDetail.trim() ||
    item.dosage.trim() ||
    item.unitPrice.trim() ||
    item.amount.trim()
  );
};

const itemPreviewAmount = (item: MaintenanceItemForm) => {
  const manualAmount = toNumber(item.amount);
  if (manualAmount > 0) {
    return roundTo(manualAmount, 2);
  }
  const dosage = toNumber(item.dosage);
  const unitPrice = toNumber(item.unitPrice);
  if (dosage > 0 && unitPrice > 0) {
    return roundTo(dosage * unitPrice, 2);
  }
  return 0;
};

const categoryPreviewSubtotal = (category: MaintenanceCategoryForm) => {
  return roundTo(category.items.reduce((sum, item) => sum + itemPreviewAmount(item), 0), 2);
};

const formTotalCost = computed(() => {
  return roundTo(
    maintenanceForm.categories.reduce((sum, category) => sum + categoryPreviewSubtotal(category), 0),
    2
  );
});

const clearItemForm = (item: MaintenanceItemForm) => {
  item.name = "";
  item.spec = "";
  item.dosage = "";
  item.unit = "";
  item.unitPrice = "";
  item.amount = "";
  item.partDetail = "";
};

const addCategory = () => {
  maintenanceForm.categories.push(createCategoryForm());
};

const removeCategory = (categoryIndex: number) => {
  if (maintenanceForm.categories.length <= 1) {
    const category = maintenanceForm.categories[0];
    category.name = "";
    if (!category.items.length) {
      category.items.push(createItemForm());
      return;
    }
    category.items.forEach((item) => clearItemForm(item));
    category.items.splice(1);
    return;
  }
  maintenanceForm.categories.splice(categoryIndex, 1);
};

const addItem = (categoryIndex: number) => {
  const category = maintenanceForm.categories[categoryIndex];
  if (!category) {
    return;
  }
  category.items.push(createItemForm());
};

const removeItem = (categoryIndex: number, itemIndex: number) => {
  const category = maintenanceForm.categories[categoryIndex];
  if (!category) {
    return;
  }
  if (category.items.length <= 1) {
    clearItemForm(category.items[0]);
    return;
  }
  category.items.splice(itemIndex, 1);
};

const resetForm = () => {
  maintenanceForm.date = getTodayDate();
  maintenanceForm.odometer = "";
  maintenanceForm.note = "";
  replaceFormCategories([createCategoryForm()]);
  editingRecordId.value = "";
};

const fillFormByRecord = (record: MaintenanceRecord) => {
  maintenanceForm.date = record.date;
  maintenanceForm.odometer = toFormNumber(record.odometer, 1);
  maintenanceForm.note = record.note || "";

  const categories = record.categories.map((category) => ({
    id: category.id,
    name: category.name,
    items: category.items.map((item) => ({
      id: item.id,
      name: item.name,
      spec: item.spec,
      dosage: toFormNumber(item.dosage, 2),
      unit: item.unit,
      unitPrice: toFormNumber(item.unitPrice, 2),
      amount: toFormNumber(item.amount, 2),
      partDetail: item.partDetail,
    })),
  }));

  replaceFormCategories(categories.length ? categories : [createCategoryForm()]);
};

const heroPills = computed(() => [
  { label: "爱车", value: vehicleDisplayName.value },
  { label: "油箱", value: tankCapacityDisplay.value },
  { label: "排量", value: displacementDisplay.value },
  { label: "模式", value: editingRecordId.value ? "编辑" : "新增" },
]);

const pageTitle = computed(() => (editingRecordId.value ? "编辑保养记录" : "新增保养记录"));

const pageSubtitle = computed(() =>
  editingRecordId.value ? "修改分类和项目明细，更新历史记录" : "固定日期和里程，动态补充分类与项目"
);

const onDateChange = (event: DatePickerEvent) => {
  maintenanceForm.date = event.detail.value;
};

const goBackToHistory = () => {
  uni.switchTab({ url: "/pkg-maintenance/index" });
};

const saveMaintenanceRecord = () => {
  const date = maintenanceForm.date.trim();
  const odometer = roundTo(toNumber(maintenanceForm.odometer), 1);

  if (!date) {
    uni.showToast({ title: "请选择保养日期", icon: "none" });
    return;
  }

  if (odometer <= 0) {
    uni.showToast({ title: "请填写保养里程", icon: "none" });
    return;
  }

  const categories: MaintenanceCategory[] = [];

  for (let categoryIndex = 0; categoryIndex < maintenanceForm.categories.length; categoryIndex += 1) {
    const categoryForm = maintenanceForm.categories[categoryIndex];
    const items: MaintenanceItem[] = [];

    for (let itemIndex = 0; itemIndex < categoryForm.items.length; itemIndex += 1) {
      const itemForm = categoryForm.items[itemIndex];
      if (!itemHasContent(itemForm)) {
        continue;
      }

      const name = itemForm.name.trim();
      if (!name) {
        uni.showToast({
          title: `请填写第${categoryIndex + 1}类第${itemIndex + 1}项名称`,
          icon: "none",
        });
        return;
      }

      const dosage = roundTo(toNumber(itemForm.dosage), 2);
      const unitPrice = roundTo(toNumber(itemForm.unitPrice), 2);
      const amount = itemPreviewAmount(itemForm);

      items.push({
        id: itemForm.id || createFormId(),
        name,
        spec: itemForm.spec.trim(),
        dosage,
        unit: itemForm.unit.trim(),
        unitPrice,
        amount,
        partDetail: itemForm.partDetail.trim(),
      });
    }

    if (!items.length) {
      continue;
    }

    categories.push({
      id: categoryForm.id || createFormId(),
      name: categoryForm.name.trim() || `分类${categories.length + 1}`,
      items,
      subtotal: roundTo(items.reduce((sum, item) => sum + item.amount, 0), 2),
    });
  }

  if (!categories.length) {
    uni.showToast({ title: "请至少填写一个保养项目", icon: "none" });
    return;
  }

  const totalCost = roundTo(categories.reduce((sum, category) => sum + category.subtotal, 0), 2);
  const result = saveRecord({
    id: editingRecordId.value || undefined,
    date,
    odometer,
    note: maintenanceForm.note.trim(),
    categories,
    totalCost,
  });

  if (!result.ok) {
    uni.showToast({ title: "保存失败，请检查填写内容", icon: "none" });
    return;
  }

  uni.showToast({
    title: result.updated ? "保养记录已更新" : "保养记录已保存",
    icon: "success",
  });

  setTimeout(() => {
    goBackToHistory();
  }, 220);
};

onLoad((query) => {
  const loadQuery = query as LoadQuery;
  const rawId = typeof loadQuery.id === "string" ? decodeURIComponent(loadQuery.id) : "";
  if (!rawId) {
    return;
  }

  const record = getRecordById(rawId);
  if (!record) {
    uni.showToast({ title: "未找到记录", icon: "none" });
    return;
  }

  editingRecordId.value = rawId;
  fillFormByRecord(record);
});
</script>

<style lang="scss" scoped>
.fixed-panel {
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
  gap: 14rpx;
  padding: 16rpx 0;
  border-bottom: 1rpx dashed var(--line);
}

.form-row.no-border {
  border-bottom: none;
}

.row-label {
  font-size: 24rpx;
  color: var(--ink-soft);
  display: flex;
  align-items: center;
  gap: 6rpx;
  flex-shrink: 0;
}

.required {
  color: #f87171;
  font-size: 22rpx;
}

.row-right {
  display: flex;
  align-items: center;
  gap: 10rpx;
  min-width: 0;
  color: var(--ink);
  font-weight: 600;
}

.row-value {
  font-size: 26rpx;
}

.row-input-wrap {
  flex: 1;
  min-width: 0;
  background: rgba(255, 255, 255, 0.95);
  border: 1rpx solid rgba(16, 60, 66, 0.16);
  border-radius: 16rpx;
  padding: 0 12rpx;
  height: 64rpx;
}

.note-wrap {
  height: 70rpx;
}

.row-input {
  flex: 1;
  min-width: 0;
  width: 100%;
  height: 64rpx;
  line-height: 64rpx;
  font-size: 25rpx;
  color: var(--ink);
  background: transparent;
  border: none;
}

.note-input {
  height: 70rpx;
  line-height: 70rpx;
}

.row-unit {
  font-size: 22rpx;
  color: var(--ink-muted);
}

.category-list {
  margin-top: 20rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.category-card {
  padding: 18rpx;
  border-radius: 20rpx;
  border: 1rpx solid rgba(16, 60, 66, 0.12);
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 10rpx 24rpx rgba(16, 29, 34, 0.06);
}

.category-head {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 10rpx;
}

.category-name-input {
  min-width: 0;
  height: 64rpx;
  line-height: 64rpx;
  border-radius: 14rpx;
  border: 1rpx solid rgba(16, 60, 66, 0.14);
  background: rgba(255, 255, 255, 0.95);
  padding: 0 14rpx;
  font-size: 24rpx;
  color: var(--ink);
}

.category-subtotal {
  font-size: 22rpx;
  color: #0f887d;
  font-weight: 600;
}

.icon-btn {
  width: 50rpx;
  height: 50rpx;
  border-radius: 14rpx;
  border: 1rpx solid rgba(16, 60, 66, 0.12);
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn.danger {
  border-color: rgba(220, 108, 80, 0.36);
  background: rgba(255, 245, 242, 0.92);
}

.item-list {
  margin-top: 14rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.item-card {
  padding: 12rpx;
  border-radius: 16rpx;
  background: rgba(246, 250, 251, 0.95);
  border: 1rpx solid rgba(16, 60, 66, 0.08);
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.item-row {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.item-row-top {
  align-items: stretch;
}

.item-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10rpx;
}

.item-grid-cell {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.item-grid-cell.small {
  max-width: 190rpx;
}

.cell-label {
  font-size: 20rpx;
  color: var(--ink-muted);
}

.item-input {
  min-width: 0;
  width: 100%;
  height: 60rpx;
  line-height: 60rpx;
  border-radius: 12rpx;
  border: 1rpx solid rgba(16, 60, 66, 0.14);
  background: rgba(255, 255, 255, 0.98);
  padding: 0 12rpx;
  font-size: 23rpx;
  color: var(--ink);
}

.item-input-main {
  flex: 1;
}

.item-auto {
  display: flex;
  justify-content: flex-end;
  font-size: 21rpx;
  color: #0f887d;
}

.category-actions {
  margin-top: 12rpx;
  display: flex;
}

.top-actions {
  margin-top: 16rpx;
  display: flex;
  gap: 12rpx;
}

.form-total {
  margin-top: 16rpx;
  border-radius: 18rpx;
  background: rgba(20, 184, 166, 0.12);
  border: 1rpx solid rgba(20, 184, 166, 0.22);
  padding: 14rpx 16rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.form-total-label {
  font-size: 23rpx;
  color: #11675e;
}

.form-total-value {
  font-size: 30rpx;
  font-weight: 700;
  color: #0e7f74;
}

.bottom-actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}
</style>
