import { redirect } from "next/navigation";

/** 舊網址 /history 導向照護紀錄列表（現為 /record） */
export default function HistoryRedirectPage() {
  redirect("/record");
}
