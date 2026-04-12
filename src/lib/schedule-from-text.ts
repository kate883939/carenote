/**
 * 從辨識文字中找出「今天之後」的日期，供預填行程表。
 * 支援 2026/4/23、2026-04-23、2026年4月23日 等常見寫法。
 */
export function parseFutureScheduleHint(text: string): {
  ymd: string;
  displayDate: string;
  suggestedTitle: string;
} | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const candidates: Date[] = [];

  const reSlash = /(\d{4})\s*[\/年\-]\s*(\d{1,2})\s*[\/月\-]\s*(\d{1,2})/g;
  let m: RegExpExecArray | null;
  while ((m = reSlash.exec(trimmed)) !== null) {
    const dt = new Date(+m[1], +m[2] - 1, +m[3]);
    if (!isNaN(dt.getTime())) {
      dt.setHours(0, 0, 0, 0);
      if (dt > startOfToday) candidates.push(new Date(dt));
    }
  }

  const reISO = /(\d{4})-(\d{2})-(\d{2})/g;
  while ((m = reISO.exec(trimmed)) !== null) {
    const dt = new Date(+m[1], +m[2] - 1, +m[3]);
    if (!isNaN(dt.getTime())) {
      dt.setHours(0, 0, 0, 0);
      if (dt > startOfToday) candidates.push(new Date(dt));
    }
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => a.getTime() - b.getTime());
  const pick = candidates[0]!;

  const ymd = `${pick.getFullYear()}-${String(pick.getMonth() + 1).padStart(2, "0")}-${String(pick.getDate()).padStart(2, "0")}`;
  const displayDate = pick.toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  let suggestedTitle = "行程提醒";
  if (/回診|複診|門診|看診/.test(trimmed)) suggestedTitle = "回診";
  else if (/領藥|藥局/.test(trimmed)) suggestedTitle = "藥局領藥";
  else if (/追蹤/.test(trimmed)) suggestedTitle = "回診追蹤";

  return { ymd, displayDate, suggestedTitle };
}
