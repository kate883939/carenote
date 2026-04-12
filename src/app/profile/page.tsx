"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pill, Stethoscope, StickyNote, ArrowLeftRight } from "lucide-react";
import { useCareReceiver } from "@/contexts/care-receiver-context";

export default function ProfilePage() {
  const router = useRouter();
  const { current, all, switchReceiver } = useCareReceiver();
  const [showSwitcher, setShowSwitcher] = useState(false);

  return (
    <div className="max-w-lg mx-auto min-h-screen">
      {/* Header */}
      <div className="bg-flat-blue px-5 pt-5 pb-8 relative overflow-hidden">
        <div className="absolute top-[-40px] right-[-30px] w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute bottom-[-20px] left-[-20px] w-24 h-24 rounded-full bg-white/10 pointer-events-none" />

        <div className="relative z-10">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-white/80 text-sm font-medium mb-4 active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5" />
            返回
          </button>

          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-4xl">
              {current.avatar}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                {current.name}
              </h1>
              <p className="text-white/70 text-sm font-medium mt-0.5">
                {current.relationship} · {current.age} 歲
              </p>
            </div>
            {all.length > 1 && (
              <button
                onClick={() => setShowSwitcher(!showSwitcher)}
                className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg bg-white/15 active:scale-95 transition-transform"
              >
                <ArrowLeftRight className="w-5 h-5 text-white" />
                <span className="text-[10px] text-white/80 font-medium">切換</span>
              </button>
            )}
          </div>

          {/* Switcher Dropdown */}
          {showSwitcher && (
            <div className="mt-3 space-y-2">
              {all
                .filter((r) => r.id !== current.id)
                .map((receiver) => (
                  <button
                    key={receiver.id}
                    onClick={() => {
                      switchReceiver(receiver.id);
                      setShowSwitcher(false);
                    }}
                    className="w-full flex items-center gap-3 rounded-lg px-4 py-3 bg-white/15 active:scale-[0.98] transition-transform"
                  >
                    <span className="text-2xl">{receiver.avatar}</span>
                    <div className="text-left">
                      <p className="font-semibold text-white">{receiver.name}</p>
                      <p className="text-xs text-white/60">
                        {receiver.relationship} · {receiver.age} 歲
                      </p>
                    </div>
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="px-5 py-6 space-y-4">
        {/* Conditions */}
        <div className="bg-flat-gray rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-flat-red-light flex items-center justify-center">
              <Stethoscope className="w-4 h-4 text-flat-red" />
            </div>
            <h2 className="font-bold text-flat-dark">主要疾病</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {current.conditions.map((c) => (
              <span
                key={c}
                className="px-3 py-1.5 rounded-md bg-white text-sm font-semibold text-flat-dark"
              >
                {c}
              </span>
            ))}
          </div>
        </div>

        {/* Medications */}
        <div className="bg-flat-gray rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-flat-blue-light flex items-center justify-center">
              <Pill className="w-4 h-4 text-flat-blue" />
            </div>
            <h2 className="font-bold text-flat-dark">目前用藥</h2>
          </div>
          <div className="space-y-2">
            {current.medications.map((m) => (
              <div
                key={m}
                className="flex items-center gap-2 bg-white rounded-md px-4 py-2.5"
              >
                <div className="w-2 h-2 rounded-full bg-flat-blue shrink-0" />
                <span className="text-sm font-medium text-flat-dark">{m}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-flat-gray rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-flat-amber-light flex items-center justify-center">
              <StickyNote className="w-4 h-4 text-flat-amber" />
            </div>
            <h2 className="font-bold text-flat-dark">備註</h2>
          </div>
          <p className="text-sm leading-relaxed text-flat-dark/80">{current.notes}</p>
        </div>

      </div>
    </div>
  );
}
