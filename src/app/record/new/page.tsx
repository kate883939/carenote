"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Mic,
  MicOff,
  PenLine,
  Upload,
  Check,
  X,
  FileText,
  Loader2,
  CalendarPlus,
  Plus,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { parseFutureScheduleHint } from "@/lib/schedule-from-text";

type Step = "choose" | "input" | "processing" | "confirm";

type CategoryItem = { id: string; label: string };

const BASE_CATEGORIES: CategoryItem[] = [
  { id: "medication", label: "用藥" },
  { id: "diet", label: "飲食" },
  { id: "excretion", label: "排泄" },
  { id: "emotion", label: "情緒" },
  { id: "abnormal", label: "異常" },
  { id: "vitals", label: "生命徵象" },
  { id: "other", label: "其他" },
];

function RecordPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialMode = searchParams.get("mode") as "voice" | "text" | "upload" | null;
  const templateText = searchParams.get("template") || "";

  const [step, setStep] = useState<Step>(initialMode ? "input" : "choose");
  const [mode, setMode] = useState<"voice" | "text" | "upload">(initialMode || "voice");
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [textInput, setTextInput] = useState(templateText);
  const [transcribedText, setTranscribedText] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [aiSuggested, setAiSuggested] = useState<string[]>([]);
  const [customCategories, setCustomCategories] = useState<CategoryItem[]>([]);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const allCategories = useMemo(
    () => [...BASE_CATEGORIES, ...customCategories],
    [customCategories]
  );

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRecording) {
      timer = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  const handleChooseMode = (m: "voice" | "text" | "upload") => {
    setMode(m);
    setStep("input");
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setStep("processing");
    setTimeout(() => {
      setTranscribedText(
        "早上八點有吃降血壓藥一顆，飯後血糖藥一顆。吃完藥之後精神還不錯，有稍微散步十分鐘。早餐吃了半碗粥跟一顆蛋。"
      );
      setAiSuggested(["medication", "diet", "vitals"]);
      setSelectedCategories(["medication", "diet", "vitals"]);
      setStep("confirm");
    }, 2000);
  };

  const handleSubmitText = () => {
    if (!textInput.trim()) return;
    setTranscribedText(textInput);
    setAiSuggested(["medication", "diet"]);
    setSelectedCategories(["medication", "diet"]);
    setStep("confirm");
  };

  const handleUpload = () => {
    setStep("processing");
    setTimeout(() => {
      setTranscribedText(
        "處方箋內容：Amlodipine 5mg 每日一次、Metformin 500mg 每日兩次飯後服用。回診日期：2026/4/23。"
      );
      setAiSuggested(["medication"]);
      setSelectedCategories(["medication"]);
      setStep("confirm");
    }, 2500);
  };

  const toggleCategory = (catId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
    );
  };

  function addCustomCategory() {
    const label = newCategoryName.trim();
    if (!label) return;
    const lower = label.toLowerCase();
    const exists = [...BASE_CATEGORIES, ...customCategories].some(
      (c) => c.label.trim().toLowerCase() === lower
    );
    if (exists) return;
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? `custom-${crypto.randomUUID()}`
        : `custom-${Date.now()}`;
    setCustomCategories((prev) => [...prev, { id, label }]);
    setSelectedCategories((prev) => [...prev, id]);
    setNewCategoryName("");
    setAddCategoryOpen(false);
  }

  const handleSave = () => {
    router.push("/?saved=true");
  };

  const uploadScheduleHint = useMemo(
    () =>
      step === "confirm" && mode === "upload"
        ? parseFutureScheduleHint(transcribedText)
        : null,
    [step, mode, transcribedText]
  );

  const goAddScheduleFromUpload = () => {
    if (!uploadScheduleHint) return;
    const q = new URLSearchParams({
      scheduleDate: uploadScheduleHint.ymd,
      scheduleTitle: uploadScheduleHint.suggestedTitle,
      scheduleTime: "09:00",
    });
    router.push(`/schedule?${q.toString()}`);
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const modeColors = {
    voice: { bg: "bg-flat-blue", dark: "bg-flat-blue-dark", text: "text-flat-blue" },
    text: { bg: "bg-flat-amber", dark: "bg-flat-amber-dark", text: "text-flat-amber" },
    upload: { bg: "bg-flat-emerald", dark: "bg-flat-emerald-dark", text: "text-flat-emerald" },
  };

  return (
    <div className="max-w-lg mx-auto min-h-screen">
      {/* Top Bar — Color Block */}
      <div className={`px-5 pt-6 pb-5 ${step === "choose" ? "bg-flat-gray" : modeColors[mode].bg} relative overflow-hidden`}>
        {step !== "choose" && (
          <>
            <div className="absolute top-[-20px] right-[-20px] w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
            <div className="absolute bottom-[-10px] left-10 w-16 h-16 rotate-45 bg-white/5 pointer-events-none" />
          </>
        )}
        <div className="relative z-10">
          <h1 className={`text-2xl font-extrabold tracking-tight mb-2 ${step === "choose" ? "text-flat-dark" : "text-white"}`}>
            {step === "choose" && "選擇紀錄方式"}
            {step === "input" && (mode === "voice" ? "語音紀錄" : mode === "text" ? "文字紀錄" : "上傳檔案")}
            {step === "processing" && "辨識中..."}
            {step === "confirm" && "確認與分類"}
          </h1>

          {/* Step indicator */}
          {step !== "choose" && (() => {
            const steps = mode === "text"
              ? ["input", "confirm"]
              : ["input", "processing", "confirm"];
            const labels = mode === "text"
              ? ["紀錄", "分類"]
              : ["紀錄", "辨識", "分類"];
            const stepIndex = steps.indexOf(step);
            return (
              <div className="flex items-center gap-1 mt-3">
                {steps.map((s, i) => {
                  const isDone = i < stepIndex;
                  const isCurrent = s === step;
                  return (
                    <div key={s} className="flex items-center gap-1 flex-1">
                      <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                        isDone || isCurrent ? "bg-white" : "bg-white/20"
                      }`} />
                      <span className={`text-[11px] font-semibold tracking-wider ${
                        isCurrent ? "text-white" : "text-white/40"
                      }`}>
                        {labels[i]}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>

      <div className="px-5 py-6">
        {/* Step: Choose */}
        {step === "choose" && (
          <div className="space-y-3">
            <p className="text-muted-foreground mb-2 font-medium">先記下來，之後再分類也可以。</p>
            {[
              { mode: "voice" as const, icon: Mic, label: "語音紀錄", desc: "按一下就開始錄，說完自動辨識", bg: "bg-flat-blue", hoverBg: "hover:bg-flat-blue-dark" },
              { mode: "text" as const, icon: PenLine, label: "打字紀錄", desc: "直接輸入文字描述", bg: "bg-flat-amber", hoverBg: "hover:bg-flat-amber-dark" },
              { mode: "upload" as const, icon: Upload, label: "上傳檔案", desc: "拍照或上傳處方箋、紀錄單", bg: "bg-flat-emerald", hoverBg: "hover:bg-flat-emerald-dark" },
            ].map((item) => (
              <button
                key={item.mode}
                onClick={() => handleChooseMode(item.mode)}
                className={`group w-full flex items-center gap-4 p-5 rounded-lg ${item.bg} ${item.hoverBg} transition-all duration-200 hover:scale-[1.02]`}
              >
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110">
                  <item.icon className={`w-8 h-8 ${item.bg === "bg-flat-blue" ? "text-flat-blue" : item.bg === "bg-flat-amber" ? "text-flat-amber" : "text-flat-emerald"}`} />
                </div>
                <div className="text-left">
                  <p className="text-lg font-bold text-white">{item.label}</p>
                  <p className="text-sm text-white/70">{item.desc}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step: Input — Voice */}
        {step === "input" && mode === "voice" && (
          <div className="flex flex-col items-center justify-center gap-8 pt-8">
            <div className="text-5xl font-extrabold text-flat-dark tracking-wider font-mono">
              {formatTime(recordSeconds)}
            </div>

            {isRecording && (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-flat-red animate-pulse" />
                <span className="text-flat-red font-semibold">錄音中...</span>
              </div>
            )}

            <button
              onClick={() => {
                if (!isRecording) {
                  setIsRecording(true);
                  setRecordSeconds(0);
                } else {
                  handleStopRecording();
                }
              }}
              className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 hover:scale-105 ${
                isRecording
                  ? "bg-flat-red"
                  : "bg-flat-blue"
              }`}
            >
              {isRecording ? (
                <MicOff className="w-14 h-14 text-white" />
              ) : (
                <Mic className="w-14 h-14 text-white" />
              )}
            </button>

            <p className="text-muted-foreground text-center font-medium">
              {isRecording ? "再按一下停止錄音" : "按下開始錄音"}
            </p>
          </div>
        )}

        {/* Step: Input — Text */}
        {step === "input" && mode === "text" && (
          <div className="space-y-4">
            <p className="text-muted-foreground font-medium">請描述照護情況，完成後按送出。</p>
            <Textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="例如：早上有吃藥，精神不錯..."
              className="min-h-[200px] text-base leading-relaxed resize-none bg-flat-gray border-0 focus:border-2 focus:border-flat-amber focus:bg-white rounded-lg"
              autoFocus
            />
            <button
              onClick={handleSubmitText}
              disabled={!textInput.trim()}
              className="w-full h-14 rounded-lg text-lg font-bold bg-flat-amber hover:bg-flat-amber-dark text-white transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              送出紀錄
            </button>
          </div>
        )}

        {/* Step: Input — Upload */}
        {step === "input" && mode === "upload" && (
          <div className="space-y-4">
            <p className="text-muted-foreground font-medium">拍照或選擇檔案上傳，系統會自動辨識內容。</p>
            <button
              onClick={handleUpload}
              className="w-full bg-flat-emerald-light border-4 border-dashed border-flat-emerald rounded-lg py-16 flex flex-col items-center gap-3"
            >
              <div className="w-16 h-16 rounded-full bg-flat-emerald flex items-center justify-center">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <p className="font-bold text-flat-emerald text-lg">點擊上傳或拍照</p>
              <p className="text-sm text-flat-emerald/70">支援圖片、PDF</p>
            </button>
          </div>
        )}

        {/* Step: Processing */}
        {step === "processing" && (
          <div className="flex flex-col items-center justify-center gap-6 pt-16">
            <div className={`w-20 h-20 rounded-full ${modeColors[mode].bg} flex items-center justify-center animate-pulse`}>
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            </div>
            <p className="text-lg font-bold text-flat-dark">
              {mode === "voice" ? "語音辨識中..." : mode === "upload" ? "文件辨識中..." : "處理中..."}
            </p>
            <p className="text-sm text-muted-foreground">請稍候，通常只需幾秒鐘</p>
          </div>
        )}

        {/* Step: Confirm */}
        {step === "confirm" && (
          <div className="space-y-5">
            {/* Record Content */}
            <div className="bg-flat-gray rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-full ${modeColors[mode].bg} flex items-center justify-center`}>
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-flat-dark">
                  {mode === "text" ? "紀錄內容" : "辨識結果"}
                </span>
                <span className="ml-auto text-xs text-muted-foreground font-medium">
                  {mode === "voice" ? "語音" : mode === "upload" ? "檔案" : "文字"}
                </span>
              </div>
              <Textarea
                value={transcribedText}
                onChange={(e) => setTranscribedText(e.target.value)}
                className="min-h-[120px] text-base leading-relaxed border-0 bg-white focus:border-2 focus:border-flat-blue resize-none rounded-lg"
              />
              {mode !== "text" && (
                <p className="text-xs text-muted-foreground mt-2 font-medium">可直接編輯修改辨識內容</p>
              )}
            </div>

            {mode === "upload" && uploadScheduleHint && (
              <div className="rounded-xl border-2 border-flat-emerald/35 bg-gradient-to-b from-flat-emerald-light/90 to-flat-emerald-light/50 px-4 py-4 shadow-sm">
                <div className="flex items-start gap-2.5 mb-2">
                  <CalendarPlus className="w-5 h-5 shrink-0 text-flat-emerald-dark mt-0.5" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-flat-emerald-dark">偵測到未來日期 · 可加進行程表</p>
                    <p className="text-xs text-muted-foreground font-semibold mt-1">
                      {uploadScheduleHint.displayDate}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-flat-dark/85 mb-3 leading-relaxed">
                  辨識內容疑似包含待辦行程（例如回診、領藥），可先建立提醒以免忘記。
                </p>
                <button
                  type="button"
                  onClick={goAddScheduleFromUpload}
                  className="w-full h-12 rounded-lg text-sm font-extrabold bg-flat-emerald text-white shadow-sm transition-all duration-200 hover:bg-flat-emerald-dark active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  <CalendarPlus className="w-4 h-4 shrink-0" />
                  新增此行程
                </button>
              </div>
            )}

            {/* AI Classification */}
            <div className="bg-flat-gray rounded-lg p-5">
              <p className="font-bold text-flat-dark mb-1">這筆紀錄屬於？</p>
              <p className="text-xs text-muted-foreground mb-3">可多選，系統已自動建議</p>
              <div className="flex flex-wrap gap-2">
                {allCategories.map((cat) => {
                  const isSelected = selectedCategories.includes(cat.id);
                  const isSuggested = aiSuggested.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className={`px-4 py-2.5 rounded-md text-sm font-semibold transition-all duration-200 ${
                        isSelected
                          ? "bg-flat-blue text-white"
                          : "bg-white text-flat-dark"
                      }`}
                    >
                      {cat.label}
                      {isSuggested && (
                        <span className={`ml-1 text-xs ${isSelected ? "opacity-70" : "opacity-50"}`}>推薦</span>
                      )}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => {
                    setAddCategoryOpen((o) => !o);
                    setNewCategoryName("");
                  }}
                  className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md text-sm font-semibold transition-all duration-200 border-2 border-dashed ${
                    addCategoryOpen
                      ? "border-flat-blue bg-flat-blue-light text-flat-blue"
                      : "border-flat-blue/35 bg-white/90 text-flat-blue hover:bg-flat-blue-light/80"
                  }`}
                >
                  <Plus className="w-4 h-4 shrink-0" strokeWidth={2.5} aria-hidden />
                  新增
                </button>
              </div>
              {addCategoryOpen && (
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-stretch">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="輸入自訂分類名稱"
                    maxLength={20}
                    className="flex-1 min-h-10 rounded-lg border-2 border-border bg-white px-3 text-sm font-medium text-flat-dark outline-none focus-visible:border-flat-blue focus-visible:ring-2 focus-visible:ring-flat-blue/25"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustomCategory();
                      }
                    }}
                  />
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setAddCategoryOpen(false);
                        setNewCategoryName("");
                      }}
                      className="h-10 flex-1 sm:flex-none px-4 rounded-lg text-sm font-bold bg-white border-2 border-flat-gray-dark text-flat-dark hover:bg-flat-gray transition-colors"
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      onClick={addCustomCategory}
                      disabled={!newCategoryName.trim()}
                      className="h-10 flex-1 sm:flex-none px-4 rounded-lg text-sm font-bold bg-flat-blue text-white hover:bg-flat-blue-dark transition-colors disabled:pointer-events-none disabled:opacity-40"
                    >
                      加入
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pb-4">
              <button
                onClick={() => {
                  setStep("input");
                  setRecordSeconds(0);
                  setIsRecording(false);
                }}
                className="flex-1 h-14 rounded-lg text-base font-bold border-4 border-flat-gray-dark text-flat-dark bg-transparent hover:bg-flat-gray hover:text-flat-dark transition-all duration-200 hover:scale-105 flex items-center justify-center gap-1"
              >
                <X className="w-5 h-5" />
                重新紀錄
              </button>
              <button
                onClick={handleSave}
                className="flex-1 h-14 rounded-lg text-base font-bold bg-flat-blue hover:bg-flat-blue-dark text-white transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center gap-1"
              >
                <Check className="w-5 h-5" />
                儲存紀錄
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NewRecordPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="w-10 h-10 animate-spin text-flat-blue" /></div>}>
      <RecordPageContent />
    </Suspense>
  );
}
