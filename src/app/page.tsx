"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCareReceiver } from "@/contexts/care-receiver-context";
import {
  Mic,
  PenLine,
  Upload,
  CalendarDays,
  ClockArrowUp,
  ChevronRight,
  Pill,
  UtensilsCrossed,
  Heart,
  AlertTriangle,
  UserRound,
  CircleCheck,
  Sparkles,
} from "lucide-react";

const todaySchedule = [
  { time: "08:00", title: "早餐用藥", done: true },
  { time: "10:30", title: "復健運動", done: true },
  { time: "12:00", title: "午餐", done: false },
  { time: "14:00", title: "回診 — 神經內科", done: false },
  { time: "18:00", title: "晚餐用藥", done: false },
];

const recentRecords = [
  { time: "今天 09:12", category: "用藥", preview: "早餐後服用降血壓藥一顆，血糖藥一顆", color: "bg-flat-blue" },
  { time: "昨天 20:30", category: "異常", preview: "晚上有輕微頭暈，持續約 10 分鐘後好轉", color: "bg-flat-red" },
  { time: "昨天 12:15", category: "飲食", preview: "午餐吃了半碗稀飯、一碟青菜，食慾尚可", color: "bg-flat-amber" },
];

/** 近一週 AI 判讀示範（實際產品可改為後端／模型依紀錄計算） */
const weeklyAiInsights: {
  id: string;
  tone: "attention" | "caution" | "positive";
  title: string;
  detail: string;
}[] = [
  {
    id: "w1",
    tone: "attention",
    title: "喝水可能偏少",
    detail: "約 4 天水量描述偏少，建議固定時段補水並在紀錄標註杯數。",
  },
  {
    id: "w2",
    tone: "caution",
    title: "血壓連續 3 天偏高",
    detail: "收縮壓自 4/8 起連續 ≥140 mmHg，曾伴頭暈；請留意服藥與飲食鹹度，必要時回診。",
  },
];

