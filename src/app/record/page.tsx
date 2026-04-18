"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  ClockArrowUp,
  Search,
  FileText,
  Mic,
  Upload,
  Copy,
  Eye,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Sparkles,
  Loader2,
  Activity,
  User,
  Image as PhotoIcon,
} from "lucide-react";
import { BodyReportModal } from "@/components/body-report-modal";
import { BodyReportRangeModal } from "@/components/body-report-range-modal";
import type { BodyReportDateRange } from "@/lib/body-report-trend";

const SOURCE_ICONS: Record<string, typeof Mic> = {
  voice: Mic,
  text: FileText,
  upload: Upload,
};

interface HistoryRecord {
  id: string;
  date: string;
  time: string;
  category: string;
  tags: string[];
  source: "voice" | "text" | "upload";
  /** 誰建立這筆紀錄（家人／居服等） */
  recordedBy: string;
  preview: string;
  fullText: string;
  isAlert?: boolean;
  originalFile?: string;
  imageUrl?: string;
}

/** 示範資料無真實圖檔時，以圖片 icon 表示附件（勿用文件圖） */
const IMAGE_ATTACHMENT_PLACEHOLDER = "__image_attachment__";

function isImagePlaceholder(src: string) {
  return src === IMAGE_ATTACHMENT_PLACEHOLDER;
}

const CATEGORY_COLORS: Record<string, string> = {
  用藥: "bg-flat-blue",
  飲食: "bg-flat-amber",
  排泄: "bg-flat-emerald",
  情緒: "bg-[#8B5CF6]",
  異常: "bg-flat-red",
  生命徵象: "bg-flat-emerald",
  其他: "bg-gray-400",
};

const mockRecords: HistoryRecord[] = [
  // — 今天 4/10 —
  {
    id: "1", date: "今天 4/10", time: "14:05", category: "飲食", tags: [], source: "upload",
    recordedBy: "家屬A",
    preview: "午餐照片 — 魚湯、地瓜葉、白飯",
    fullText: "拍照記錄午餐：主食、蔬菜與湯品。示範情境中進食狀況穩定。",
    originalFile: "IMG_1023.jpg",
    imageUrl: IMAGE_ATTACHMENT_PLACEHOLDER,
  },
  {
    id: "2", date: "今天 4/10", time: "09:12", category: "用藥", tags: ["飲食"], source: "voice",
    recordedBy: "家屬B",
    preview: "早餐後服用降血壓藥一顆，血糖藥一顆",
    fullText: "早上按時服藥，服藥後精神穩定，並進行短時間活動與進食。",
    originalFile: "voice_20260410_0912.m4a",
  },
  {
    id: "3", date: "今天 4/10", time: "07:35", category: "生命徵象", tags: [], source: "text",
    recordedBy: "家屬A",
    preview: "血壓 138/82，心率 72，體溫 36.4",
    fullText: "早上量測生命徵象，數值於示範範圍內，持續追蹤。",
  },
  // — 昨天 4/9 —
  {
    id: "4", date: "昨天 4/9", time: "20:30", category: "異常", tags: ["情緒"], source: "voice", isAlert: true,
    recordedBy: "家屬A",
    preview: "晚上有輕微頭暈，持續約 10 分鐘後好轉",
    fullText: "晚間曾短暫不適，休息後改善。示範情境建議持續觀察並記錄異常。",
    originalFile: "voice_20260409_2030.m4a",
  },
  {
    id: "5", date: "昨天 4/9", time: "18:15", category: "情緒", tags: [], source: "text",
    recordedBy: "家屬B",
    preview: "傍晚情緒低落，不太想說話",
    fullText: "傍晚情緒較低落，透過陪伴與活動後逐步改善。",
  },
  {
    id: "6", date: "昨天 4/9", time: "12:15", category: "飲食", tags: [], source: "text",
    recordedBy: "家屬A",
    preview: "午餐吃了半碗稀飯、一碟青菜，食慾尚可",
    fullText: "午餐進食與補水狀況尚可，與前日相比有改善。",
  },
  {
    id: "7", date: "昨天 4/9", time: "12:20", category: "飲食", tags: [], source: "upload",
    recordedBy: "照護人員A",
    preview: "午餐照片 — 稀飯、青菜、蒸魚",
    fullText: "拍照記錄午餐內容，示範用於追蹤每日飲食變化。",
    originalFile: "IMG_8990.jpg",
    imageUrl: IMAGE_ATTACHMENT_PLACEHOLDER,
  },
  {
    id: "8", date: "昨天 4/9", time: "08:10", category: "用藥", tags: ["飲食"], source: "voice",
    recordedBy: "家屬B",
    preview: "早餐後服藥正常，降壓藥+血糖藥",
    fullText: "早餐後按時用藥，觀察時段內未見明顯異常。",
    originalFile: "voice_20260409_0810.m4a",
  },
  // — 4/8 —
  {
    id: "9", date: "4/8（二）", time: "21:00", category: "排泄", tags: [], source: "text",
    recordedBy: "家屬A",
    preview: "晚間排便正常，顏色和量都正常",
    fullText: "晚間排泄紀錄於示範範圍內，無明顯異常。",
  },
  {
    id: "10", date: "4/8（二）", time: "16:00", category: "其他", tags: [], source: "text",
    recordedBy: "照護人員A",
    preview: "下午做了 30 分鐘的手部復健運動",
    fullText: "下午完成復健活動，手部活動度與握力狀況持續追蹤。",
  },
  {
    id: "11", date: "4/8（二）", time: "09:00", category: "用藥", tags: [], source: "upload",
    recordedBy: "家屬A",
    preview: "藥袋拍照 — 確認藥物種類與劑量",
    fullText: "拍照記錄本週藥袋，示範用於核對藥物與服用規劃。",
    originalFile: "IMG_8975.jpg",
    imageUrl: IMAGE_ATTACHMENT_PLACEHOLDER,
  },
  // — 4/7 —
  {
    id: "12", date: "4/7（一）", time: "16:00", category: "用藥", tags: ["其他"], source: "upload",
    recordedBy: "家屬B",
    preview: "處方箋 — 神經內科回診用藥調整",
    fullText: "處方內容有調整，示範情境建議依醫囑持續追蹤。",
    originalFile: "prescription_20260407.jpg",
  },
  {
    id: "13", date: "4/7（一）", time: "10:30", category: "生命徵象", tags: [], source: "text",
    recordedBy: "家屬A",
    preview: "回診前量血壓 148/88，偏高",
    fullText: "回診前量測生命徵象，示範情境中已安排後續追蹤。",
  },
  {
    id: "14", date: "4/7（一）", time: "07:50", category: "飲食", tags: [], source: "voice",
    recordedBy: "家屬B",
    preview: "早餐吃了一碗燕麥粥，胃口還行",
    fullText: "早餐與飲品攝取狀況記錄於示範資料，供追蹤趨勢使用。",
    originalFile: "voice_20260407_0750.m4a",
  },
];

