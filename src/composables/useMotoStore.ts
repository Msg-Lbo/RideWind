import { computed, reactive, ref } from "vue";

export type VehiclePayload = {
  name: string;
  tankCapacity: number;
  displacement: string;
};

export type RecordItem = {
  id: string;
  time: string;
  timestamp: number;
  mileage: number;
  displayUnitPrice: number;
  displayAmount: number;
  discountAmount: number;
  actualUnitPrice: number;
  fuelAmount: number;
  distance: number;
  amount: number;
  consumption: number;
  costPer100: number;
  tankPercent: number;
  fullRange: number;
};

const KEY_VEHICLE = "moto_vehicle_info";
const KEY_RECORDS = "moto_fuel_records";

const padNumber = (value: number) => `${value}`.padStart(2, "0");

const formatDateValue = (date: Date) =>
  `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`;

const formatTimeValue = (date: Date) => `${padNumber(date.getHours())}:${padNumber(date.getMinutes())}`;

const getNowDateTime = () => {
  const now = new Date();
  return {
    date: formatDateValue(now),
    time: formatTimeValue(now),
  };
};

const vehicleForm = reactive({
  name: "",
  tankCapacity: "",
  displacement: "",
});

const nowDateTime = getNowDateTime();

const recordForm = reactive({
  date: nowDateTime.date,
  time: nowDateTime.time,
  mileage: "",
  displayUnitPrice: "",
  fuelAmount: "",
  displayAmount: "",
  actualUnitPrice: "",
  discountAmount: "",
  actualAmount: "",
});

const records = ref<RecordItem[]>([]);
const editingRecordId = ref<string | null>(null);

let loaded = false;
let recordSubmitLock = false;

const toNumber = (value: string | number) => {
  const num = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(num) ? num : 0;
};

const toFormValue = (value: number, allowZero = false) => {
  if (!Number.isFinite(value)) {
    return "";
  }
  if (value > 0) {
    return `${value}`;
  }
  if (allowZero && value === 0) {
    return "0";
  }
  return "";
};

const formatValue = (value: number, digits = 2) => {
  if (!Number.isFinite(value) || value <= 0) {
    return "--";
  }
  return value.toFixed(digits);
};

