"use client";

import type { ScheduleEvent } from "@/lib/schedule";

export function AssigneeBadge({ name, compact }: { name: string; compact?: boolean }) {
  return (
    <span
      className={`inline-flex max-w-full min-w-0 items-center rounded-lg border border-flat-emerald/45 bg-flat-emerald-light shadow-sm ${
        compact ? "gap-1 px-1.5 py-0.5" : "gap-1.5 px-2 py-1"
      }`}
      title={`負責人：${name}`}
    >
      <span
        className={`shrink-0 rounded-md bg-flat-emerald/30 font-extrabold tracking-wide text-flat-emerald-dark ${
          compact ? "px-1 py-0.5 text-[9px]" : "px-1.5 py-0.5 text-[10px]"
        }`}
      >
        負責人
      </span>
      <span
        className={`min-w-0 truncate font-extrabold text-flat-dark ${
          compact ? "text-[10px]" : "text-xs"
        }`}
      >
        {name}
      </span>
    </span>
  );
}

/** 一般 / 重要 行程卡片底色與邊框 */
export function eventCardSurface(ev: ScheduleEvent): string {
  if (!ev.important) return "bg-flat-gray";
  if (ev.done) return "bg-amber-50/80 border-l-4 border-amber-500";
  return "border-2 border-amber-400/85 bg-gradient-to-br from-amber-50 via-white to-amber-50/50 shadow-md shadow-amber-900/10 ring-1 ring-amber-200/60";
}