export default function RecordPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showSharePreview, setShowSharePreview] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showBodyReportRange, setShowBodyReportRange] = useState(false);
  const [bodyReportRange, setBodyReportRange] = useState<BodyReportDateRange | null>(null);

  const generateAiReport = useCallback((records: HistoryRecord[]) => {
    // Mock AI — 根據選取的紀錄產生摘要報告
    const categories = Array.from(new Set(records.map((r) => r.category)));
    const hasAlert = records.some((r) => r.isAlert);

    let report = `📋 照護紀錄摘要報告\n`;
    report += `期間：${records[records.length - 1]?.date} — ${records[0]?.date}\n`;
    report += `共 ${records.length} 筆紀錄，涵蓋：${categories.join("、")}\n\n`;

    // 重點摘要
    report += `【重點摘要】\n`;
    if (categories.includes("用藥")) {
      report += `• 用藥：降血壓藥與血糖藥皆按時服用，目前劑量穩定。\n`;
    }
    if (categories.includes("飲食")) {
      report += `• 飲食：食慾逐漸回升，以稀飯、青菜、蒸魚等清淡飲食為主。\n`;
    }
    if (categories.includes("生命徵象")) {
      report += `• 生命徵象：血壓 138/82 mmHg，心率 72 bpm，體溫 36.4°C，整體穩定。\n`;
    }
    if (hasAlert) {
      report += `\n【⚠️ 需注意】\n`;
      report += `• 昨日晚間出現輕微頭暈，約 10 分鐘後緩解，當時血壓偏高 152/90。建議持續觀察，如頻繁發生請回診諮詢。\n`;
    }

    report += `\n【建議事項】\n`;
    report += `• 持續監測血壓變化，特別留意晚間數值。\n`;
    report += `• 維持清淡飲食，鼓勵少量多餐。\n`;
    if (hasAlert) {
      report += `• 若頭暈再次發生，建議記錄發生時間與持續時長，提供醫師參考。\n`;
    }

    return report;
  }, []);

  useEffect(() => {
    if (showSharePreview && !aiReport) {
      setAiLoading(true);
      const timer = setTimeout(() => {
        setAiReport(generateAiReport(getSelectedRecords()));
        setAiLoading(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showSharePreview, aiReport, generateAiReport]);

  const handleOpenAiPreview = () => {
    setAiReport(null);
    setShowSharePreview(true);
  };

  const allCategories = Array.from(new Set(mockRecords.map((r) => r.category)));
  const categories = ["全部", ...allCategories];

  const filtered = mockRecords.filter((r) => {
    const matchCategory = !selectedCategory || selectedCategory === "全部" || r.category === selectedCategory;
    const matchSearch = !search || r.fullText.includes(search) || r.preview.includes(search);
    return matchCategory && matchSearch;
  });

  const groupByDate = (records: HistoryRecord[]) => {
    const groups: Record<string, HistoryRecord[]> = {};
    records.forEach((r) => {
      if (!groups[r.date]) groups[r.date] = [];
      groups[r.date].push(r);
    });
    return groups;
  };

  const grouped = groupByDate(filtered);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getSelectedRecords = () => mockRecords.filter((r) => selected.has(r.id));

  const compileShareText = () => {
    const records = getSelectedRecords();
    const header = `📋 照護紀錄摘要（共 ${records.length} 筆）`;
    const body = records
      .map((r) => `【${r.category}】${r.date} ${r.time}\n${r.fullText}`)
      .join("\n\n");
    return `${header}\n${"─".repeat(20)}\n\n${body}`;
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(compileShareText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyReport = () => {
    if (!aiReport) return;
    navigator.clipboard?.writeText(aiReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareReport = async () => {
    if (!aiReport) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: "照護紀錄摘要報告", text: aiReport });
      } catch {
        // user cancelled
      }
    } else {
      handleCopyReport();
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Header — Dark Block */}
      <div className="relative bg-flat-dark px-5 pt-6 pb-5 overflow-hidden">
        <div className="absolute top-[-20px] right-[-20px] w-28 h-28 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute bottom-3 left-[-10px] w-16 h-16 rotate-12 bg-white/3 pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between gap-2">
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2 min-w-0 shrink">
            <ClockArrowUp className="w-6 h-6 shrink-0" />
            照護紀錄
          </h1>
          {!isSelecting && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowBodyReportRange(true)}
                className="h-10 px-2.5 sm:px-3.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 bg-white text-flat-dark shadow-md shadow-black/20 ring-2 ring-white/40 hover:bg-white hover:brightness-[1.02] active:scale-[0.98] flex items-center gap-1.5"
              >
                <Activity className="w-4 h-4 shrink-0 text-flat-emerald" />
                身體報告
              </button>
              <button
                type="button"
                onClick={() => { setIsSelecting(true); setSelected(new Set()); }}
                className="h-10 px-2.5 sm:px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 bg-flat-blue text-white shadow-md shadow-black/25 ring-2 ring-white/35 hover:bg-flat-blue-dark active:scale-[0.98] whitespace-nowrap"
              >
                彙整分享
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 py-5">
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜尋紀錄內容..."
            className="w-full h-12 pl-11 pr-4 rounded-lg bg-flat-gray border-0 text-base focus:bg-white focus:border-2 focus:border-flat-blue focus:outline-none font-medium"
          />
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
          {categories.map((cat) => {
            const isActive = (cat === "全部" && !selectedCategory) || selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat === "全部" ? null : cat)}
                className={`px-3.5 py-2 rounded-md text-sm font-semibold whitespace-nowrap transition-colors duration-200 ${
                  isActive
                    ? "bg-flat-dark text-white"
                    : "bg-flat-gray text-flat-dark hover:bg-flat-gray-dark active:bg-flat-gray-dark"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Record List */}
        {Object.entries(grouped).map(([date, records]) => (
          <div key={date} className="mb-5">
            <p className="text-sm font-extrabold text-muted-foreground mb-2 tracking-wider uppercase">{date}</p>
            <div className="space-y-2">
              {records.map((r) => {
                const SourceIcon = SOURCE_ICONS[r.source];
                const isExpanded = expandedId === r.id;
                const catColor = CATEGORY_COLORS[r.category] || "bg-gray-400";

                return (
                  <div
                    key={r.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      if (isSelecting) toggleSelect(r.id);
                      else setExpandedId(isExpanded ? null : r.id);
                    }}
                    className={`rounded-lg p-4 cursor-pointer transition-colors duration-200 ${
                      selected.has(r.id) ? "bg-flat-blue-light ring-2 ring-flat-blue" : "bg-flat-gray active:bg-flat-gray-dark"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {isSelecting && (
                        <div className={`w-6 h-6 rounded-sm border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors duration-200 ${
                          selected.has(r.id) ? "bg-flat-blue border-flat-blue" : "border-flat-gray-dark bg-white"
                        }`}>
                          {selected.has(r.id) && <Check className="w-4 h-4 text-white" />}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className={`text-xs px-2.5 py-1 rounded-md font-bold text-white ${catColor}`}>
                            {r.category}
                          </span>
                          {r.tags.map((t) => (
                            <span key={t} className="text-xs px-2 py-0.5 rounded-md bg-flat-gray-dark text-muted-foreground font-medium">
                              {t}
                            </span>
                          ))}
                          <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1 font-semibold">
                            <SourceIcon className="w-3.5 h-3.5" />
                            {r.time}
                          </span>
                        </div>

                        {isExpanded && (
                          <div className="mt-2 flex items-center gap-2 rounded-lg border border-flat-blue/25 bg-flat-blue-light/60 px-3 py-2">
                            <User className="w-4 h-4 shrink-0 text-flat-blue" aria-hidden />
                            <span className="text-[11px] font-extrabold text-flat-blue">紀錄人</span>
                            <span className="text-sm font-bold text-flat-dark">{r.recordedBy}</span>
                          </div>
                        )}

                        {!isExpanded && r.imageUrl ? (
                          <div className="flex items-center gap-3 mt-1.5">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setPreviewImage(r.imageUrl!); }}
                              className="shrink-0 rounded-md border border-flat-gray-dark bg-flat-gray p-1.5 flex items-center justify-center group"
                            >
                              <div className="relative h-10 w-10 overflow-hidden rounded bg-white flex items-center justify-center">
                                {isImagePlaceholder(r.imageUrl) ? (
                                  <>
                                    <PhotoIcon className="w-6 h-6 text-flat-blue" aria-hidden />
                                    <div className="pointer-events-none absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center">
                                      <Eye className="w-3.5 h-3.5 text-flat-dark opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <Image
                                      src={r.imageUrl}
                                      alt={r.preview}
                                      fill
                                      className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                                      <Eye className="w-3.5 h-3.5 text-white opacity-0 group-hover:opacity-100 drop-shadow transition-opacity duration-200" />
                                    </div>
                                  </>
                                )}
                              </div>
                            </button>
                            <p className="text-sm leading-relaxed line-clamp-2 text-flat-dark">{r.fullText}</p>
                          </div>
                        ) : (
                          <p className={`text-sm leading-relaxed ${isExpanded ? "" : "line-clamp-2"} text-flat-dark`}>
                            {r.fullText}
                          </p>
                        )}

                        {isExpanded && r.imageUrl && (
                          <div className="mt-3">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setPreviewImage(r.imageUrl!); }}
                              className="relative w-full h-40 rounded-lg overflow-hidden group border border-flat-gray-dark bg-flat-gray"
                            >
                              {isImagePlaceholder(r.imageUrl) ? (
                                <>
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <PhotoIcon className="w-16 h-16 text-flat-blue shrink-0" aria-hidden />
                                  </div>
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/90 rounded-full p-2">
                                      <Eye className="w-5 h-5 text-flat-dark" />
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <Image
                                    src={r.imageUrl}
                                    alt={r.preview}
                                    fill
                                    className="object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/90 rounded-full p-2">
                                      <Eye className="w-5 h-5 text-flat-dark" />
                                    </div>
                                  </div>
                                </>
                              )}
                            </button>
                          </div>
                        )}

                        {isExpanded && r.originalFile && (
                          <div className="mt-3 pt-3 border-t-2 border-flat-gray-dark">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {r.imageUrl ? <PhotoIcon className="w-4 h-4" aria-hidden /> : <SourceIcon className="w-4 h-4" />}
                              <span className="font-medium">原始檔：{r.originalFile}</span>
                              {r.imageUrl ? (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setPreviewImage(r.imageUrl!); }}
                                  className="ml-auto text-flat-blue font-bold flex items-center gap-1 hover:underline"
                                >
                                  <Eye className="w-3.5 h-3.5" /> 檢視大圖
                                </button>
                              ) : (
                                <button className="ml-auto text-flat-blue font-bold flex items-center gap-1 hover:underline">
                                  <Eye className="w-3.5 h-3.5" /> 檢視
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {!isSelecting && (
                        <button className="shrink-0 mt-1">
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-flat-gray-dark mx-auto mb-3" />
            <p className="text-muted-foreground font-semibold">沒有找到符合條件的紀錄</p>
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <div className="relative w-full max-w-lg min-h-[12rem] rounded-lg overflow-hidden bg-white">
            {isImagePlaceholder(previewImage) ? (
              <div className="flex flex-col items-center justify-center gap-3 px-8 py-12">
                <PhotoIcon className="w-24 h-24 text-flat-blue/90 shrink-0" aria-hidden />
                <p className="text-sm font-medium text-muted-foreground text-center">
                  示範：照片預覽（無實際圖檔）
                </p>
              </div>
            ) : (
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src={previewImage}
                  alt="照片預覽"
                  fill
                  className="object-contain"
                />
              </div>
            )}
          </div>
        </div>
      )}

      <BodyReportRangeModal
        open={showBodyReportRange}
        onClose={() => setShowBodyReportRange(false)}
        onConfirm={(r) => {
          setBodyReportRange(r);
          setShowBodyReportRange(false);
        }}
      />
      <BodyReportModal
        open={bodyReportRange !== null}
        range={bodyReportRange}
        onClose={() => setBodyReportRange(null)}
      />

      {/* AI Report Preview Modal */}
      {showSharePreview && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center" onClick={() => setShowSharePreview(false)}>
          <div
            className="w-full max-w-lg bg-white rounded-t-2xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
              <h2 className="text-lg font-extrabold text-flat-dark flex items-center gap-2 min-w-0">
                <Sparkles className="w-5 h-5 shrink-0 text-flat-blue" />
                <span className="truncate">AI 整理報告</span>
              </h2>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  disabled={aiLoading || !aiReport}
                  onClick={() => void handleShareReport()}
                  title="分享"
                  aria-label="分享"
                  className="flex h-9 min-w-[3.25rem] items-center justify-center rounded-full bg-flat-blue px-4 text-white shadow-sm transition-colors hover:bg-flat-blue-dark active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45"
                >
                  <span className="text-sm font-bold">分享</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSharePreview(false)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-flat-gray hover:bg-flat-gray-dark transition-colors"
                >
                  <X className="w-4 h-4 text-flat-dark" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 pb-4">
              {aiLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className="w-16 h-16 rounded-full bg-flat-blue flex items-center justify-center animate-pulse">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-flat-dark">AI 正在整理紀錄...</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      分析 {getSelectedRecords().length} 筆紀錄，產生摘要報告
                    </p>
                  </div>
                  <Loader2 className="w-6 h-6 text-flat-blue animate-spin" />
                </div>
              ) : (
                <div className="bg-flat-gray rounded-lg p-4 text-sm">
                  <pre className="whitespace-pre-wrap font-sans text-flat-dark leading-relaxed">
                    {aiReport}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            {!aiLoading && aiReport && (
              <div className="px-5 pb-5 pt-2 flex gap-3 border-t border-flat-gray">
                <button
                  onClick={handleCopyReport}
                  className="flex-1 h-12 rounded-lg text-sm font-bold bg-flat-emerald text-white active:bg-flat-emerald-dark transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  {copied ? <><Check className="w-4 h-4" /> 已複製</> : <><Copy className="w-4 h-4" /> 複製文字</>}
                </button>
                <button
                  onClick={handleShareReport}
                  className="flex-1 h-12 rounded-lg text-sm font-bold bg-flat-blue text-white active:bg-flat-blue-dark transition-colors duration-200 flex items-center justify-center"
                >
                  分享
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Share Action Bar */}
      {isSelecting && (
        <div className="fixed bottom-20 left-0 right-0 px-4 z-40">
          <div className="max-w-lg mx-auto bg-flat-dark rounded-lg p-4 flex items-center gap-3">
            <span className="text-sm font-bold text-white">
              {selected.size > 0 ? `已選 ${selected.size} 筆` : "請選擇紀錄"}
            </span>
            <div className="flex-1" />
            <button
              onClick={() => { setIsSelecting(false); setSelected(new Set()); }}
              className="h-11 px-4 rounded-lg text-sm font-bold bg-white/15 text-white active:bg-white/35 transition-colors duration-200 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              取消
            </button>
            {selected.size > 0 && (
              <>
                <button
                  onClick={handleCopy}
                  className="h-11 px-4 rounded-lg text-sm font-bold bg-flat-emerald text-white active:bg-flat-emerald-dark transition-colors duration-200 flex items-center gap-1"
                >
                  {copied ? <><Check className="w-4 h-4" /> 已複製</> : <><Copy className="w-4 h-4" /> 複製文字</>}
                </button>
                <button
                  onClick={handleOpenAiPreview}
                  className="h-11 px-4 rounded-lg text-sm font-bold bg-flat-blue text-white active:bg-flat-blue-dark transition-colors duration-200 flex items-center gap-1"
                >
                  <Sparkles className="w-4 h-4" />
                  AI 摘要
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
