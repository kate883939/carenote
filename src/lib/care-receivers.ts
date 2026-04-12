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
    id: "wang-nainai",
    name: "王奶奶",
    relationship: "母親",
    age: 82,
    avatar: "👵",
    conditions: ["高血壓", "糖尿病", "輕度失智"],
    medications: ["降血壓藥", "血糖藥", "維生素D"],
    notes: "早晚需量血壓，飯後半小時服藥。不喜歡吃太鹹的食物。",
  },
  {
    id: "chen-yeye",
    name: "陳爺爺",
    relationship: "公公",
    age: 78,
    avatar: "👴",
    conditions: ["退化性關節炎", "高血脂"],
    medications: ["止痛藥（需要時）", "降血脂藥"],
    notes: "膝蓋不好，上下樓梯需要攙扶。每週二、四復健。",
  },
];

export const DEFAULT_RECEIVER_ID = "wang-nainai";
