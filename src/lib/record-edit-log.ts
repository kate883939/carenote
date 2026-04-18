/**
 * 照護紀錄「編輯／建立」歷程（示範用 localStorage，與 record/page 示範資料 id 對齊）
 */

export type RecordEditAction = "create" | "update";

/** 單次修改明細（由舊到新；卡片標頭為最近一次） */
export interface RecordEditRevision {
  at: string;
  editor: string;
  summary: string;
}

export interface RecordEditLogEntry {
  id: string;
  /** ISO 8601 */
  at: string;
  editor: string;
  action: RecordEditAction;
  /** 對應紀錄列表中的 id */
  recordId: string;
  /** 辨識用標題／預覽（與列表 preview 一致為佳） */
  recordSummary: string;
  /** 僅「修改」：此前各次編輯（不含卡片上這筆最新狀態） */
  revisions?: RecordEditRevision[];
}

const STORAGE_KEY = "care-note-record-edit-log-v1";

function isValidRevision(x: unknown): x is RecordEditRevision {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.at === "string" &&
    typeof o.editor === "string" &&
    typeof o.summary === "string"
  );
}

function isValidEntry(x: unknown): x is RecordEditLogEntry {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  if (
    typeof o.id !== "string" ||
    typeof o.at !== "string" ||
    typeof o.editor !== "string" ||
    (o.action !== "create" && o.action !== "update") ||
    typeof o.recordId !== "string" ||
    typeof o.recordSummary !== "string"
  ) {
    return false;
  }
  if (o.revisions !== undefined) {
    if (!Array.isArray(o.revisions) || !o.revisions.every(isValidRevision)) return false;
  }
  return true;
}

const REVISIONS_15: RecordEditRevision[] = [
  {
    at: "2026-04-18T18:30:00.000+08:00",
    editor: "家屬A",
    summary: "建立：晚間如廁一次，過程尚可。",
  },
  {
    at: "2026-04-18T20:05:00.000+08:00",
    editor: "家屬A",
    summary: "補充如廁後無不適、步態穩。",
  },
];

const REVISIONS_17: RecordEditRevision[] = [
  {
    at: "2026-04-18T13:10:00.000+08:00",
    editor: "家屬B",
    summary: "初稿：午後量血壓。",
  },
  {
    at: "2026-04-18T13:45:00.000+08:00",
    editor: "家屬A",
    summary: "補上心率、體溫數值。",
  },
];

const REVISIONS_2: RecordEditRevision[] = [
  {
    at: "2026-04-10T08:50:00.000+08:00",
    editor: "家屬A",
    summary: "建立：早餐後服降血壓藥。",
  },
];

const REVISIONS_4: RecordEditRevision[] = [
  {
    at: "2026-04-09T19:50:00.000+08:00",
    editor: "家屬B",
    summary: "建立：晚間短暫頭暈約 10 分鐘。",
  },
  {
    at: "2026-04-09T20:15:00.000+08:00",
    editor: "家屬B",
    summary: "補充：休息後已好轉。",
  },
];

/** 舊版 localStorage 無 revisions 時，依 log id 補示範明細（僅顯示用） */
const DEMO_REVISIONS_BY_LOG_ID: Partial<Record<string, RecordEditRevision[]>> = {
  "seed-1": REVISIONS_15,
  "seed-3": REVISIONS_17,
  "seed-6": REVISIONS_2,
  "seed-7": REVISIONS_4,
};

/** 顯示用：為缺少 revisions 的「修改」示範筆數補上明細 */
export function withDisplayRevisions(entries: RecordEditLogEntry[]): RecordEditLogEntry[] {
  return entries.map((e) => {
    if (e.action !== "update") return e;
    if (e.revisions && e.revisions.length > 0) return e;
    const extra = DEMO_REVISIONS_BY_LOG_ID[e.id];
    return extra ? { ...e, revisions: extra } : e;
  });
}

/** 首次無資料時寫入，預覽文字請與 src/app/record/page.tsx mockRecords 對齊 */
const DEFAULT_SEED: RecordEditLogEntry[] = [
  {
    id: "seed-1",
    at: "2026-04-18T21:18:00.000+08:00",
    editor: "家屬B",
    action: "update",
    recordId: "15",
    recordSummary: "晚間如廁順利，無不適",
    revisions: REVISIONS_15,
  },
  {
    id: "seed-2",
    at: "2026-04-18T17:42:00.000+08:00",
    editor: "照護人員A",
    action: "create",
    recordId: "16",
    recordSummary: "晚餐 — 清淡為主，食量尚可",
  },
  {
    id: "seed-3",
    at: "2026-04-18T14:08:00.000+08:00",
    editor: "家屬A",
    action: "update",
    recordId: "17",
    recordSummary: "午後量血壓、心率、體溫",
    revisions: REVISIONS_17,
  },
  {
    id: "seed-4",
    at: "2026-04-18T10:35:00.000+08:00",
    editor: "家屬A",
    action: "create",
    recordId: "18",
    recordSummary: "上午心情平穩，願意簡短聊天",
  },
  {
    id: "seed-5",
    at: "2026-04-10T14:08:00.000+08:00",
    editor: "家屬A",
    action: "create",
    recordId: "1",
    recordSummary: "午餐照片 — 魚湯、地瓜葉、白飯",
  },
  {
    id: "seed-6",
    at: "2026-04-10T09:20:00.000+08:00",
    editor: "家屬B",
    action: "update",
    recordId: "2",
    recordSummary: "早餐後服用降血壓藥一顆，血糖藥一顆",
    revisions: REVISIONS_2,
  },
  {
    id: "seed-7",
    at: "2026-04-09T20:35:00.000+08:00",
    editor: "家屬A",
    action: "update",
    recordId: "4",
    recordSummary: "晚上有輕微頭暈，持續約 10 分鐘後好轉",
    revisions: REVISIONS_4,
  },
  {
    id: "seed-8",
    at: "2026-04-07T16:05:00.000+08:00",
    editor: "家屬B",
    action: "create",
    recordId: "12",
    recordSummary: "處方箋 — 神經內科回診用藥調整",
  },
];

export function getRecordEditLog(): RecordEditLogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidEntry);
  } catch {
    return [];
  }
}

export function setRecordEditLog(entries: RecordEditLogEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

/** 僅在尚未有任何紀錄時寫入示範歷程 */
export function ensureRecordEditLogSeeded() {
  if (typeof window === "undefined") return;
  if (getRecordEditLog().length > 0) return;
  setRecordEditLog([...DEFAULT_SEED]);
}

const MAX_ENTRIES = 200;

/** 新增一筆歷程（實際建立／修改紀錄成功後呼叫） */
export function appendRecordEditLog(
  entry: Omit<RecordEditLogEntry, "id"> & { id?: string }
): RecordEditLogEntry {
  const id =
    entry.id ??
    (typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `log-${Date.now()}`);
  const full: RecordEditLogEntry = {
    id,
    at: entry.at,
    editor: entry.editor,
    action: entry.action,
    recordId: entry.recordId,
    recordSummary: entry.recordSummary,
    ...(entry.revisions?.length ? { revisions: entry.revisions } : {}),
  };
  const next = [full, ...getRecordEditLog()].slice(0, MAX_ENTRIES);
  setRecordEditLog(next);
  return full;
}
