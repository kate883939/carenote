import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import { Noto_Sans_TC } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/bottom-nav";
import { CareReceiverProvider } from "@/contexts/care-receiver-context";
import { ScheduleEventsProvider } from "@/contexts/schedule-events-context";

const outfit = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const notoSansTC = Noto_Sans_TC({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "照護聯絡簿",
  description: "長照家庭數位聯絡簿 — 快速紀錄照護與分享",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#3B82F6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant" className={`${outfit.variable} ${notoSansTC.variable} antialiased`}>
      <body className="min-h-screen bg-background">
        {/* iOS Safari: register body as clickable so React delegated click events bubble correctly */}
        <script dangerouslySetInnerHTML={{ __html: `document.body.setAttribute('onclick','')` }} />
        <CareReceiverProvider>
          <ScheduleEventsProvider>
            <main className="pb-20">{children}</main>
            <BottomNav />
          </ScheduleEventsProvider>
        </CareReceiverProvider>
      </body>
    </html>
  );
}
