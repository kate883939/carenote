export interface CareReceiver {
  id: string;
  name: string;
  relationship: string;
  age: number;
  avatar: string;
  conditions: string[];
  medications: string[];
  notes: string;
}

export const careReceivers: CareReceiver[] = [
  {
    id: "case-a",
    name: "個案A",
    relationship: "家屬",
    age: 80,
    avatar: "👵",
    conditions: ["慢性病管理", "行動力下降"],
    medications: ["口服藥物A", "口服藥物B"],
    notes: "示範資料：每日固定量測與記錄，飲食以清淡為主。",
  },
  {
    id: "case-b",
    name: "個案B",
    relationship: "家屬",
    age: 76,
    avatar: "👴",
    conditions: ["關節不適", "慢性病管理"],
    medications: ["口服藥物C", "復健相關藥物"],
    notes: "示範資料：需留意移動安全並配合復健計畫。",
  },
];

export const DEFAULT_RECEIVER_ID = "case-a";