const formatRecordTime = (timestamp: number) => {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${padNumber(d.getMonth() + 1)}-${padNumber(d.getDate())} ${padNumber(
    d.getHours()
  )}:${padNumber(d.getMinutes())}`;
};

const buildRecordTimestamp = (date: string, time: string) => {
  if (!date) {
    return Date.now();
  }
  const safeDate = date.replace(/-/g, "/");
  const safeTime = time ? `${time}:00` : "00:00:00";
  const timestamp = new Date(`${safeDate} ${safeTime}`).getTime();
  return Number.isNaN(timestamp) ? Date.now() : timestamp;
};

const calcMetrics = (
  fuelAmount: number,
  distance: number,
  amount: number,
  tankCapacity: number
) => {
  const consumption = fuelAmount > 0 && distance > 0 ? (fuelAmount / distance) * 100 : 0;
  const costPer100 = amount > 0 && distance > 0 ? (amount / distance) * 100 : 0;
  const tankPercent = tankCapacity > 0 && fuelAmount > 0 ? (fuelAmount / tankCapacity) * 100 : 0;
  const fullRange =
    tankCapacity > 0 && fuelAmount > 0 && distance > 0 ? (tankCapacity / fuelAmount) * distance : 0;

  return {
    consumption,
    costPer100,
    tankPercent,
    fullRange,
  };
};

const getPreviousRecord = (currentId: string | null, timestamp: number): RecordItem | null => {
  let prev: RecordItem | null = null;
  records.value.forEach((item) => {
    if (currentId && item.id === currentId) {
      return;
    }
    if (item.timestamp < timestamp && (!prev || item.timestamp > prev.timestamp)) {
      prev = item;
    }
  });
  return prev;
};

const getNextRecord = (currentId: string | null, timestamp: number): RecordItem | null => {
  let next: RecordItem | null = null;
  records.value.forEach((item) => {
    if (currentId && item.id === currentId) {
      return;
    }
    if (item.timestamp > timestamp && (!next || item.timestamp < next.timestamp)) {
      next = item;
    }
  });
  return next;
};

const displayAmount = computed(() => {
  const input = toNumber(recordForm.displayAmount);
  if (input > 0) {
    return input;
  }
  const unitPrice = toNumber(recordForm.displayUnitPrice);
  const fuelAmount = toNumber(recordForm.fuelAmount);
  if (unitPrice > 0 && fuelAmount > 0) {
    return unitPrice * fuelAmount;
  }
  const actualInput = toNumber(recordForm.actualAmount);
  const actualUnitInput = toNumber(recordForm.actualUnitPrice);
  const discountInput = toNumber(recordForm.discountAmount);
  if (actualInput > 0 && recordForm.discountAmount.trim() !== "") {
    return actualInput + Math.max(0, discountInput);
  }
  if (actualInput <= 0 && actualUnitInput > 0 && fuelAmount > 0 && recordForm.discountAmount.trim() !== "") {
    return actualUnitInput * fuelAmount + Math.max(0, discountInput);
  }
  if (actualInput > 0) {
    return actualInput;
  }
  if (actualUnitInput > 0 && fuelAmount > 0) {
    return actualUnitInput * fuelAmount;
  }
  return 0;
});

const actualAmount = computed(() => {
  const input = toNumber(recordForm.actualAmount);
  if (input > 0) {
    return input;
  }
  const fuelAmount = toNumber(recordForm.fuelAmount);
  const actualUnitInput = toNumber(recordForm.actualUnitPrice);
  if (actualUnitInput > 0 && fuelAmount > 0) {
    return actualUnitInput * fuelAmount;
  }
  const total = displayAmount.value;
  if (!total) {
    return 0;
  }
  if (recordForm.discountAmount.trim() !== "") {
    const discountInput = Math.max(0, toNumber(recordForm.discountAmount));
    return Math.max(0, total - discountInput);
  }
  return total;
});

const discountAmountValue = computed(() => {
  const total = displayAmount.value;
  const actualInput = toNumber(recordForm.actualAmount);
  const actualUnitInput = toNumber(recordForm.actualUnitPrice);
  const hasDiscountInput = recordForm.discountAmount.trim() !== "";
  if (total > 0 && (actualInput > 0 || actualUnitInput > 0)) {
    return Math.max(0, total - actualAmount.value);
  }
  if (!hasDiscountInput) {
    return 0;
  }
  return Math.max(0, toNumber(recordForm.discountAmount));
});

const displayUnitPriceValue = computed(() => {
  const input = toNumber(recordForm.displayUnitPrice);
  if (input > 0) {
    return input;
  }
  const total = displayAmount.value;
  const fuelAmount = toNumber(recordForm.fuelAmount);
  return fuelAmount > 0 && total > 0 ? total / fuelAmount : 0;
});

const actualUnitPrice = computed(() => {
  const fuelAmount = toNumber(recordForm.fuelAmount);
  const amountInput = toNumber(recordForm.actualAmount);
  if (amountInput > 0 && fuelAmount > 0) {
    return amountInput / fuelAmount;
  }
  const input = toNumber(recordForm.actualUnitPrice);
  if (input > 0) {
    return input;
  }
  return fuelAmount > 0 ? actualAmount.value / fuelAmount : 0;
});

const previewDistance = computed(() => {
  const mileage = toNumber(recordForm.mileage);
  if (mileage <= 0) {
    return 0;
  }
  const timestamp = buildRecordTimestamp(recordForm.date, recordForm.time);
  const prevRecord = getPreviousRecord(editingRecordId.value, timestamp);
  const prevMileage = prevRecord?.mileage ?? 0;
  return prevMileage > 0 ? (mileage > prevMileage ? mileage - prevMileage : 0) : mileage;
});

const preview = computed(() => {
  const fuelAmount = toNumber(recordForm.fuelAmount);
  const distance = previewDistance.value;
  const amount = actualAmount.value;
  const tankCapacity = toNumber(vehicleForm.tankCapacity);

  const metrics = calcMetrics(fuelAmount, distance, amount, tankCapacity);

  return {
    ...metrics,
    hasBasic: fuelAmount > 0 && distance > 0,
    hasCost: amount > 0 && distance > 0,
    hasTank: tankCapacity > 0 && fuelAmount > 0,
  };
});

const stats = computed(() => {
  const totalDistance = records.value.reduce((sum, item) => sum + item.distance, 0);
  const totalFuel = records.value.reduce((sum, item) => sum + item.fuelAmount, 0);
  const totalAmount = records.value.reduce((sum, item) => sum + item.amount, 0);
  const avgConsumption = totalDistance > 0 ? (totalFuel / totalDistance) * 100 : 0;
  const avgCostPer100 = totalDistance > 0 ? (totalAmount / totalDistance) * 100 : 0;

  return {
    totalDistance,
    totalFuel,
    totalAmount,
    avgConsumption,
    avgCostPer100,
    hasData: totalDistance > 0,
  };
});

const vehicleDisplayName = computed(() => vehicleForm.name.trim() || "未命名");
const tankCapacityDisplay = computed(() => {
  const tankCapacity = toNumber(vehicleForm.tankCapacity);
  return tankCapacity > 0 ? `${tankCapacity} L` : "未填写";
});
const displacementDisplay = computed(() => vehicleForm.displacement.trim() || "未填写");
const latestRecord = computed(() => records.value[0] ?? null);
const isEditing = computed(() => !!editingRecordId.value);

const setFormFromRecord = (record: RecordItem) => {
  const date = new Date(record.timestamp);
  recordForm.date = formatDateValue(date);
  recordForm.time = formatTimeValue(date);
  recordForm.mileage = toFormValue(record.mileage);
  recordForm.displayUnitPrice = toFormValue(record.displayUnitPrice);
  recordForm.fuelAmount = toFormValue(record.fuelAmount);
  recordForm.displayAmount = toFormValue(record.displayAmount);
  recordForm.actualUnitPrice = toFormValue(record.actualUnitPrice);
  recordForm.discountAmount = toFormValue(record.discountAmount, true);
  recordForm.actualAmount = toFormValue(record.amount);
};

const startEditRecord = (id: string) => {
  const record = records.value.find((item) => item.id === id);
  if (!record) {
    uni.showToast({ title: "未找到记录", icon: "none" });
    return false;
  }
  editingRecordId.value = id;
  setFormFromRecord(record);
  return true;
};

const normalizeRecord = (item: RecordItem) => {
  const timestamp = item.timestamp || Number(item.id) || Date.parse(item.time) || Date.now();
  const fuelAmount = Number(item.fuelAmount) || 0;
  const displayUnitPrice =
    Number(item.displayUnitPrice) ||
    (fuelAmount > 0
      ? (Number(item.displayAmount) || Number(item.amount) || 0) / fuelAmount
      : 0);
  const displayAmount =
    Number(item.displayAmount) || (displayUnitPrice > 0 ? displayUnitPrice * fuelAmount : 0);
  const discountAmount = Number(item.discountAmount) || 0;
  const amount =
    Number(item.amount) || (displayAmount > 0 ? Math.max(0, displayAmount - discountAmount) : 0);
  const actualUnitPrice = Number(item.actualUnitPrice) || (fuelAmount > 0 ? amount / fuelAmount : 0);
  const mileage = Number(item.mileage) || 0;
  const distance = Number(item.distance) || 0;

  return {
    ...item,
    timestamp,
    time: formatRecordTime(timestamp),
    fuelAmount,
    displayUnitPrice,
    displayAmount,
    discountAmount,
    actualUnitPrice,
    mileage,
    distance,
    amount,
  };
};

const ensureLoaded = () => {
  if (loaded) {
    return;
  }

  loaded = true;
  const savedVehicle = uni.getStorageSync(KEY_VEHICLE) as VehiclePayload | undefined;
  if (savedVehicle) {
    vehicleForm.name = savedVehicle.name || "";
    vehicleForm.tankCapacity = savedVehicle.tankCapacity ? `${savedVehicle.tankCapacity}` : "";
    vehicleForm.displacement = savedVehicle.displacement || "";
  }

  const savedRecords = uni.getStorageSync(KEY_RECORDS) as RecordItem[] | undefined;
  if (Array.isArray(savedRecords)) {
    records.value = savedRecords
      .map((item) => normalizeRecord(item))
      .sort((a, b) => b.timestamp - a.timestamp);
  }
};

const saveVehicle = () => {
  const name = vehicleForm.name.trim();
  const tankCapacity = toNumber(vehicleForm.tankCapacity);
  const displacement = vehicleForm.displacement.trim();

  if (!name || tankCapacity <= 0 || !displacement) {
    uni.showToast({ title: "请完善爱车信息", icon: "none" });
    return;
  }

  const payload: VehiclePayload = {
    name,
    tankCapacity,
    displacement,
  };

  uni.setStorageSync(KEY_VEHICLE, payload);
  uni.showToast({ title: "已保存", icon: "success" });
};

const resetVehicle = () => {
  vehicleForm.name = "";
  vehicleForm.tankCapacity = "";
  vehicleForm.displacement = "";
  uni.removeStorageSync(KEY_VEHICLE);
};

const resetRecord = () => {
  const now = getNowDateTime();
  recordForm.date = now.date;
  recordForm.time = now.time;
  recordForm.mileage = "";
  recordForm.displayUnitPrice = "";
  recordForm.fuelAmount = "";
  recordForm.displayAmount = "";
  recordForm.actualUnitPrice = "";
  recordForm.discountAmount = "";
  recordForm.actualAmount = "";
  editingRecordId.value = null;
};

const addRecord = () => {
  if (recordSubmitLock) {
    return false;
  }

  recordSubmitLock = true;
  const releaseLock = (delay = 0) => {
    if (delay > 0) {
      setTimeout(() => {
        recordSubmitLock = false;
      }, delay);
      return;
    }
    recordSubmitLock = false;
  };

  const name = vehicleForm.name.trim();
  const tankCapacity = toNumber(vehicleForm.tankCapacity);
  const displacement = vehicleForm.displacement.trim();
  const date = recordForm.date.trim();
  const time = recordForm.time.trim();
  const mileage = toNumber(recordForm.mileage);
  const fuelAmount = toNumber(recordForm.fuelAmount);
  const discountInput = toNumber(recordForm.discountAmount);
  const editingId = editingRecordId.value;

  if (!name || tankCapacity <= 0 || !displacement) {
    releaseLock();
    uni.showToast({ title: "请先填写爱车信息", icon: "none" });
    return false;
  }

  if (!date) {
    releaseLock();
    uni.showToast({ title: "请选择加油日期", icon: "none" });
    return false;
  }

  if (!time) {
    releaseLock();
    uni.showToast({ title: "请选择加油时间", icon: "none" });
    return false;
  }

  if (mileage <= 0) {
    releaseLock();
    uni.showToast({ title: "请填写当前里程", icon: "none" });
    return false;
  }

  if (fuelAmount <= 0) {
    releaseLock();
    uni.showToast({ title: "请填写加油量", icon: "none" });
    return false;
  }

  if (discountInput < 0) {
    releaseLock();
    uni.showToast({ title: "优惠金额不能为负", icon: "none" });
    return false;
  }

  const displayAmountValue = displayAmount.value;
  if (displayAmountValue <= 0) {
    releaseLock();
    uni.showToast({ title: "请填写机显金额或机显单价", icon: "none" });
    return false;
  }

  const actualAmountValue = actualAmount.value;
  if (actualAmountValue <= 0) {
    releaseLock();
    uni.showToast({ title: "请填写实付金额", icon: "none" });
    return false;
  }

  if (actualAmountValue > displayAmountValue) {
    releaseLock();
    uni.showToast({ title: "实付金额不能大于机显金额", icon: "none" });
    return false;
  }

  const discountAmountValueNumber = discountAmountValue.value;
  if (discountAmountValueNumber > displayAmountValue) {
    releaseLock();
    uni.showToast({ title: "优惠金额不能大于机显金额", icon: "none" });
    return false;
  }

  const displayUnitPriceNumber = displayUnitPriceValue.value;

  const timestamp = buildRecordTimestamp(date, time);
  const prevRecord = getPreviousRecord(editingId, timestamp);
  const nextRecord = getNextRecord(editingId, timestamp);
  const prevMileage = prevRecord?.mileage ?? 0;
  const nextMileage = nextRecord?.mileage ?? 0;

  if (prevMileage > 0 && mileage <= prevMileage) {
    releaseLock();
    uni.showToast({ title: "当前里程需大于上次记录里程", icon: "none" });
    return false;
  }

  if (nextMileage > 0 && mileage >= nextMileage) {
    releaseLock();
    uni.showToast({ title: "当前里程需小于后续记录里程", icon: "none" });
    return false;
  }

  const distance = prevMileage > 0 ? mileage - prevMileage : mileage;
  if (distance <= 0) {
    releaseLock();
    uni.showToast({ title: "小计里程需大于 0", icon: "none" });
    return false;
  }

  const metrics = calcMetrics(fuelAmount, distance, actualAmountValue, tankCapacity);
  const actualUnitPriceNumber = actualUnitPrice.value;
  const timeLabel = formatRecordTime(timestamp);

  if (editingId) {
    const recordIndex = records.value.findIndex((item) => item.id === editingId);
    if (recordIndex === -1) {
      releaseLock();
      uni.showToast({ title: "未找到可编辑记录", icon: "none" });
      editingRecordId.value = null;
      return false;
    }

    const baseRecord = records.value[recordIndex];
    const record: RecordItem = {
      ...baseRecord,
      time: timeLabel,
      timestamp,
      mileage,
      displayUnitPrice: displayUnitPriceNumber,
      displayAmount: displayAmountValue,
      discountAmount: discountAmountValueNumber,
      actualUnitPrice: actualUnitPriceNumber,
      fuelAmount,
      distance,
      amount: actualAmountValue,
      ...metrics,
    };
    records.value.splice(recordIndex, 1, record);
    records.value = [...records.value].sort((a, b) => b.timestamp - a.timestamp);
    uni.setStorageSync(KEY_RECORDS, records.value);
    resetRecord();
    uni.showToast({ title: "记录已更新", icon: "success" });
    releaseLock(600);
    return true;
  }

  const record: RecordItem = {
    id: `${timestamp}-${Math.random().toString(36).slice(2, 6)}`,
    time: timeLabel,
    timestamp,
    mileage,
    displayUnitPrice: displayUnitPriceNumber,
    displayAmount: displayAmountValue,
    discountAmount: discountAmountValueNumber,
    actualUnitPrice: actualUnitPriceNumber,
    fuelAmount,
    distance,
    amount: actualAmountValue,
    ...metrics,
  };

  records.value = [record, ...records.value].sort((a, b) => b.timestamp - a.timestamp);
  uni.setStorageSync(KEY_RECORDS, records.value);
  resetRecord();
  uni.showToast({ title: "记录已保存", icon: "success" });
  releaseLock(600);
  return true;
};

const removeRecord = (id: string) => {
  records.value = records.value.filter((item) => item.id !== id);
  uni.setStorageSync(KEY_RECORDS, records.value);
};

const clearRecords = () => {
  uni.showModal({
    title: "清空记录",
    content: "确定要清空所有油耗记录吗？",
    success: (res) => {
      if (res.confirm) {
        records.value = [];
        uni.removeStorageSync(KEY_RECORDS);
      }
    },
  });
};

export const useMotoStore = () => {
  ensureLoaded();

  return {
    vehicleForm,
    recordForm,
    records,
    preview,
    stats,
    latestRecord,
    vehicleDisplayName,
    tankCapacityDisplay,
    displacementDisplay,
    isEditing,
    formatValue,
    displayAmount,
    actualAmount,
    actualUnitPrice,
    previewDistance,
    toNumber,
    calcMetrics,
    startEditRecord,
    saveVehicle,
    resetVehicle,
    resetRecord,
    addRecord,
    removeRecord,
    clearRecords,
  };
};
