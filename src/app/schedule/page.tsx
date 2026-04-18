"use client";

import { useState, useEffect, useMemo, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { CalendarDays, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  type ScheduleEvent,
  type ScheduleCategoryId,
  type AssigneeId,
  SCHEDULE_CATEGORIES,
  SCHEDULE_ASSIGNEES,
  ASSIGNEE_BUSY_DAY_THRESHOLD,
  isAssigneeBusyForAssignment,
  toYMD,
  sortEventsByDateTime,
  getCategoryById,
  getAssigneeName,
  getAssigneesSortedByAvailability,
} from "@/lib/schedule";
import { useScheduleEvents } from "@/contexts/schedule-events-context";
import { useCurrentUser } from "@/contexts/current-user-context";
import { AssigneeBadge, eventCardSurface } from "@/components/schedule-ui";
import { ScheduleTodayEventRow } from "@/components/schedule-today-event-row";

const weekDayLabels = ["日", "一", "二", "三", "四", "五", "六"];

function parseYMD(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function getWeekRange(anchor: Date): { start: Date; end: Date } {
  const day = anchor.getDay() || 7;
  const start = new Date(anchor);
  start.setDate(anchor.getDate() - day + 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function eventInWeek(ev: ScheduleEvent, anchor: Date): boolean {
  const ed = parseYMD(ev.date);
  const { start, end } = getWeekRange(anchor);
  return ed >= start && ed <= end;
}

function weekdayShort(ymd: string): string {
  const d = parseYMD(ymd);
  return `週${weekDayLabels[d.getDay()]}`;
}

/** 月份比對：與 anchor 同年同月 */
function eventInMonthFixed(ev: ScheduleEvent, anchor: Date): boolean {
  const [y, m] = ev.date.split("-").map(Number);
  return y === anchor.getFullYear() && m === anchor.getMonth() + 1;
}

const weekDays = ["一", "二", "三", "四", "五", "六", "日"];

/** 月曆列標（週日開頭，與常見行事曆一致） */
const CALENDAR_WEEK_HEADERS = ["日", "一", "二", "三", "四", "五", "六"];

/** 產生當月每一格：null 為補空白，Date 為當月某日 */
function buildMonthCalendarCells(anchor: Date): (Date | null)[] {
  const y = anchor.getFullYear();
  const m = anchor.getMonth();
  const first = new Date(y, m, 1);
  const lastDay = new Date(y, m + 1, 0).getDate();
  const padStart = first.getDay();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < padStart; i++) cells.push(null);
  for (let d = 1; d <= lastDay; d++) {
    cells.push(new Date(y, m, d));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function getWeekDates(anchor: Date, events: ScheduleEvent[]) {
  const now = anchor;
  const day = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - day + 1);

  return weekDays.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const ymd = toYMD(d);
    const count = events.filter((e) => e.date === ymd).length;
    return {
      label,
      date: d.getDate(),
      isToday: d.toDateString() === new Date().toDateString(),
      events: count,
    };
  });
}

/** 與負責人選單一致：非忙碌＝有空（綠）、達當日忙碌門檻＝沒空（紅） */
function DayAvailabilitySummaryCard(props: {
  availableNames: string[];
  busyNames: string[];
}) {
  const { availableNames, busyNames } = props;
  return (
    <div className="mb-3 rounded-lg border border-flat-gray-dark/15 bg-white/90 px-3 py-2.5 space-y-1.5 shadow-sm">
      <p className="text-xs leading-relaxed flex flex-wrap items-baseline gap-y-0.5">
        <span className="font-extrabold text-flat-dark shrink-0 mr-1">今天有空：</span>
        {availableNames.length > 0 ? (
          availableNames.map((name, i) => (
            <span key={`avail-${i}-${name}`} className="font-semibold">
              {i > 0 ? <span className="text-muted-foreground">、</span> : null}
              <span className="text-flat-emerald">{name}</span>
            </span>
          ))
        ) : (
          <span className="text-muted-foreground font-semibold">無</span>
        )}
      </p>
      <p className="text-xs leading-relaxed flex flex-wrap items-baseline gap-y-0.5">
        <span className="font-extrabold text-flat-dark shrink-0 mr-1">今天沒空：</span>
        {busyNames.length > 0 ? (
          busyNames.map((name, i) => (
            <span key={`busy-${i}-${name}`} className="font-semibold">
              {i > 0 ? <span className="text-muted-foreground">、</span> : null}
              <span className="text-flat-red">{name}</span>
            </span>
          ))
        ) : (
          <span className="text-muted-foreground font-semibold">無</span>
        )}
      </p>
    </div>
  );
}

function SchedulePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const prefillFromQueryDone = useRef(false);

  const [tab, setTab] = useState<"today" | "week" | "month">("today");
  const [mounted, setMounted] = useState(false);
  const { events, setEvents, toggleEventDone } = useScheduleEvents();
  const { assigneeManualByDate } = useCurrentUser();
  const [addOpen, setAddOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState(() => toYMD(new Date()));
  const [formTime, setFormTime] = useState("09:00");
  const [formCategory, setFormCategory] = useState<ScheduleCategoryId>("other");
  const [formAssigneeIds, setFormAssigneeIds] = useState<AssigneeId[]>(["jiaC"]);
  const [formImportant, setFormImportant] = useState(false);
  /** 本月分頁：月曆上選中的日期（null 時以下方列表預設顯示「今天」） */
  const [selectedMonthDayYmd, setSelectedMonthDayYmd] = useState<string | null>(null);
  const monthDayListAnchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (prefillFromQueryDone.current) return;
    const d = searchParams.get("scheduleDate");
    if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return;
    prefillFromQueryDone.current = true;
    const rawTitle = searchParams.get("scheduleTitle");
    const rawTime = searchParams.get("scheduleTime") || "09:00";
    const safeTime = /^\d{1,2}:\d{2}$/.test(rawTime)
      ? `${rawTime.split(":")[0]!.padStart(2, "0")}:${rawTime.split(":")[1]}`
      : "09:00";
    setFormDate(d);
    setFormTitle(rawTitle ? decodeURIComponent(rawTitle) : "");
    setFormTime(safeTime);
    setFormCategory("medical");
    setFormAssigneeIds(["jiaC"]);
    setFormImportant(true);
    setAddOpen(true);
    router.replace("/schedule", { scroll: false });
  }, [searchParams, router]);

  const now = new Date();
  const todayYmd = toYMD(now);

  const todayEvents = useMemo(() => {
    return events
      .filter((e) => e.date === todayYmd)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [events, todayYmd]);

  const weekImportant = useMemo(() => {
    const anchor = new Date();
    return events.filter((e) => eventInWeek(e, anchor)).sort(sortEventsByDateTime);
  }, [events]);

  const monthEvents = useMemo(() => {
    const anchor = new Date();
    return events.filter((e) => eventInMonthFixed(e, anchor)).sort(sortEventsByDateTime);
  }, [events]);

  const monthCalendarCells = useMemo(() => {
    const anchor = new Date(now.getFullYear(), now.getMonth(), 1);
    anchor.setHours(12, 0, 0, 0);
    return buildMonthCalendarCells(anchor);
  }, [now.getFullYear(), now.getMonth()]);

  const monthEventCountByYmd = useMemo(() => {
    const counts: Record<string, number> = {};
    monthEvents.forEach((e) => {
      counts[e.date] = (counts[e.date] ?? 0) + 1;
    });
    return counts;
  }, [monthEvents]);

  const activeMonthDayYmd = selectedMonthDayYmd ?? todayYmd;

  const selectedDayEvents = useMemo(() => {
    return events
      .filter((e) => e.date === activeMonthDayYmd)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [events, activeMonthDayYmd]);

  const peopleWithTasksOnSelectedDay = useMemo(() => {
    const ids = [...new Set(selectedDayEvents.map((e) => e.assigneeId))];
    return ids.map((id) => getAssigneeName(id));
  }, [selectedDayEvents]);

  const peopleFullyBusyOnSelectedDay = useMemo(() => {
    return SCHEDULE_ASSIGNEES.filter((a) =>
      isAssigneeBusyForAssignment(events, a.id, activeMonthDayYmd, assigneeManualByDate)
    ).map((a) => a.name);
  }, [events, activeMonthDayYmd, assigneeManualByDate]);

  const peopleAvailableToday = useMemo(
    () =>
      SCHEDULE_ASSIGNEES.filter(
        (a) => !isAssigneeBusyForAssignment(events, a.id, todayYmd, assigneeManualByDate)
      ).map((a) => a.name),
    [events, todayYmd, assigneeManualByDate]
  );

  const peopleBusyToday = useMemo(
    () =>
      SCHEDULE_ASSIGNEES.filter((a) =>
        isAssigneeBusyForAssignment(events, a.id, todayYmd, assigneeManualByDate)
      ).map((a) => a.name),
    [events, todayYmd, assigneeManualByDate]
  );

  const weekData = useMemo(() => getWeekDates(new Date(), events), [events]);

  const assigneeFormOptions = useMemo(
    () => getAssigneesSortedByAvailability(events, formDate, assigneeManualByDate),
    [events, formDate, assigneeManualByDate]
  );

  useEffect(() => {
    if (!addOpen) return;
    setFormAssigneeIds((prev) => {
      const busyIds = new Set(assigneeFormOptions.filter((o) => o.busy).map((o) => o.id));
      const filtered = prev.filter((id) => !busyIds.has(id));
      const next = filtered.length === 0 ? (["jiaC"] as AssigneeId[]) : filtered;
      if (next.length === prev.length && next.every((id, i) => id === prev[i])) return prev;
      return next;
    });
  }, [addOpen, assigneeFormOptions]);

  const tabs = [
    { id: "today" as const, label: "今日" },
    { id: "week" as const, label: "本週" },
    { id: "month" as const, label: "本月" },
  ];

  function handleMonthDaySelect(ymd: string) {
    setSelectedMonthDayYmd(ymd);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        monthDayListAnchorRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    });
  }

  function openAddDialog() {
    setFormTitle("");
    setFormDate(toYMD(new Date()));
    setFormTime("09:00");
    setFormCategory("other");
    setFormAssigneeIds(["jiaC"]);
    setFormImportant(false);
    setAddOpen(true);
  }

  function toggleFormAssignee(id: AssigneeId) {
    const row = assigneeFormOptions.find((o) => o.id === id);
    if (row?.busy) return;
    setFormAssigneeIds((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((x) => x !== id);
        if (next.length === 0) {
          const firstFree = assigneeFormOptions.find((o) => !o.busy)?.id ?? "jiaC";
          return [firstFree];
        }
        return next;
      }
      return [...prev, id];
    });
  }

  function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    const title = formTitle.trim();
    if (!title) return;
    const assigneesForSubmit: AssigneeId[] = [...new Set(formAssigneeIds)];
    if (assigneesForSubmit.length === 0) return;
    const base = {
      title,
      date: formDate,
      time: formTime,
      categoryId: formCategory,
      done: false as const,
      ...(formImportant ? { important: true as const } : {}),
    };
    const newEvents: ScheduleEvent[] = assigneesForSubmit.map((assigneeId) => ({
      ...base,
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `ev-${Date.now()}-${assigneeId}`,
      assigneeId,
    }));
    setEvents((prev) => [...prev, ...newEvents].sort(sortEventsByDateTime));
    setAddOpen(false);
  }

  const inputClass =
    "w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-flat-dark font-medium outline-none focus-visible:ring-2 focus-visible:ring-flat-emerald/40";

  return (
    <div className="max-w-lg mx-auto">
      <div className="relative bg-flat-emerald px-5 pt-6 pb-5 overflow-hidden">
        <div className="absolute top-[-30px] right-[-20px] w-36 h-36 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute bottom-2 left-5 w-12 h-12 rotate-45 bg-white/5 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <CalendarDays className="w-6 h-6" />
                行程表
              </h1>
              <p className="text-sm text-white/70 font-medium mt-0.5">
                {mounted ? now.toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric" }) : "\u00A0"}
              </p>
            </div>
            <button
              type="button"
              onClick={openAddDialog}
              className="h-12 px-4 rounded-lg bg-white text-flat-emerald font-bold flex items-center gap-1 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Plus className="w-5 h-5" />
              新增
            </button>
          </div>

          <div className="flex gap-2">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTab(t.id);
                  if (t.id === "month") setSelectedMonthDayYmd(null);
                }}
                className={`flex-1 py-2.5 rounded-lg text-base font-bold transition-all duration-200 ${
                  tab === t.id
                    ? "bg-white text-flat-emerald"
                    : "bg-white/15 text-white hover:bg-white/25"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 py-6">
        {tab === "today" && (
          <div className="space-y-2">
            <DayAvailabilitySummaryCard
              availableNames={peopleAvailableToday}
              busyNames={peopleBusyToday}
            />
            {todayEvents.map((ev) => (
              <ScheduleTodayEventRow key={ev.id} ev={ev} onToggle={toggleEventDone} />
            ))}
          </div>
        )}

        {tab === "week" && (
          <>
            <div className="grid grid-cols-7 gap-1 mb-5">
              {weekData.map((d) => (
                <button
                  key={d.label}
                  type="button"
                  className={`flex flex-col items-center py-3 rounded-lg transition-all duration-200 hover:scale-105 ${
                    d.isToday
                      ? "bg-flat-emerald text-white"
                      : "bg-flat-gray text-flat-dark hover:bg-flat-gray-dark"
                  }`}
                >
                  <span className="text-[11px] font-semibold opacity-70 uppercase">{d.label}</span>
                  <span className="text-lg font-extrabold mt-0.5">{d.date}</span>
                  <div className="flex gap-0.5 mt-1">
                    {Array.from({ length: Math.min(d.events, 3) }).map((_, j) => (
                      <span
                        key={j}
                        className={`w-1.5 h-1.5 rounded-full ${d.isToday ? "bg-white/60" : "bg-flat-emerald"}`}
                      />
                    ))}
                  </div>
                </button>
              ))}
            </div>

            <DayAvailabilitySummaryCard
              availableNames={peopleAvailableToday}
              busyNames={peopleBusyToday}
            />

            <p className="text-sm text-muted-foreground font-bold tracking-wider uppercase mb-3">本週行程</p>
            <div className="space-y-2">
              {weekImportant.length === 0 ? (
                <p className="text-sm text-muted-foreground font-medium py-4 text-center">本週尚無行程</p>
              ) : (
                weekImportant.map((ev) => (
                  <div
                    key={ev.id}
                    className={`flex items-center gap-3 rounded-lg px-4 py-3.5 transition-all duration-200 hover:scale-[1.02] cursor-pointer ${eventCardSurface(ev)}`}
                  >
                    <span className="text-sm font-extrabold text-flat-emerald w-10 shrink-0">
                      {weekdayShort(ev.date)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <span className="font-semibold text-flat-dark">{ev.title}</span>
                        {ev.important && (
                          <span className="inline-flex shrink-0 items-center rounded-md bg-amber-500 px-2 py-0.5 text-[10px] font-extrabold text-white shadow-sm">
                            重要
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="text-[11px] text-muted-foreground font-medium">
                          {getCategoryById(ev.categoryId).label}
                        </span>
                        <AssigneeBadge name={getAssigneeName(ev.assigneeId)} />
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground font-bold shrink-0">{ev.time}</span>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {tab === "month" && (
          <div>
            <div className="flex items-end justify-between gap-3 mb-4">
              <div>
                <p className="text-muted-foreground font-medium text-sm">
                  {mounted
                    ? now.toLocaleDateString("zh-TW", { year: "numeric", month: "long" })
                    : "\u00A0"}
                </p>
                <p className="text-2xl font-extrabold text-flat-dark mt-0.5">
                  本月 <span className="text-lg font-bold text-muted-foreground">{monthEvents.length} 筆</span>
                </p>
              </div>
            </div>

            {/* 月曆 */}
            <div className="rounded-xl border border-flat-gray-dark/20 bg-white p-3 shadow-sm">
              <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
                {CALENDAR_WEEK_HEADERS.map((h) => (
                  <div key={h} className="py-1.5 text-[11px] font-extrabold text-muted-foreground">
                    {h}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {monthCalendarCells.map((cell, idx) => {
                  if (!cell) {
                    return <div key={`empty-${idx}`} className="aspect-square min-h-[2.75rem]" />;
                  }
                  const ymd = toYMD(cell);
                  const isToday = ymd === todayYmd;
                  const isSelected = ymd === activeMonthDayYmd;
                  const count = monthEventCountByYmd[ymd] ?? 0;
                  return (
                    <button
                      key={ymd}
                      type="button"
                      onClick={() => handleMonthDaySelect(ymd)}
                      className={`aspect-square min-h-[2.75rem] rounded-lg flex flex-col items-center justify-center gap-0.5 text-sm font-extrabold transition-all duration-150 active:scale-95 ${
                        isSelected
                          ? "bg-flat-emerald text-white ring-2 ring-flat-emerald ring-offset-2 ring-offset-white"
                          : isToday
                            ? "bg-flat-emerald/15 text-flat-emerald-dark ring-1 ring-flat-emerald/40"
                            : "bg-flat-gray text-flat-dark hover:bg-flat-gray-dark"
                      }`}
                    >
                      <span>{cell.getDate()}</span>
                      {count > 0 && (
                        <span className="flex gap-0.5 justify-center" aria-hidden>
                          {Array.from({ length: Math.min(count, 3) }).map((_, j) => (
                            <span
                              key={j}
                              className={`w-1.5 h-1.5 rounded-full ${
                                isSelected ? "bg-white/90" : "bg-flat-emerald"
                              }`}
                            />
                          ))}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 選定日期的行程（月曆點選後捲動錨點） */}
            <div ref={monthDayListAnchorRef} className="mt-5 scroll-mt-6">
              <p className="text-sm font-extrabold text-flat-dark mb-2 flex items-center gap-2">
                <span className="text-muted-foreground font-semibold">選定日期</span>
                {mounted
                  ? parseYMD(activeMonthDayYmd).toLocaleDateString("zh-TW", {
                      month: "numeric",
                      day: "numeric",
                      weekday: "short",
                    })
                  : activeMonthDayYmd}
              </p>
              <div className="mb-3 rounded-lg border border-flat-gray-dark/15 bg-white/90 px-3 py-2.5 space-y-1.5 shadow-sm">
                <p className="text-xs leading-relaxed flex flex-wrap items-baseline gap-y-0.5">
                  <span className="font-extrabold text-flat-dark shrink-0 mr-1">有任務：</span>
                  {peopleWithTasksOnSelectedDay.length > 0 ? (
                    peopleWithTasksOnSelectedDay.map((name, i) => (
                      <span key={`task-${i}-${name}`} className="font-semibold">
                        {i > 0 ? <span className="text-muted-foreground">、</span> : null}
                        <span className="text-flat-emerald">{name}</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-muted-foreground font-semibold">無</span>
                  )}
                </p>
                <p className="text-xs leading-relaxed flex flex-wrap items-baseline gap-y-0.5">
                  <span className="font-extrabold text-flat-dark shrink-0 mr-1">整日沒空：</span>
                  {peopleFullyBusyOnSelectedDay.length > 0 ? (
                    peopleFullyBusyOnSelectedDay.map((name, i) => (
                      <span key={`busy-${i}-${name}`} className="font-semibold">
                        {i > 0 ? <span className="text-muted-foreground">、</span> : null}
                        <span className="text-flat-red">{name}</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-muted-foreground font-semibold">無</span>
                  )}
                </p>
              </div>
              <div className="space-y-2">
                {selectedDayEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground font-medium py-6 text-center rounded-lg bg-flat-gray">
                    這天尚無行程
                  </p>
                ) : (
                  selectedDayEvents.map((ev) => (
                    <ScheduleTodayEventRow key={ev.id} ev={ev} onToggle={toggleEventDone} compact />
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md gap-0">
          <form onSubmit={handleAddSubmit}>
            <DialogHeader className="pb-2">
              <DialogTitle className="text-flat-dark font-extrabold text-lg">新增行程</DialogTitle>
              <DialogDescription>填寫行程名稱、日期與時間，並選擇分類與負責人。</DialogDescription>
            </DialogHeader>

            <div className="space-y-3 max-h-[min(70vh,520px)] overflow-y-auto pb-2">
              <div>
                <label htmlFor="sched-title" className="text-xs font-bold text-muted-foreground block mb-1">
                  行程名稱
                </label>
                <input
                  id="sched-title"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="例如：回診、量血壓"
                  className={inputClass}
                  required
                  autoComplete="off"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="sched-date" className="text-xs font-bold text-muted-foreground block mb-1">
                    日期
                  </label>
                  <input
                    id="sched-date"
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="sched-time" className="text-xs font-bold text-muted-foreground block mb-1">
                    時間
                  </label>
                  <input
                    id="sched-time"
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="sched-cat" className="text-xs font-bold text-muted-foreground block mb-1">
                  分類
                </label>
                <select
                  id="sched-cat"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as ScheduleCategoryId)}
                  className={inputClass}
                >
                  {SCHEDULE_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <fieldset className="min-w-0 border-0 p-0 m-0">
                <legend className="flex items-center gap-2 mb-2 w-full border-0 p-0">
                  <span className="rounded-md bg-flat-emerald/25 px-1.5 py-0.5 text-[10px] font-extrabold tracking-wide text-flat-emerald-dark ring-1 ring-inset ring-flat-emerald/35">
                    負責人
                  </span>
                  <span className="text-xs font-semibold text-flat-dark">指定誰執行或提醒（可多選）</span>
                </legend>
                <div className="rounded-lg border border-border bg-background px-3 py-2.5 space-y-2">
                  {assigneeFormOptions.map((a) => {
                    const checked = formAssigneeIds.includes(a.id);
                    return (
                      <label
                        key={a.id}
                        className={`flex items-center gap-3 rounded-md px-2 py-2 transition-colors ${
                          a.busy
                            ? "cursor-not-allowed opacity-55"
                            : "cursor-pointer hover:bg-flat-gray/80"
                        }`}
                      >
                        <span
                          className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                            a.busy ? "bg-flat-red" : "bg-flat-emerald"
                          }`}
                          aria-hidden
                        />
                        <input
                          type="checkbox"
                          className="h-4 w-4 shrink-0 rounded border-flat-gray-dark accent-flat-emerald"
                          checked={checked}
                          disabled={a.busy}
                          onChange={() => toggleFormAssignee(a.id)}
                        />
                        <span className="flex-1 min-w-0 text-sm font-semibold text-flat-dark">{a.name}</span>
                        <span
                          className={`shrink-0 text-[11px] font-bold ${
                            a.busy ? "text-flat-red" : "text-flat-emerald-dark"
                          }`}
                        >
                          {a.busy ? "忙碌" : "有空"}
                        </span>
                      </label>
                    );
                  })}
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground leading-snug">
                  示範：綠點有空、紅點忙碌（當日已排滿 {ASSIGNEE_BUSY_DAY_THRESHOLD}{" "}
                  筆者不可選）；亦可至
                  <Link href="/user" className="mx-0.5 font-bold text-flat-blue underline-offset-2 hover:underline">
                    使用者資料
                  </Link>
                  為負責人標記各日有空／忙碌，並會反映於此。勾多位時會各建立一筆相同行程。
                </p>
              </fieldset>
              <label className="flex items-start gap-2.5 rounded-lg border border-amber-300/60 bg-amber-50/50 px-3 py-2.5 cursor-pointer has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-amber-400/50">
                <input
                  type="checkbox"
                  checked={formImportant}
                  onChange={(e) => setFormImportant(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-flat-gray-dark accent-amber-500"
                />
                <span>
                  <span className="text-sm font-bold text-flat-dark block">重要行程</span>
                  <span className="text-xs text-muted-foreground leading-snug">列表以琥珀色與「重要」標籤顯示（適合回診、領藥等）</span>
                </span>
              </label>
            </div>

            <div className="mt-3 flex flex-row justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                取消
              </Button>
              <Button type="submit" className="bg-flat-emerald text-white hover:bg-flat-emerald-dark">
                確認新增
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function SchedulePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-lg mx-auto min-h-[50vh] flex items-center justify-center text-muted-foreground font-semibold text-sm">
          載入行程…
        </div>
      }
    >
      <SchedulePageContent />
    </Suspense>
  );
}
