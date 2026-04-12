"use client";

import { useRef, useState, useCallback, useMemo } from "react";
import { toPng } from "html-to-image";
import { X, Activity, Download, Loader2 } from "lucide-react";
import { useCareReceiver } from "@/contexts/care-receiver-context";
import {
  type BodyTrendRow,
  type BodyReportDateRange,
  BODY_REPORT_TREND_FULL,
  filterTrendByDateRange,
  formatRangeLabel,
} from "@/lib/body-report-trend";

function polylinePoints(
  values: number[],
  opts: { min: number; max: number; w: number; h: number; pad: { t: number; r: number; b: number; l: number } }
): string {
  const { min, max, w, h, pad } = opts;
  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;
  const n = values.length;
  return values
    .map((v, i) => {
      const x = pad.l + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
      const y = pad.t + ih - ((v - min) / (max - min || 1)) * ih;
      return `${x},${y}`;
    })
    .join(" ");
}

function MiniLineChart({
  title,
  unit,
  values,
  min,
  max,
  color,
  labels,
}: {
  title: string;
  unit: string;
  values: number[];
  min: number;
  max: number;
  color: string;
  labels: readonly string[];
}) {
  const w = 340;
  const h = 112;
  const pad = { t: 10, r: 10, b: 22, l: 36 };
  const pts = polylinePoints([...values], { min, max, w, h, pad });

  return (
    <div className="rounded-xl bg-white border border-flat-gray-dark/30 p-3 shadow-sm">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-sm font-extrabold text-flat-dark">{title}</span>
        <span className="text-xs font-semibold text-muted-foreground">{unit}</span>
      </div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} className="overflow-visible" aria-hidden>
        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={h - pad.b} stroke="#e5e7eb" strokeWidth={1} />
        <line x1={pad.l} y1={h - pad.b} x2={w - pad.r} y2={h - pad.b} stroke="#e5e7eb" strokeWidth={1} />
        <polyline fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" points={pts} />
        {values.map((v, i) => {
          const iw = w - pad.l - pad.r;
          const ih2 = h - pad.t - pad.b;
          const x = pad.l + (values.length <= 1 ? iw / 2 : (i / (values.length - 1)) * iw);
          const y = pad.t + ih2 - ((v - min) / (max - min || 1)) * ih2;
          return <circle key={i} cx={x} cy={y} r={4} fill={color} stroke="#fff" strokeWidth={1.5} />;
        })}
        {labels.map((lb, i) => {
          const iw = w - pad.l - pad.r;
          const x = pad.l + (labels.length <= 1 ? iw / 2 : (i / (labels.length - 1)) * iw);
          return (
            <text key={`${lb}-${i}`} x={x} y={h - 4} textAnchor="middle" className="fill-muted-foreground text-[10px] font-semibold">
              {lb}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function BpDualChart({ rows, labels }: { rows: BodyTrendRow[]; labels: readonly string[] }) {
  const w = 340;
  const h = 128;
  const pad = { t: 10, r: 12, b: 22, l: 38 };
  const sys = rows.map((d) => d.sys);
  const dia = rows.map((d) => d.dia);
  const minSys = 120;
  const maxSys = 160;
  const minDia = 70;
  const maxDia = 100;
  const sysPts = polylinePoints(sys, { min: minSys, max: maxSys, w, h, pad });
  const diaPts = polylinePoints(dia, { min: minDia, max: maxDia, w, h, pad });

  return (
    <div className="rounded-xl bg-white border border-flat-gray-dark/30 p-3 shadow-sm">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-sm font-extrabold text-flat-dark">血壓</span>
        <span className="text-xs font-semibold text-muted-foreground">mmHg</span>
      </div>
      <div className="flex gap-3 text-[10px] font-bold mb-1">
        <span className="flex items-center gap-1 text-flat-blue">
          <span className="inline-block w-3 h-0.5 bg-flat-blue rounded" /> 收縮壓
        </span>
        <span className="flex items-center gap-1 text-flat-emerald-dark">
          <span className="inline-block w-3 h-0.5 bg-flat-emerald rounded" /> 舒張壓
        </span>
      </div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} className="overflow-visible" aria-hidden>
        <polyline fill="none" stroke="#3B82F6" strokeWidth={2.5} strokeLinejoin="round" points={sysPts} />
        <polyline fill="none" stroke="#10B981" strokeWidth={2.5} strokeLinejoin="round" points={diaPts} />
        {rows.map((d, i) => {
          const iw = w - pad.l - pad.r;
          const ih2 = h - pad.t - pad.b;
          const x = pad.l + (rows.length <= 1 ? iw / 2 : (i / (rows.length - 1)) * iw);
          const yS = pad.t + ih2 - ((d.sys - minSys) / (maxSys - minSys)) * ih2;
          const yD = pad.t + ih2 - ((d.dia - minDia) / (maxDia - minDia)) * ih2;
          return (
            <g key={d.iso}>
              <circle cx={x} cy={yS} r={4} fill="#3B82F6" stroke="#fff" strokeWidth={1.5} />
              <circle cx={x} cy={yD} r={4} fill="#10B981" stroke="#fff" strokeWidth={1.5} />
            </g>
          );
        })}
        {labels.map((lb, i) => {
          const iw = w - pad.l - pad.r;
          const x = pad.l + (labels.length <= 1 ? iw / 2 : (i / (labels.length - 1)) * iw);
          return (
            <text key={`${lb}-${i}`} x={x} y={h - 4} textAnchor="middle" className="fill-muted-foreground text-[10px] font-semibold">
              {lb}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function ExcretionBars({ rows, labels }: { rows: BodyTrendRow[]; labels: readonly string[] }) {
  const w = 340;
  const h = 120;
  const pad = { t: 8, r: 8, b: 22, l: 8 };
  const maxVal = 6;
  const n = rows.length;
  const gap = 12;
  const chartW = w - pad.l - pad.r;
  const groupW = n > 0 ? (chartW - gap * (n - 1)) / n : chartW;

  return (
    <div className="rounded-xl bg-white border border-flat-gray-dark/30 p-3 shadow-sm">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-sm font-extrabold text-flat-dark">排泄（次／日）</span>
        <span className="text-xs font-semibold text-muted-foreground">小便／排便</span>
      </div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} aria-hidden>
        {rows.map((d, i) => {
          const gx = pad.l + i * (groupW + gap);
          const gc = gx + groupW / 2;
          const ih2 = h - pad.t - pad.b;
          const base = h - pad.b;
          const uH = (d.urine / maxVal) * ih2;
          const sH = (d.stool / maxVal) * ih2;
          const bw = groupW / 2 - 4;
          const uX = gc - bw - 2;
          const sX = gc + 2;
          return (
            <g key={d.iso}>
              <rect x={uX} y={base - uH} width={bw} height={uH} rx={3} fill="#60A5FA" />
              <rect x={sX} y={base - sH} width={bw} height={sH} rx={3} fill="#34D399" />
            </g>
          );
        })}
        {labels.map((lb, i) => {
          const gx = pad.l + i * (groupW + gap);
          const cx = gx + groupW / 2;
          return (
            <text key={`${lb}-${i}`} x={cx} y={h - 4} textAnchor="middle" className="fill-muted-foreground text-[10px] font-semibold">
              {lb}
            </text>
          );
        })}
      </svg>
      <div className="flex gap-4 text-[10px] font-bold text-muted-foreground mt-1">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#60A5FA]" /> 小便
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#34D399]" /> 排便
        </span>
      </div>
    </div>
  );
}

interface BodyReportModalProps {
  open: boolean;
  onClose: () => void;
  range: BodyReportDateRange | null;
}

export function BodyReportModal({ open, onClose, range }: BodyReportModalProps) {
  const { current } = useCareReceiver();
  const captureRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  const trend = useMemo(() => {
    if (!range) return [] as BodyTrendRow[];
    return filterTrendByDateRange(BODY_REPORT_TREND_FULL, range.start, range.end);
  }, [range]);

  const labels = useMemo(() => trend.map((d) => d.label), [trend]);

  const rangeTitle = range ? formatRangeLabel(range.start, range.end) : "";

  const runExport = useCallback(
    async (mode: "share" | "download") => {
      const el = captureRef.current;
      if (!el) return;
      setBusy(true);
      try {
        const dataUrl = await toPng(el, {
          pixelRatio: 2,
          backgroundColor: "#eef1f4",
          cacheBust: true,
        });
        const rangePart = range ? `${range.start}_${range.end}` : "report";
        const name = `身體徵象報告_${current.name}_${rangePart}.png`;
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], name, { type: "image/png" });

        if (mode === "share" && typeof navigator !== "undefined" && navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "身體徵象報告",
            text: `${current.name} 身體徵象與排泄趨勢（${rangeTitle}）`,
          });
        } else {
          const a = document.createElement("a");
          a.href = dataUrl;
          a.download = name;
          a.click();
        }
      } catch (e) {
        console.error(e);
      } finally {
        setBusy(false);
      }
    },
    [current.name, range, rangeTitle]
  );

  if (!open || !range) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 pt-[env(safe-area-inset-top,0px)] pb-0"
      onClick={onClose}
    >
      <div
        className="flex min-h-0 w-full max-w-lg max-h-[min(92dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)))] flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 px-5 pb-3 pt-5">
          <h2 className="text-lg font-extrabold text-flat-dark flex items-center gap-2 min-w-0">
            <Activity className="w-5 h-5 shrink-0 text-flat-emerald-dark" />
            <span className="truncate">身體徵象報告</span>
          </h2>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              disabled={busy || trend.length === 0}
              onClick={() => runExport("share")}
              title="分享"
              aria-label="分享"
              className="flex h-9 min-w-[3.25rem] items-center justify-center rounded-full bg-flat-emerald px-4 text-white shadow-sm transition-colors hover:bg-flat-emerald-dark active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45"
            >
              <span className="text-sm font-bold">分享</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-flat-gray hover:bg-flat-gray-dark transition-colors"
            >
              <X className="h-4 w-4 text-flat-dark" />
            </button>
          </div>
        </div>

        <p className="shrink-0 px-5 pb-2 text-sm text-muted-foreground -mt-1">
          以下為血壓、心律、體溫與排泄趨勢圖表，可預覽後匯出圖片分享給家人或醫事人員。
        </p>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4 [-webkit-overflow-scrolling:touch]">
          <div
            ref={captureRef}
            className="rounded-2xl p-4 space-y-3"
            style={{ background: "linear-gradient(180deg, #eef1f4 0%, #e4e9ef 100%)" }}
          >
            <div className="text-center pb-1 border-b border-flat-gray-dark/20">
              <p className="text-xs font-bold text-muted-foreground tracking-wide">身體徵象趨勢摘要</p>
              <p className="text-lg font-extrabold text-flat-dark mt-0.5">{current.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                區間：{rangeTitle}
                {trend.length > 0 ? ` · 共 ${trend.length} 日` : ""}
                {trend.length === 0 ? " · 此區間無示範資料" : " · 示範資料"}
              </p>
            </div>

            {trend.length === 0 ? (
              <div className="rounded-xl bg-white/80 p-6 text-center text-sm font-semibold text-muted-foreground">
                所選區間內沒有對應的示範紀錄。請調整日期範圍（建議涵蓋 2026/3/28～2026/4/10）後再試。
              </div>
            ) : (
              <>
                <BpDualChart rows={trend} labels={labels} />
                <MiniLineChart
                  title="心率"
                  unit="bpm"
                  values={trend.map((d) => d.hr)}
                  min={65}
                  max={85}
                  color="#8B5CF6"
                  labels={labels}
                />
                <MiniLineChart
                  title="體溫"
                  unit="°C"
                  values={trend.map((d) => d.temp)}
                  min={35.8}
                  max={37.2}
                  color="#F59E0B"
                  labels={labels}
                />
                <ExcretionBars rows={trend} labels={labels} />
              </>
            )}

            <p className="text-[10px] text-center text-muted-foreground leading-relaxed px-1">
              圖表僅供居家追蹤參考，異常時請諮詢醫師。實際產品可串接您勾選的照護紀錄自動繪製。
            </p>
          </div>
        </div>

        <div className="flex shrink-0 gap-3 border-t border-flat-gray bg-white px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] pt-2">
          <button
            type="button"
            disabled={busy || trend.length === 0}
            onClick={() => runExport("download")}
            className="flex-1 h-12 rounded-lg text-sm font-bold bg-flat-gray text-flat-dark active:bg-flat-gray-dark transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            下載圖片
          </button>
          <button
            type="button"
            disabled={busy || trend.length === 0}
            onClick={() => runExport("share")}
            className="flex-1 h-12 rounded-lg text-sm font-bold bg-flat-emerald text-white active:bg-flat-emerald-dark transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            <span>分享</span>
          </button>
        </div>
      </div>
    </div>
  );
}
