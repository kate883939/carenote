"use client";

import {
  BookOpen,
  ExternalLink,
  HeartPulse,
  Home,
  Pill,
  ShieldAlert,
  UtensilsCrossed,
} from "lucide-react";

const topics = [
  {
    title: "認識長照 2.0 與補助",
    desc: "家庭申請資格、給付項目與地方主管機關窗口整理（示範內容）。",
    icon: Home,
    accent: "bg-flat-blue/15 text-flat-blue border-flat-blue/25",
  },
  {
    title: "居家防跌與環境調整",
    desc: "照明、扶手、地面材質與輔具選擇的實用檢核重點。",
    icon: ShieldAlert,
    accent: "bg-flat-amber-light text-flat-amber-dark border-flat-amber/30",
  },
  {
    title: "用藥安全與藥袋閱讀",
    desc: "多重用藥注意、服藥時間與副作用觀察要點。",
    icon: Pill,
    accent: "bg-flat-emerald-light text-flat-emerald-dark border-flat-emerald/30",
  },
  {
    title: "營養與吞嚥",
    desc: "軟質／泥狀飲食、水分與營養師諮詢時可準備的資料。",
    icon: UtensilsCrossed,
    accent: "bg-flat-red-light text-flat-red border-flat-red/25",
  },
  {
    title: "照顧者身心支持",
    desc: "喘息服務、家屬團體與情緒照顧資源（示範連結）。",
    icon: HeartPulse,
    accent: "bg-[#F5F3FF] text-[#6D28D9] border-[#DDD6FE]",
  },
];

export default function KnowledgePage() {
  return (
    <div className="max-w-lg mx-auto">
      <div className="relative bg-[#7C3AED] px-5 pt-6 pb-6 overflow-hidden">
        <div className="absolute top-[-24px] right-[-16px] w-32 h-32 rounded-full bg-white/10 pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-7 h-7 shrink-0" />
            長照知識站
          </h1>
          <p className="text-sm text-white/85 font-medium mt-1.5 leading-relaxed">
            整理長照家庭常見主題與官方資源方向，內容為示範架構，實際申請與醫療決策請依專業人員與主管機關為準。
          </p>
        </div>
      </div>

      <section className="px-5 py-6 space-y-3">
        <h2 className="text-sm font-extrabold text-flat-dark mb-1">主題瀏覽</h2>
        <ul className="space-y-3">
          {topics.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.title}>
                <button
                  type="button"
                  className={`w-full text-left rounded-xl border px-4 py-3.5 flex gap-3 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] ${item.accent}`}
                >
                  <div className="mt-0.5 shrink-0">
                    <Icon className="w-5 h-5" strokeWidth={2.25} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-flat-dark leading-snug">{item.title}</p>
                    <p className="text-xs text-muted-foreground font-medium mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>

        <a
          href="https://1966.gov.tw/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-dashed border-flat-gray-dark/40 bg-flat-gray/50 px-4 py-3 text-sm font-semibold text-flat-blue hover:bg-flat-gray transition-colors"
        >
          <span>衛福部長照專區（1966）</span>
          <ExternalLink className="w-4 h-4 shrink-0" />
        </a>
      </section>
    </div>
  );
}
