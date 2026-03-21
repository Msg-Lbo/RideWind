import { computed, reactive, ref } from "vue";

/**
 * 爱车信息持久化结构。
 * 该类型对应本地缓存 `moto_vehicle_info` 的数据格式。
 */
export type VehiclePayload = {
  /** 车辆名称，例如：香帅650N */
  name: string;
  /** 油箱容量，单位：L */
  tankCapacity: number;
  /** 排量文本，例如：650 */
  displacement: string;
};

/**
 * 单条加油记录结构。
 * 该类型对应本地缓存 `moto_fuel_records` 的元素结构。
 */
export type RecordItem = {
  /** 记录唯一 ID */
  id: string;
  /** 格式化后的时间文本（用于列表展示） */
  time: string;
  /** 时间戳（毫秒） */
  timestamp: number;
  /** 输入的里程字段（当前业务语义：本次里程） */
  mileage: number;
  /** 机显单价，单位：元/升 */
  displayUnitPrice: number;
  /** 机显金额，单位：元 */
  displayAmount: number;
  /** 优惠金额，单位：元 */
  discountAmount: number;
  /** 实付单价，单位：元/升 */
  actualUnitPrice: number;
  /** 加油量，单位：升 */
  fuelAmount: number;
  /** 本次里程，单位：km */
  distance: number;
  /** 实付金额，单位：元 */
  amount: number;
  /** 百公里油耗，单位：L/100km */
  consumption: number;
  /** 百公里油费，单位：元/100km */
  costPer100: number;
  /** 本次加油占油箱比例，单位：% */
  tankPercent: number;
  /** 预估满箱续航，单位：km */
  fullRange: number;
};

const KEY_VEHICLE = "moto_vehicle_info";
const KEY_RECORDS = "moto_fuel_records";

/**
 * 数字左侧补零，保证长度至少两位。
 *
 * @param value 原始数字
 * @returns 补零后的字符串
 */
const padNumber = (value: number) => `${value}`.padStart(2, "0");

/**
 * 将日期对象格式化为 `YYYY-MM-DD`。
 *
 * @param date 日期对象
 * @returns 日期字符串
 */
const formatDateValue = (date: Date) =>
  `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`;

/**
 * 将日期对象格式化为 `HH:mm`。
 *
 * @param date 日期对象
 * @returns 时间字符串
 */
const formatTimeValue = (date: Date) => `${padNumber(date.getHours())}:${padNumber(date.getMinutes())}`;

/**
 * 获取当前系统时间，并拆分为页面表单需要的日期/时间字段。
 *
 * @returns 当前日期与时间
 */
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

/**
 * 安全转换数字。
 * 当输入不是合法数值时返回 0，避免 NaN 参与后续计算。
 *
 * @param value 字符串或数字输入
 * @returns 合法数字；非法输入返回 0
 */
const toNumber = (value: string | number) => {
  const num = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(num) ? num : 0;
};

/**
 * 对数字按指定小数位进行四舍五入。
 *
 * @param value 原始数字
 * @param digits 保留的小数位数，默认 2 位
 * @returns 四舍五入后的数字
 */
const roundTo = (value: number, digits = 2) => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

/**
 * 将数字转换为表单展示字符串。
 *
 * @param value 原始数字
 * @param allowZero 是否允许 0 以字符串形式展示
 * @param digits 指定后按该小数位数格式化
 * @returns 适合绑定到输入框的字符串
 */
const toFormValue = (value: number, allowZero = false, digits?: number) => {
  if (!Number.isFinite(value)) {
    return "";
  }
  const normalized = typeof digits === "number" ? roundTo(value, digits) : value;
  if (normalized > 0) {
    return typeof digits === "number" ? normalized.toFixed(digits) : `${normalized}`;
  }
  if (allowZero && normalized === 0) {
    return typeof digits === "number" ? (0).toFixed(digits) : "0";
  }
  return "";
};

/**
 * 统一数值展示格式。
 *
 * @param value 原始数字
 * @param digits 小数位数，默认 2 位
 * @returns 格式化后的数字字符串；无效值返回 `--`
 */
