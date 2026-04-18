"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, UserRound } from "lucide-react";
import { useCurrentUser } from "@/contexts/current-user-context";
import { SCHEDULE_ASSIGNEES, toYMD, type AssigneeId } from "@/lib/schedule";

const WEEK_HEADERS = ["日", "一", "二", "三", "四", "五", "六"];

function buildMonthCells(anchor: Date): (Date | null)[] {
  const y = anchor.getFullYear();
  const m = anchor.getMonth();
  const first = new Date(y, m, 1);
  const lastDay = new Date(y, m + 1, 0).getDate();
  const padStart = first.getDay();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < padStart; i++) cells.push(null);
  for (let d = 1; d <= lastDay; d++) cells.push(new Date(y, m, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function addMonths(d: Date, n: number): Date {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}

export default function UserProfilePage() {
  const {
    displayName,
    setDisplayName,
    linkedAssigneeId,
    setLinkedAssigneeId,
    assigneeManualByDate,
    cycleAssigneeDayMark,
  } = useCurrentUser();

  const [monthAnchor, setMonthAnchor] = useState(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), 1);
  });

  const todayYmd = toYMD(new Date());
  const cells = useMemo(() => buildMonthCells(monthAnchor), [monthAnchor]);
  const monthTitle = useMemo(
    () =>
      monthAnchor.toLocaleDateString("zh-TW", {
        year: "numeric",
        month: "long",
      }),
    [monthAnchor]
  );

  const myMarks = assigneeManualByDate[linkedAssigneeId] ?? {};

  return (
    <div className="max-w-lg mx-auto min-h-screen pb-24">
      <div className="relative bg-flat-blue px-5 pt-5 pb-8 overflow-hidden">
        <div className="absolute top-[-36px] right-[-24px] w-36 h-36 rounded-full bg-white/5 pointer-events-none" />
        <div className="relative z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-white/85 text-sm font-semibold mb-4 active:scale-95 transition-transform hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
            返回首頁
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shrink-0">
              <UserRound className="w-8 h-8 text-flat-blue" aria-hidden />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-extrabold text-white tracking-tight">使用者資料</h1>
              <p className="text-sm text-white font-semibold mt-0.5 truncate">{displayName}</p>
              <p className="text-xs text-white/70 font-medium mt-0.5">基本資料與可出席狀態（影響行程指派）</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 space-y-5">
        <section className="rounded-xl border border-flat-gray-dark/15 bg-flat-gray p-5 space-y-4">
          <h2 className="text-sm font-extrabold text-flat-dark flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white">
              <UserRound className="w-4 h-4 text-flat-blue" aria-hidden />
            </span>
            基本資料
          </h2>
          <div>
            <label htmlFor="user-display-name" className="text-xs font-bold text-muted-foreground block mb-1">
              顯示名稱
            </label>
            <input
              id="user-display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={24}
              className="w-full h-11 rounded-lg border-2 border-border bg-white px-3 text-sm font-semibold text-flat-dark outline-none focus-visible:border-flat-blue focus-visible:ring-2 focus-visible:ring-flat-blue/25"
            />
          </div>
          {/* 對應行程負責人：先隱藏；要顯示時移除外層 hidden */}
          <div className="hidden" aria-hidden>
            <label htmlFor="user-linked-assignee" className="text-xs font-bold text-muted-foreground block mb-1">
              對應行程負責人（指派時顯示你的當日狀態）
            </label>
            <select
              id="user-linked-assignee"
              value={linkedAssigneeId}
              onChange={(e) => setLinkedAssigneeId(e.target.value as AssigneeId)}
              className="w-full h-11 rounded-lg border-2 border-border bg-white px-3 text-sm font-semibold text-flat-dark outline-none focus-visible:border-flat-blue focus-visible:ring-2 focus-visible:ring-flat-blue/25"
              tabIndex={-1}
            >
              {SCHEDULE_ASSIGNEES.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-[11px] text-muted-foreground leading-snug font-medium">
              下方月曆標記會寫在「{SCHEDULE_ASSIGNEES.find((x) => x.id === linkedAssigneeId)?.name ?? ""}
              」名下；新增行程選負責人時會依該日是否有空／忙碌一併顯示。
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-flat-gray-dark/15 bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-extrabold text-flat-dark flex items-center gap-2 min-w-0">
              <CalendarDays className="w-5 h-5 shrink-0 text-flat-blue" aria-hidden />
              <span className="truncate">有空／忙碌（月曆）</span>
            </h2>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                aria-label="上個月"
                onClick={() => setMonthAnchor((d) => addMonths(d, -1))}
                className="h-9 w-9 flex items-center justify-center rounded-lg bg-flat-gray text-flat-dark hover:bg-flat-gray-dark transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                aria-label="下個月"
                onClick={() => setMonthAnchor((d) => addMonths(d, 1))}
                className="h-9 w-9 flex items-center justify-center rounded-lg bg-flat-gray text-flat-dark hover:bg-flat-gray-dark transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground font-medium leading-relaxed">
            點日期循環：<span className="text-flat-dark font-semibold">未設定</span> →{" "}
            <span className="text-flat-emerald-dark font-semibold">有空</span> →{" "}
            <span className="text-flat-red font-semibold">忙碌</span> → 未設定。忙碌時行程表將無法再指派該日給你。
          </p>
          <p className="text-xs font-extrabold text-flat-dark">{monthTitle}</p>
          <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
            {WEEK_HEADERS.map((h) => (
              <div key={h} className="py-1 text-[11px] font-extrabold text-muted-foreground">
                {h}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell, idx) => {
              if (!cell) {
                return <div key={`e-${idx}`} className="aspect-square min-h-[2.5rem]" />;
              }
              const ymd = toYMD(cell);
              const mark = myMarks[ymd];
              const isToday = ymd === todayYmd;
              const base =
                mark === "free"
                  ? "bg-flat-emerald/20 text-flat-emerald-dark ring-2 ring-flat-emerald/50"
                  : mark === "busy"
                    ? "bg-flat-red/15 text-flat-red ring-2 ring-flat-red/45"
                    : "bg-flat-gray text-flat-dark ring-1 ring-flat-gray-dark/15";
              return (
                <button
                  key={ymd}
                  type="button"
                  title={
                    mark === "free"
                      ? "有空（點擊改為忙碌）"
                      : mark === "busy"
                        ? "忙碌（點擊清除）"
                        : "未設定（點擊為有空）"
                  }
                  onClick={() => cycleAssigneeDayMark(linkedAssigneeId, ymd)}
                  className={`aspect-square min-h-[2.5rem] rounded-lg text-sm font-extrabold transition-transform active:scale-95 ${base} ${
                    isToday ? "underline decoration-2 underline-offset-2" : ""
                  }`}
                >
                  {cell.getDate()}
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
