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

const vehicleForm = reactive({
  name: "",
  tankCapacity: "",
  displacement: "",
});

const recordForm = reactive({
  fuelAmount: "",
  distance: "",
  amount: "",
});

const records = ref<RecordItem[]>([]);

let loaded = false;
let recordSubmitLock = false;

const toNumber = (value: string | number) => {
  const num = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(num) ? num : 0;
};

const formatValue = (value: number, digits = 2) => {
  if (!Number.isFinite(value) || value <= 0) {
    return "--";
  }
  return value.toFixed(digits);
};

const formatRecordTime = (timestamp: number) => {
  const d = new Date(timestamp);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
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

const preview = computed(() => {
  const fuelAmount = toNumber(recordForm.fuelAmount);
  const distance = toNumber(recordForm.distance);
  const amount = toNumber(recordForm.amount);
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

const normalizeRecord = (item: RecordItem) => {
  const timestamp = item.timestamp || Number(item.id) || Date.parse(item.time) || Date.now();
  return {
    ...item,
    timestamp,
    time: formatRecordTime(timestamp),
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
    records.value = savedRecords.map((item) => normalizeRecord(item));
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
  recordForm.fuelAmount = "";
  recordForm.distance = "";
  recordForm.amount = "";
};

const addRecord = () => {
  if (recordSubmitLock) {
    return;
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
  const fuelAmount = toNumber(recordForm.fuelAmount);
  const distance = toNumber(recordForm.distance);
  const amount = toNumber(recordForm.amount);

  if (!name || tankCapacity <= 0 || !displacement) {
    releaseLock();
    uni.showToast({ title: "请先填写爱车信息", icon: "none" });
    return;
  }

  if (fuelAmount <= 0 || distance <= 0 || amount <= 0) {
    releaseLock();
    uni.showToast({ title: "请填写完整的加油数据", icon: "none" });
    return;
  }

  const metrics = calcMetrics(fuelAmount, distance, amount, tankCapacity);
  const timestamp = Date.now();
  const record: RecordItem = {
    id: `${timestamp}`,
    time: formatRecordTime(timestamp),
    timestamp,
    fuelAmount,
    distance,
    amount,
    ...metrics,
  };

  records.value = [record, ...records.value];
  uni.setStorageSync(KEY_RECORDS, records.value);
  resetRecord();
  uni.showToast({ title: "记录已保存", icon: "success" });
  releaseLock(600);
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
    formatValue,
    toNumber,
    calcMetrics,
    saveVehicle,
    resetVehicle,
    resetRecord,
    addRecord,
    removeRecord,
    clearRecords,
  };
};
