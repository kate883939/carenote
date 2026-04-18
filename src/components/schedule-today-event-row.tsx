"use client";

import { Check } from "lucide-react";
import type { ScheduleEvent } from "@/lib/schedule";
import { getCategoryById, getAssigneeName } from "@/lib/schedule";
import { AssigneeBadge, eventCardSurface } from "@/components/schedule-ui";

export function ScheduleTodayEventRow({
  ev,
  onToggle,
  compact = false,
}: {
  ev: ScheduleEvent;
  onToggle: (id: string) => void;
  /** 首頁等較窄區塊：字級與間距略小 */
  compact?: boolean;
}) {
  const cat = getCategoryById(ev.categoryId);
  const Icon = cat.icon;
  return (
    <button
      type="button"
      onClick={() => onToggle(ev.id)}
      className={`w-full text-left flex items-center rounded-lg transition-all duration-200 cursor-pointer ${
        compact ? "gap-3 px-3 py-2.5 hover:scale-[1.01]" : "gap-4 px-4 py-4 hover:scale-[1.02]"
      } ${eventCardSurface(ev)} ${ev.done ? "opacity-50" : ""}`}
    >
      <div
        className={`rounded-full flex items-center justify-center shrink-0 ${
          compact ? "w-9 h-9" : "w-10 h-10"
        } ${ev.done ? "bg-flat-emerald" : "bg-white border-2 border-flat-gray-dark"}`}
      >
        {ev.done ? (
          <Check className={compact ? "w-4 h-4 text-white" : "w-5 h-5 text-white"} />
        ) : (
          <Icon className={compact ? "w-4 h-4 text-muted-foreground" : "w-5 h-5 text-muted-foreground"} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
          <span
            className={`text-left font-semibold ${
              compact ? "text-sm" : ""
            } ${ev.done ? "line-through text-muted-foreground" : "text-flat-dark"}`}
          >
            {ev.title}
          </span>
          {ev.important && (
            <span
              className={`inline-flex shrink-0 items-center rounded-md bg-amber-500 font-extrabold text-white shadow-sm ${
                compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]"
              }`}
            >
              重要
            </span>
          )}
        </div>
        <div className={`flex flex-wrap items-center ${compact ? "mt-0.5 gap-1.5" : "mt-1 gap-2"}`}>
          <span
            className={`text-muted-foreground font-medium ${
              compact ? "text-[10px]" : "text-[11px]"
            }`}
          >
            {cat.label}
          </span>
          <AssigneeBadge name={getAssigneeName(ev.assigneeId)} compact={compact} />
        </div>
      </div>
      <span
        className={`text-muted-foreground font-bold shrink-0 ${
          compact ? "text-xs" : "text-sm"
        }`}
      >
        {ev.time}
      </span>
    </button>
  );
}
