"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, History, PlusCircle, Pencil, User, ChevronDown } from "lucide-react";
import {
  ensureRecordEditLogSeeded,
  getRecordEditLog,
  withDisplayRevisions,
  type RecordEditLogEntry,
} from "@/lib/record-edit-log";

function formatLogDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("zh-TW", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function RecordEditHistoryPage() {
  const [entries, setEntries] = useState<RecordEditLogEntry[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    ensureRecordEditLogSeeded();
    setEntries(getRecordEditLog());
  }, []);

  const sorted = useMemo(() => {
    const ordered = [...entries].sort((a, b) => b.at.localeCompare(a.at));
    return withDisplayRevisions(ordered);
  }, [entries]);

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="max-w-lg mx-auto min-h-screen pb-24">
      <div className="relative bg-flat-dark px-5 pt-5 pb-6 overflow-hidden">
        <div className="absolute top-[-24px] right-[-20px] w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
        <div className="relative z-10">
          <Link
            href="/record"
            className="inline-flex items-center gap-1 text-white/80 text-sm font-semibold mb-4 active:scale-95 transition-transform hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
            返回紀錄
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center">
              <History className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white tracking-tight">編輯紀錄</h1>
              <p className="text-sm text-white/65 font-medium mt-0.5">誰在何時新增或修改了哪一筆</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 py-5 space-y-3">
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground font-medium text-center py-12 rounded-lg bg-flat-gray">
            尚無編輯紀錄
          </p>
        ) : (
          sorted.map((e) => {
            const revCount = e.revisions?.length ?? 0;
            const canExpand = e.action === "update" && revCount > 0;
            const isOpen = expandedIds.has(e.id);

            return (
              <div
                key={e.id}
                className="rounded-xl border border-flat-gray-dark/15 bg-flat-gray px-4 py-3.5 shadow-sm space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {e.action === "create" ? (
                      <span className="inline-flex items-center gap-1 shrink-0 rounded-md bg-flat-emerald/20 px-2 py-0.5 text-[11px] font-extrabold text-flat-emerald-dark ring-1 ring-inset ring-flat-emerald/35">
                        <PlusCircle className="w-3.5 h-3.5" aria-hidden />
                        新增
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 shrink-0 rounded-md bg-amber-500/15 px-2 py-0.5 text-[11px] font-extrabold text-amber-800 ring-1 ring-inset ring-amber-400/40">
                        <Pencil className="w-3.5 h-3.5" aria-hidden />
                        修改
                      </span>
                    )}
                    <span className="inline-flex min-w-0 items-center gap-1">
                      <User className="w-3.5 h-3.5 shrink-0 text-muted-foreground" aria-hidden />
                      <span className="text-sm font-extrabold text-flat-dark truncate">{e.editor}</span>
                    </span>
                  </div>
                  <time
                    dateTime={e.at}
                    className="shrink-0 text-xs font-semibold text-muted-foreground tabular-nums text-right max-w-[9.5rem]"
                  >
                    {formatLogDateTime(e.at)}
                  </time>
                </div>
                <p className="text-sm font-semibold text-flat-dark leading-snug">{e.recordSummary}</p>

                {canExpand && (
                  <div className="pt-0.5">
                    <button
                      type="button"
                      onClick={() => toggleExpanded(e.id)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between gap-2 rounded-lg py-2 pl-1 pr-1 text-left text-xs font-bold text-amber-900/90 transition-colors hover:bg-amber-500/10 active:bg-amber-500/15"
                    >
                      <span>
                        修改紀錄
                        <span className="ml-1 font-semibold text-muted-foreground">（{revCount} 次）</span>
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-amber-800/80 transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                        aria-hidden
                      />
                    </button>
                    {isOpen && (
                      <div className="mt-2 space-y-2 border-t border-flat-gray-dark/10 pt-2">
                        <p className="text-[11px] font-semibold text-muted-foreground px-0.5">
                          此前編輯（由舊到新）
                        </p>
                        <ul className="space-y-2">
                          {e.revisions!.map((r, idx) => (
                            <li
                              key={`${e.id}-rev-${idx}`}
                              className="rounded-lg border-l-2 border-amber-400/70 bg-white/60 pl-3 pr-2 py-2"
                            >
                              <div className="flex items-start justify-between gap-2 text-[11px]">
                                <span className="inline-flex min-w-0 items-center gap-1 font-bold text-flat-dark">
                                  <User className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden />
                                  <span className="truncate">{r.editor}</span>
                                </span>
                                <time
                                  dateTime={r.at}
                                  className="shrink-0 font-semibold text-muted-foreground tabular-nums"
                                >
                                  {formatLogDateTime(r.at)}
                                </time>
                              </div>
                              <p className="mt-1 text-xs font-medium leading-snug text-flat-dark">{r.summary}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