function HomePageContent() {
  const [mounted, setMounted] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const searchParams = useSearchParams();
  const { current } = useCareReceiver();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (searchParams.get("saved") === "true") {
      setShowToast(true);
      window.history.replaceState(null, "", "/");
      const timer = setTimeout(() => setShowToast(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const now = new Date();
  const greeting = now.getHours() < 12 ? "早安" : now.getHours() < 18 ? "午安" : "晚安";

  return (
    <div className="max-w-lg mx-auto">
      {/* Hero Block — Blue */}
      <section className="relative bg-flat-blue px-5 pt-6 pb-8 overflow-hidden">
        {/* Decorative Shapes */}
        <div className="absolute top-[-40px] right-[-30px] w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute bottom-[-20px] left-[-20px] w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute top-10 right-10 w-16 h-16 rotate-45 bg-white/5 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white/70 text-sm font-medium tracking-wider">
                {mounted ? now.toLocaleDateString("zh-TW", { month: "long", day: "numeric", weekday: "long" }) : "\u00A0"}
              </p>
              <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
                {mounted ? `${greeting}` : "照護聯絡簿"}
              </h1>
            </div>
            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center">
              <UserRound className="w-7 h-7 text-flat-blue" />
            </div>
          </div>

          {/* Care Receiver */}
          <Link
            href="/profile"
            className="flex items-center gap-2 bg-white/15 rounded-lg px-4 py-3 active:scale-[0.98] transition-transform"
          >
            <span className="text-lg">{current.avatar}</span>
            <span className="font-semibold text-white">被照顧者：{current.name}</span>
            <ChevronRight className="w-4 h-4 text-white/60 ml-auto" />
          </Link>
        </div>
      </section>

      {/* Quick Record Block */}
      <section className="px-5 py-6">
        <h2 className="text-xl font-extrabold tracking-tight text-flat-dark mb-4">快速紀錄</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { href: "/record/new?mode=voice", icon: Mic, label: "語音", bg: "bg-flat-blue", hoverBg: "hover:bg-flat-blue-dark" },
            { href: "/record/new?mode=text", icon: PenLine, label: "打字", bg: "bg-flat-amber", hoverBg: "hover:bg-flat-amber-dark" },
            { href: "/record/new?mode=upload", icon: Upload, label: "上傳", bg: "bg-flat-emerald", hoverBg: "hover:bg-flat-emerald-dark" },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="group">
              <div className={`${item.bg} ${item.hoverBg} rounded-lg p-5 flex flex-col items-center gap-3 transition-all duration-200 group-hover:scale-105 cursor-pointer`}>
                <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                  <item.icon className={`w-7 h-7 ${item.bg === "bg-flat-blue" ? "text-flat-blue" : item.bg === "bg-flat-amber" ? "text-flat-amber" : "text-flat-emerald"}`} />
                </div>
                <span className="font-bold text-white text-base">{item.label}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Templates */}
        <p className="text-sm text-muted-foreground font-semibold mt-5 mb-2">常用模板</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "早餐用藥", icon: Pill, template: "早餐後服藥：" },
            { label: "量血壓", icon: Heart, template: "血壓：/ mmHg，心率：bpm" },
            { label: "記飲食", icon: UtensilsCrossed, template: "用餐內容：" },
            { label: "記異常", icon: AlertTriangle, template: "異常狀況：" },
          ].map((tpl) => (
            <Link
              key={tpl.label}
              href={`/record/new?mode=text&template=${encodeURIComponent(tpl.template)}`}
              className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold bg-flat-gray text-flat-dark active:scale-95 transition-all duration-200"
            >
              <tpl.icon className="w-4 h-4 shrink-0" />
              {tpl.label}
            </Link>
          ))}
        </div>

        {/* 近一週 AI 觀察（單一卡片） */}
        <div className="mt-6 border-t border-flat-gray-dark/15">
          <div className="rounded-xl bg-flat-blue-light border border-flat-blue/30 shadow-sm overflow-hidden ring-1 ring-flat-blue/15">
            <div className="flex items-center gap-2.5 px-4 py-3 bg-flat-blue/20 border-b border-flat-blue/25">
              <Sparkles className="w-5 h-5 text-flat-blue shrink-0" />
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold text-flat-dark">近一週 AI 觀察</h3>
                <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                  依紀錄自動摘要（示範），僅供參考，不替代醫療診斷。
                </p>
              </div>
            </div>
            <ul className="px-4 py-3 space-y-3 bg-white/85">
              {weeklyAiInsights.map((item) => {
                const dot =
                  item.tone === "positive"
                    ? "bg-flat-emerald"
                    : item.tone === "caution"
                      ? "bg-flat-red"
                      : "bg-amber-500";
                return (
                  <li key={item.id} className="flex gap-2.5">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot}`} aria-hidden />
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-flat-dark leading-snug">{item.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-0.5 font-medium">{item.detail}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      {/* Today's Schedule — Gray Block */}
      <section className="bg-flat-gray px-5 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-extrabold tracking-tight text-flat-dark flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-flat-blue" />
            </div>
            今日行程
          </h2>
          <Link href="/schedule" className="text-sm text-flat-blue font-semibold flex items-center gap-0.5 hover:underline">
            查看全部 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="space-y-2">
          {todaySchedule.map((item, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 bg-white rounded-lg px-4 py-3.5 transition-all duration-200 hover:scale-[1.02] cursor-pointer ${
                item.done ? "opacity-50" : ""
              }`}
            >
              <div
                className={`w-4 h-4 rounded-sm shrink-0 border-2 ${
                  item.done ? "bg-flat-emerald border-flat-emerald" : "border-flat-gray-dark"
                }`}
              />
              <span className="text-sm text-muted-foreground w-12 shrink-0 font-semibold">
                {item.time}
              </span>
              <span className={`font-medium ${item.done ? "line-through" : "text-flat-dark"}`}>
                {item.title}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Records — White Block */}
      <section className="px-5 py-6 pb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-extrabold tracking-tight text-flat-dark flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border-2 border-flat-gray-dark">
              <ClockArrowUp className="w-5 h-5 text-flat-blue" />
            </div>
            最近紀錄
          </h2>
          <Link href="/record" className="text-sm text-flat-blue font-semibold flex items-center gap-0.5 hover:underline">
            查看全部 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="space-y-3">
          {recentRecords.map((r, i) => (
            <div
              key={i}
              className="flex items-start gap-3 bg-flat-gray rounded-lg p-4 transition-all duration-200 hover:scale-[1.02] cursor-pointer"
            >
              <div className={`w-2 h-full min-h-[3rem] rounded-full ${r.color} shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2.5 py-1 rounded-md font-semibold text-white ${r.color}`}>
                    {r.category}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">{r.time}</span>
                </div>
                <p className="text-sm leading-relaxed line-clamp-2 text-flat-dark">{r.preview}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Save Toast */}
      {showToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="flex items-center gap-2 bg-flat-dark text-white px-5 py-3 rounded-lg shadow-lg">
            <CircleCheck className="w-5 h-5 text-flat-emerald shrink-0" />
            <span className="text-sm font-semibold">紀錄已儲存</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-lg mx-auto min-h-[50vh] flex items-center justify-center text-sm text-muted-foreground">
          載入中…
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}
