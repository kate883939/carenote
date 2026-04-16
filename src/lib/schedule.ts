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
  { id: "unset", name: "未指定" },
] as const;

export type AssigneeId = (typeof SCHEDULE_ASSIGNEES)[number]["id"];

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
      assigneeId: "unset",
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
      assigneeId: "unset",
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