const formatValue = (value: number, digits = 2) => {
  if (!Number.isFinite(value) || value <= 0) {
    return "--";
  }
  return value.toFixed(digits);
};

/**
 * 将时间戳格式化为完整时间文本（用于记录展示）。
 *
 * @param timestamp 时间戳（毫秒）
 * @returns `YYYY-MM-DD HH:mm`
 */
const formatRecordTime = (timestamp: number) => {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${padNumber(d.getMonth() + 1)}-${padNumber(d.getDate())} ${padNumber(
    d.getHours()
  )}:${padNumber(d.getMinutes())}`;
};

/**
 * 将表单日期/时间组合为时间戳。
 * 输入异常时降级为当前时间，防止保存失败。
 *
 * @param date 日期字符串（YYYY-MM-DD）
 * @param time 时间字符串（HH:mm）
 * @returns 时间戳（毫秒）
 */
const buildRecordTimestamp = (date: string, time: string) => {
  if (!date) {
    return Date.now();
  }
  const safeDate = date.replace(/-/g, "/");
  const safeTime = time ? `${time}:00` : "00:00:00";
  const timestamp = new Date(`${safeDate} ${safeTime}`).getTime();
  return Number.isNaN(timestamp) ? Date.now() : timestamp;
};

/**
 * 计算当前记录的派生指标。
 *
 * @param fuelAmount 加油量（L）
 * @param distance 本次里程（km）
 * @param amount 实付金额（元）
 * @param tankCapacity 油箱容量（L）
 * @returns 包含油耗、油费、占油箱比例和满箱续航
 */
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

/**
 * 机显金额（元）。
 * 优先级：手填机显金额 > 机显单价*加油量 > 实付金额+优惠金额（或由实付单价反推）。
 */
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

/**
 * 实付金额（元）。
 * 优先级：手填实付金额 > 实付单价*加油量 > 机显金额-优惠金额。
 */
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

/**
 * 优惠金额（元）。
 * 当机显金额和实付金额都存在时，优先用两者差值自动推导。
 */
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

/**
 * 机显单价（元/升）。
 * 可由机显金额与加油量反推。
 */
const displayUnitPriceValue = computed(() => {
  const input = toNumber(recordForm.displayUnitPrice);
  if (input > 0) {
    return input;
  }
  const total = displayAmount.value;
  const fuelAmount = toNumber(recordForm.fuelAmount);
  return fuelAmount > 0 && total > 0 ? total / fuelAmount : 0;
});

/**
 * 实付单价（元/升）。
 * 可由实付金额与加油量反推。
 */
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

/**
 * 预览区使用的本次里程（km）。
 * 当前业务约定：表单里程字段就是本次里程。
 */
const previewDistance = computed(() => {
  const distance = toNumber(recordForm.mileage);
  if (distance <= 0) {
    return 0;
  }
  return distance;
});

/**
 * 录入页实时预览指标。
 * 当关键输入不完整时，`hasBasic/hasCost/hasTank` 会为 false。
 */
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

/**
 * 全部记录汇总统计（用于首页趋势卡片）。
 */
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

/**
 * 将记录内容回填到录入表单。
 *
 * @param record 需要回填的记录对象
 */
const setFormFromRecord = (record: RecordItem) => {
  const date = new Date(record.timestamp);
  recordForm.date = formatDateValue(date);
  recordForm.time = formatTimeValue(date);
  const distanceValue = record.distance > 0 ? record.distance : record.mileage;
  recordForm.mileage = toFormValue(distanceValue);
  recordForm.displayUnitPrice = toFormValue(record.displayUnitPrice, false, 2);
  recordForm.fuelAmount = toFormValue(record.fuelAmount, false, 2);
  recordForm.displayAmount = toFormValue(record.displayAmount, false, 2);
  recordForm.actualUnitPrice = toFormValue(record.actualUnitPrice, false, 2);
  recordForm.discountAmount = toFormValue(record.discountAmount, true, 2);
  recordForm.actualAmount = toFormValue(record.amount, false, 2);
};

/**
 * 进入编辑模式。
 *
 * @param id 记录 ID
 * @returns 是否成功进入编辑模式
 */
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

/**
 * 兼容历史数据并补齐关键字段。
 *
 * @param item 原始记录（可能缺少部分字段）
 * @returns 归一化后的完整记录
 */
const normalizeRecord = (item: RecordItem) => {
  const timestamp = item.timestamp || Number(item.id) || Date.parse(item.time) || Date.now();
  const fuelAmount = roundTo(Number(item.fuelAmount) || 0, 2);
  const displayUnitPrice =
    roundTo(Number(item.displayUnitPrice), 2) ||
    roundTo(
      fuelAmount > 0
        ? (Number(item.displayAmount) || Number(item.amount) || 0) / fuelAmount
        : 0,
      2
    );
  const displayAmount =
    roundTo(Number(item.displayAmount), 2) ||
    roundTo(displayUnitPrice > 0 ? displayUnitPrice * fuelAmount : 0, 2);
  const discountAmount = roundTo(Number(item.discountAmount) || 0, 2);
  const amount =
    roundTo(Number(item.amount), 2) ||
    roundTo(displayAmount > 0 ? Math.max(0, displayAmount - discountAmount) : 0, 2);
  const actualUnitPrice =
    roundTo(Number(item.actualUnitPrice), 2) || roundTo(fuelAmount > 0 ? amount / fuelAmount : 0, 2);
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

/**
 * 首次使用时从本地缓存加载数据。
 * 使用 `loaded` 标识保证只加载一次。
 */
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

/**
 * 保存爱车信息。
 * 会做基本字段校验，成功后写入本地缓存。
 */
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

/**
 * 重置爱车信息并清除本地缓存。
 */
const resetVehicle = () => {
  vehicleForm.name = "";
  vehicleForm.tankCapacity = "";
  vehicleForm.displacement = "";
  uni.removeStorageSync(KEY_VEHICLE);
};

/**
 * 重置加油录入表单为初始状态。
 */
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

/**
 * 新增或更新一条加油记录。
 *
 * - 新增：生成新 ID 并插入列表
 * - 编辑：按 `editingRecordId` 覆盖原记录
 *
 * @returns 是否保存成功
 */
const addRecord = () => {
  if (recordSubmitLock) {
    return false;
  }

  recordSubmitLock = true;
  /**
   * 释放提交锁，防止重复点击导致重复写入。
   *
   * @param delay 延迟释放毫秒数；0 表示立即释放
   */
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
  const fuelAmount = roundTo(toNumber(recordForm.fuelAmount), 2);
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
    uni.showToast({ title: "请填写本次里程", icon: "none" });
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

  const displayAmountValue = roundTo(displayAmount.value, 2);
  if (displayAmountValue <= 0) {
    releaseLock();
    uni.showToast({ title: "请填写机显金额或机显单价", icon: "none" });
    return false;
  }

  const actualAmountValue = roundTo(actualAmount.value, 2);
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

  const discountAmountValueNumber = roundTo(discountAmountValue.value, 2);
  if (discountAmountValueNumber > displayAmountValue) {
    releaseLock();
    uni.showToast({ title: "优惠金额不能大于机显金额", icon: "none" });
    return false;
  }

  const displayUnitPriceNumber = roundTo(displayUnitPriceValue.value, 2);

  const timestamp = buildRecordTimestamp(date, time);
  const distance = mileage;
  if (distance <= 0) {
    releaseLock();
    uni.showToast({ title: "本次里程需大于 0", icon: "none" });
    return false;
  }

  const metrics = calcMetrics(fuelAmount, distance, actualAmountValue, tankCapacity);
  const actualUnitPriceNumber = roundTo(actualUnitPrice.value, 2);
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

/**
 * 删除单条记录。
 *
 * @param id 记录 ID
 */
const removeRecord = (id: string) => {
  records.value = records.value.filter((item) => item.id !== id);
  uni.setStorageSync(KEY_RECORDS, records.value);
};

/**
 * 清空全部记录（带确认弹窗）。
 */
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

/**
 * 统一对外暴露油耗业务状态与操作。
 */
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
