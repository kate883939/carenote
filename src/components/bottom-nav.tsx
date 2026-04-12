"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarDays, ClipboardList, BookOpen } from "lucide-react";

const navItems = [
  { href: "/", label: "首頁", icon: Home },
  { href: "/schedule", label: "行程", icon: CalendarDays },
  { href: "/record", label: "紀錄", icon: ClipboardList },
  { href: "/knowledge", label: "知識站", icon: BookOpen },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-flat-dark">
      <div className="max-w-lg mx-auto flex items-center justify-around h-18">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={(e) => {
                if (isActive) {
                  e.preventDefault();
                  window.location.href = item.href;
                }
              }}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[4rem] py-2 px-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? "text-white bg-white/10"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[11px] tracking-wider uppercase ${isActive ? "font-bold" : "font-medium"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
