import type { LucideIcon } from "lucide-react";
import {
  Clock,
  Pill,
  Stethoscope,
  Dumbbell,
  UtensilsCrossed,
  HeartHandshake,
} from "lucide-react";

export type ScheduleCategoryId =
  | "medication"
  | "medical"
  | "rehab"
  | "meal"
  | "care"
  | "other";

export interface ScheduleCategoryDef {
  id: ScheduleCategoryId;
  label: string;
  icon: LucideIcon;
}

export const SCHEDULE_CATEGORIES: ScheduleCategoryDef[] = [
  { id: "medication", label: "用藥", icon: Pill },
  { id: "medical", label: "回診／醫療", icon: Stethoscope },
  { id: "rehab", label: "復健運動", icon: Dumbbell },
  { id: "meal", label: "飲食", icon: UtensilsCrossed },
  { id: "care", label: "居服／照護", icon: HeartHandshake },
  { id: "other", label: "其他", icon: Clock },
];

export const SCHEDULE_ASSIGNEES = [
  { id: "mei", name: "家屬A" },
  { id: "wei", name: "家屬B" },
  { id: "aide", name: "照護人員A" },
  { id: "jiaC", name: "家屬C" },
] as const;

export type AssigneeId = (typeof SCHEDULE_ASSIGNEES)[number]["id"];

/** 使用者在「我的資料」為某日手動標記：有空可覆蓋行程筆數門檻、忙碌則一律視為不可指派 */
export type ManualDayMark = "free" | "busy";
export type AssigneeManualDayMap = Partial<Record<AssigneeId, Record<string, ManualDayMark>>>;

export interface ScheduleEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  categoryId: ScheduleCategoryId;
  assigneeId: AssigneeId;
  done: boolean;
  /** 重要行程（回診等），列表以醒目樣式顯示 */
  important?: boolean;
}

export function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(date: Date, days: number): Date {
  const x = new Date(date);
  x.setDate(x.getDate() + days);
  return x;
}

export function getCategoryById(id: ScheduleCategoryId): ScheduleCategoryDef {
  return SCHEDULE_CATEGORIES.find((c) => c.id === id) ?? SCHEDULE_CATEGORIES[SCHEDULE_CATEGORIES.length - 1];
}

export function getAssigneeName(id: string): string {
  return SCHEDULE_ASSIGNEES.find((a) => a.id === id)?.name ?? id;
}

/** 同一天該負責人已排幾筆 */
export function countAssigneeEventsOnDate(
  events: ScheduleEvent[],
  assigneeId: AssigneeId,
  ymd: string
): number {
  return events.filter((e) => e.date === ymd && e.assigneeId === assigneeId).length;
}

/**
 * 示範：當日已達此筆數視為「忙碌」，選單中不可再指定（prototype 用）
 * 實作產品時可改為行事曆同步、工時上限或手動標記。
 */
export const ASSIGNEE_BUSY_DAY_THRESHOLD = 3;

export function isAssigneeBusyOnDate(
  events: ScheduleEvent[],
  assigneeId: AssigneeId,
  ymd: string
): boolean {
  return countAssigneeEventsOnDate(events, assigneeId, ymd) >= ASSIGNEE_BUSY_DAY_THRESHOLD;
}

/** 納入手動標記後，是否視為「忙碌／不可再指派」 */
export function isAssigneeBusyForAssignment(
  events: ScheduleEvent[],
  assigneeId: AssigneeId,
  ymd: string,
  manual?: AssigneeManualDayMap | null
): boolean {
  const m = manual?.[assigneeId]?.[ymd];
  if (m === "free") return false;
  if (m === "busy") return true;
  return isAssigneeBusyOnDate(events, assigneeId, ymd);
}

export type AssigneeOptionRow = {
  id: AssigneeId;
  name: string;
  busy: boolean;
};

/** 負責人選單：有空在前、忙碌在後；同組內維持原表單順序 */
export function getAssigneesSortedByAvailability(
  events: ScheduleEvent[],
  ymd: string,
  manual?: AssigneeManualDayMap | null
): AssigneeOptionRow[] {
  const order = new Map(SCHEDULE_ASSIGNEES.map((a, i) => [a.id, i] as const));
  const rows: AssigneeOptionRow[] = SCHEDULE_ASSIGNEES.map((a) => ({
    id: a.id,
    name: a.name,
    busy: isAssigneeBusyForAssignment(events, a.id, ymd, manual),
  }));
  rows.sort((a, b) => {
    if (a.busy !== b.busy) return a.busy ? 1 : -1;
    return (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0);
  });
  return rows;
}

/** 建立首次載入的示範行程（日期為當天） */
export function createDefaultScheduleEvents(today: Date): ScheduleEvent[] {
  const d = toYMD(today);
  return [
    {
      id: "seed-1",
      date: d,
      time: "07:30",
      title: "量血壓",
      categoryId: "medical",
      assigneeId: "mei",
      done: true,
    },
    {
      id: "seed-2",
      date: d,
      time: "08:00",
      title: "早餐 + 餐後用藥",
      categoryId: "medication",
      assigneeId: "mei",
      done: true,
    },
    {
      id: "seed-3",
      date: d,
      time: "09:30",
      title: "居服員到府（擦澡）",
      categoryId: "care",
      assigneeId: "aide",
      done: true,
    },
    {
      id: "seed-4",
      date: d,
      time: "10:30",
      title: "復健運動 30 分鐘",
      categoryId: "rehab",
      assigneeId: "wei",
      done: false,
    },
    {
      id: "seed-5",
      date: d,
      time: "12:00",
      title: "午餐",
      categoryId: "meal",
      assigneeId: "jiaC",
      done: false,
    },
    {
      id: "seed-6",
      date: d,
      time: "14:00",
      title: "回診 — 台大神經內科",
      categoryId: "medical",
      assigneeId: "mei",
      done: false,
      important: true,
    },
    {
      id: "seed-7",
      date: d,
      time: "17:00",
      title: "量血壓 + 量血糖",
      categoryId: "medical",
      assigneeId: "wei",
      done: false,
    },
    {
      id: "seed-8",
      date: d,
      time: "18:00",
      title: "晚餐 + 餐後用藥",
      categoryId: "medication",
      assigneeId: "mei",
      done: false,
    },
    {
      id: "seed-9",
      date: d,
      time: "21:00",
      title: "睡前用藥",
      categoryId: "medication",
      assigneeId: "jiaC",
      done: false,
    },
    {
      id: "seed-w1",
      date: toYMD(addDays(today, 3)),
      time: "10:00",
      title: "居服員到府（陪同外出）",
      categoryId: "care",
      assigneeId: "aide",
      done: false,
    },
    {
      id: "seed-w2",
      date: toYMD(addDays(today, 5)),
      time: "09:00",
      title: "藥局領藥",
      categoryId: "medication",
      assigneeId: "wei",
      done: false,
    },
  ];
}

export function sortEventsByDateTime(a: ScheduleEvent, b: ScheduleEvent): number {
  if (a.date !== b.date) return a.date.localeCompare(b.date);
  return a.time.localeCompare(b.time);
}
