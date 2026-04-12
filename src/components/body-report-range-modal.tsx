"use client";

import { useState, useEffect } from "react";
import { X, CalendarRange } from "lucide-react";
import type { BodyReportDateRange } from "@/lib/body-report-trend";

export type { BodyReportDateRange };

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(iso: string, delta: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  return toIso(dt);
}

interface BodyReportRangeModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (range: BodyReportDateRange) => void;
}

export function BodyReportRangeModal({ open, onClose, onConfirm }: BodyReportRangeModalProps) {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const today = new Date();
    const endD = toIso(today);
    const startD = addDays(endD, -6);
    setStart(startD);
    setEnd(endD);
    setError(null);
  }, [open]);

  if (!open) return null;

  const applyPreset = (days: number) => {
    const endD = end || toIso(new Date());
    setEnd(endD);
    setStart(addDays(endD, -(days - 1)));
    setError(null);
  };

  const handleConfirm = () => {
    if (!start || !end) {
      setError("請選擇開始與結束日期");
      return;
    }
    if (start > end) {
      setError("開始日不可晚於結束日");
      return;
    }
    setError(null);
    onConfirm({ start, end });
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 pt-[env(safe-area-inset-top,0px)] pb-0"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-2xl bg-white shadow-xl pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-flat-gray px-5 py-4">
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-flat-dark">
            <CalendarRange className="h-5 w-5 text-flat-blue" />
            報告日期範圍
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-flat-gray hover:bg-flat-gray-dark transition-colors"
          >
            <X className="h-4 w-4 text-flat-dark" />
          </button>
        </div>

        <p className="px-5 pt-3 text-sm text-muted-foreground">
          選擇要產出圖表的身體徵象區間（依日匯總示範資料）。
        </p>

        <div className="space-y-4 px-5 py-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => applyPreset(7)}
              className="rounded-lg bg-flat-gray px-3 py-2 text-xs font-bold text-flat-dark active:bg-flat-gray-dark"
            >
              最近 7 天
            </button>
            <button
              type="button"
              onClick={() => applyPreset(14)}
              className="rounded-lg bg-flat-gray px-3 py-2 text-xs font-bold text-flat-dark active:bg-flat-gray-dark"
            >
              最近 14 天
            </button>
            <button
              type="button"
              onClick={() => {
                const t = new Date();
                const y = t.getFullYear();
                const m = t.getMonth();
                const first = new Date(y, m, 1);
                setStart(toIso(first));
                setEnd(toIso(t));
                setError(null);
              }}
              className="rounded-lg bg-flat-gray px-3 py-2 text-xs font-bold text-flat-dark active:bg-flat-gray-dark"
            >
              本月至今
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-muted-foreground">開始日</span>
              <input
                type="date"
                value={start}
                onChange={(e) => {
                  setStart(e.target.value);
                  setError(null);
                }}
                className="h-12 w-full rounded-lg border-0 bg-flat-gray px-3 text-base font-semibold text-flat-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-flat-blue"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-muted-foreground">結束日</span>
              <input
                type="date"
                value={end}
                onChange={(e) => {
                  setEnd(e.target.value);
                  setError(null);
                }}
                className="h-12 w-full rounded-lg border-0 bg-flat-gray px-3 text-base font-semibold text-flat-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-flat-blue"
              />
            </label>
          </div>

          {error && <p className="text-sm font-semibold text-flat-red">{error}</p>}
        </div>

        <div className="flex gap-3 px-5 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="h-12 flex-1 rounded-lg bg-flat-gray text-sm font-bold text-flat-dark active:bg-flat-gray-dark"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="h-12 flex-1 rounded-lg bg-flat-emerald text-sm font-bold text-white active:bg-flat-emerald-dark"
          >
            產生報告
          </button>
        </div>
      </div>
    </div>
  );
}
