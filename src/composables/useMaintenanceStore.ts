import { computed, ref } from "vue";

export type MaintenanceItem = {
  id: string;
  name: string;
  spec: string;
  dosage: number;
  unit: string;
  unitPrice: number;
  amount: number;
  partDetail: string;
};

export type MaintenanceCategory = {
  id: string;
  name: string;
  items: MaintenanceItem[];
  subtotal: number;
};

export type MaintenanceRecord = {
  id: string;
  date: string;
  odometer: number;
  categories: MaintenanceCategory[];
  totalCost: number;
  note: string;
  createdAt: number;
  updatedAt: number;
};

export type MaintenanceRecordInput = {
  id?: string;
  date: string;
  odometer: number;
  categories: MaintenanceCategory[];
  totalCost: number;
  note?: string;
};

const KEY_MAINTENANCE_RECORDS = "moto_maintenance_records";

const maintenanceRecords = ref<MaintenanceRecord[]>([]);
let loaded = false;

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const toNumber = (value: string | number) => {
  const numeric = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const roundTo = (value: number, digits = 2) => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

const parseDateTs = (date: string) => {
  if (!date) {
    return 0;
  }
  const timestamp = new Date(`${date.replace(/-/g, "/")} 00:00:00`).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const sortRecords = (records: MaintenanceRecord[]) => {
  return [...records].sort((a, b) => {
    const dateDiff = parseDateTs(b.date) - parseDateTs(a.date);
    if (dateDiff !== 0) {
      return dateDiff;
    }
    return b.updatedAt - a.updatedAt;
  });
};

const normalizeItem = (item: Partial<MaintenanceItem>, itemIndex: number): MaintenanceItem | null => {
  const name = typeof item.name === "string" ? item.name.trim() : "";
  const spec = typeof item.spec === "string" ? item.spec.trim() : "";
  const unit = typeof item.unit === "string" ? item.unit.trim() : "";
  const partDetail = typeof item.partDetail === "string" ? item.partDetail.trim() : "";
  const dosage = roundTo(toNumber(item.dosage ?? 0), 2);
  const unitPrice = roundTo(toNumber(item.unitPrice ?? 0), 2);
  const rawAmount = toNumber(item.amount ?? 0);
  const amount = rawAmount > 0 ? roundTo(rawAmount, 2) : roundTo(dosage * unitPrice, 2);

  if (!name && !spec && !unit && !partDetail && dosage <= 0 && unitPrice <= 0 && amount <= 0) {
    return null;
  }

  return {
    id: typeof item.id === "string" && item.id ? item.id : createId(),
    name: name || `项目${itemIndex + 1}`,
    spec,
    dosage,
    unit,
    unitPrice,
    amount,
    partDetail,
  };
};

const normalizeCategory = (
  category: Partial<MaintenanceCategory>,
  categoryIndex: number
): MaintenanceCategory | null => {
  const itemsRaw = Array.isArray(category.items) ? category.items : [];
  const items = itemsRaw
    .map((item, itemIndex) => normalizeItem(item, itemIndex))
    .filter((item): item is MaintenanceItem => !!item);

  if (!items.length) {
    return null;
  }

  const subtotal = roundTo(items.reduce((sum, item) => sum + item.amount, 0), 2);
  const name = typeof category.name === "string" ? category.name.trim() : "";

  return {
    id: typeof category.id === "string" && category.id ? category.id : createId(),
    name: name || `分类${categoryIndex + 1}`,
    items,
    subtotal,
  };
};

const normalizeRecord = (record: Partial<MaintenanceRecord>): MaintenanceRecord => {
  const categoriesRaw = Array.isArray(record.categories) ? record.categories : [];
  const categories = categoriesRaw
    .map((category, categoryIndex) => normalizeCategory(category, categoryIndex))
    .filter((category): category is MaintenanceCategory => !!category);

  const totalCost = roundTo(categories.reduce((sum, category) => sum + category.subtotal, 0), 2);
  const createdAt = Number(record.createdAt) || Date.now();
  const updatedAt = Number(record.updatedAt) || createdAt;

  return {
    id: typeof record.id === "string" && record.id ? record.id : createId(),
    date: typeof record.date === "string" ? record.date : "",
    odometer: roundTo(toNumber(record.odometer ?? 0), 1),
    categories,
    totalCost,
    note: typeof record.note === "string" ? record.note : "",
    createdAt,
    updatedAt,
  };
};

const persistRecords = () => {
  uni.setStorageSync(KEY_MAINTENANCE_RECORDS, maintenanceRecords.value);
};

const ensureLoaded = () => {
  if (loaded) {
    return;
  }

  loaded = true;
  const saved = uni.getStorageSync(KEY_MAINTENANCE_RECORDS) as MaintenanceRecord[] | undefined;
  if (!Array.isArray(saved)) {
    return;
  }

  maintenanceRecords.value = sortRecords(
    saved.map((record) => normalizeRecord(record)).filter((record) => record.categories.length)
  );
};

const getRecordById = (id: string) => {
  return maintenanceRecords.value.find((record) => record.id === id) || null;
};

const saveRecord = (input: MaintenanceRecordInput) => {
  const normalized = normalizeRecord({
    id: input.id,
    date: input.date,
    odometer: input.odometer,
    categories: input.categories,
    totalCost: input.totalCost,
    note: input.note ?? "",
  });

  if (!normalized.date || normalized.odometer <= 0 || !normalized.categories.length) {
    return { ok: false, updated: false as const };
  }

  const now = Date.now();
  if (input.id) {
    const recordIndex = maintenanceRecords.value.findIndex((record) => record.id === input.id);
    if (recordIndex >= 0) {
      const baseRecord = maintenanceRecords.value[recordIndex];
      maintenanceRecords.value.splice(recordIndex, 1, {
        ...normalized,
        id: baseRecord.id,
        createdAt: baseRecord.createdAt,
        updatedAt: now,
      });
      maintenanceRecords.value = sortRecords(maintenanceRecords.value);
      persistRecords();
      return { ok: true, updated: true as const };
    }
  }

  maintenanceRecords.value = sortRecords([
    {
      ...normalized,
      id: normalized.id || createId(),
      createdAt: now,
      updatedAt: now,
    },
    ...maintenanceRecords.value,
  ]);
  persistRecords();
  return { ok: true, updated: false as const };
};

const removeRecord = (id: string) => {
  maintenanceRecords.value = maintenanceRecords.value.filter((record) => record.id !== id);
  persistRecords();
};

const clearRecords = () => {
  maintenanceRecords.value = [];
  uni.removeStorageSync(KEY_MAINTENANCE_RECORDS);
};

const maintenanceStats = computed(() => {
  const totalCost = roundTo(
    maintenanceRecords.value.reduce((sum, record) => sum + record.totalCost, 0),
    2
  );
  return {
    count: maintenanceRecords.value.length,
    totalCost,
  };
});

export const useMaintenanceStore = () => {
  ensureLoaded();

  return {
    maintenanceRecords,
    maintenanceStats,
    toNumber,
    roundTo,
    getRecordById,
    saveRecord,
    removeRecord,
    clearRecords,
  };
};
