/** 身體報告圖表用示範序列（含 ISO 日期以利篩選） */

export interface BodyReportDateRange {
  start: string;
  end: string;
}

export interface BodyTrendRow {
  iso: string;
  /** 圖表橫軸短標籤，例如 4/10 */
  label: string;
  sys: number;
  dia: number;
  hr: number;
  temp: number;
  urine: number;
  stool: number;
}

/** 2026/3/28 — 2026/4/10 示範趨勢 */
export const BODY_REPORT_TREND_FULL: BodyTrendRow[] = [
  { iso: "2026-03-28", label: "3/28", sys: 146, dia: 90, hr: 76, temp: 36.5, urine: 4, stool: 1 },
  { iso: "2026-03-29", label: "3/29", sys: 144, dia: 88, hr: 75, temp: 36.4, urine: 5, stool: 0 },
  { iso: "2026-03-30", label: "3/30", sys: 150, dia: 92, hr: 77, temp: 36.6, urine: 4, stool: 1 },
  { iso: "2026-03-31", label: "3/31", sys: 141, dia: 86, hr: 74, temp: 36.3, urine: 5, stool: 1 },
  { iso: "2026-04-01", label: "4/1", sys: 139, dia: 84, hr: 73, temp: 36.4, urine: 4, stool: 1 },
  { iso: "2026-04-02", label: "4/2", sys: 143, dia: 87, hr: 75, temp: 36.5, urine: 5, stool: 1 },
  { iso: "2026-04-03", label: "4/3", sys: 147, dia: 89, hr: 76, temp: 36.5, urine: 4, stool: 0 },
  { iso: "2026-04-04", label: "4/4", sys: 140, dia: 85, hr: 74, temp: 36.4, urine: 5, stool: 1 },
  { iso: "2026-04-05", label: "4/5", sys: 145, dia: 88, hr: 75, temp: 36.6, urine: 4, stool: 1 },
  { iso: "2026-04-06", label: "4/6", sys: 149, dia: 90, hr: 77, temp: 36.5, urine: 5, stool: 1 },
  { iso: "2026-04-07", label: "4/7", sys: 148, dia: 88, hr: 78, temp: 36.5, urine: 4, stool: 1 },
  { iso: "2026-04-08", label: "4/8", sys: 142, dia: 86, hr: 75, temp: 36.4, urine: 5, stool: 1 },
  { iso: "2026-04-09", label: "4/9", sys: 152, dia: 90, hr: 76, temp: 36.6, urine: 4, stool: 0 },
  { iso: "2026-04-10", label: "4/10", sys: 138, dia: 82, hr: 72, temp: 36.4, urine: 5, stool: 1 },
];

export function filterTrendByDateRange(
  rows: BodyTrendRow[],
  startIso: string,
  endIso: string
): BodyTrendRow[] {
  return rows.filter((r) => r.iso >= startIso && r.iso <= endIso);
}

export function formatRangeLabel(startIso: string, endIso: string): string {
  const short = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return `${y}/${m}/${d}`;
  };
  return `${short(startIso)} — ${short(endIso)}`;
}
