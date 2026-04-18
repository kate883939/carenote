"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AssigneeId, AssigneeManualDayMap, ManualDayMark } from "@/lib/schedule";

const STORAGE_KEY = "care-note-current-user-v1";

type PersistedShape = {
  displayName: string;
  linkedAssigneeId: AssigneeId;
  assigneeManualByDate: AssigneeManualDayMap;
};

const DEFAULT: PersistedShape = {
  displayName: "使用者",
  linkedAssigneeId: "mei",
  assigneeManualByDate: {},
};

function isAssigneeId(x: string): x is AssigneeId {
  return ["mei", "wei", "aide", "jiaC"].includes(x);
}

function parseStored(raw: string | null): PersistedShape | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as unknown;
    if (!o || typeof o !== "object") return null;
    const p = o as Record<string, unknown>;
    const displayName = typeof p.displayName === "string" ? p.displayName : DEFAULT.displayName;
    const linkedAssigneeId =
      typeof p.linkedAssigneeId === "string" && isAssigneeId(p.linkedAssigneeId)
        ? p.linkedAssigneeId
        : DEFAULT.linkedAssigneeId;
    let assigneeManualByDate: AssigneeManualDayMap = {};
    if (p.assigneeManualByDate && typeof p.assigneeManualByDate === "object") {
      const outer = p.assigneeManualByDate as Record<string, unknown>;
      for (const [aid, inner] of Object.entries(outer)) {
        if (!isAssigneeId(aid) || !inner || typeof inner !== "object") continue;
        const days: Record<string, ManualDayMark> = {};
        for (const [ymd, mark] of Object.entries(inner as Record<string, unknown>)) {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) continue;
          if (mark === "free" || mark === "busy") days[ymd] = mark;
        }
        if (Object.keys(days).length > 0) assigneeManualByDate = { ...assigneeManualByDate, [aid]: days };
      }
    }
    return { displayName, linkedAssigneeId, assigneeManualByDate };
  } catch {
    return null;
  }
}

interface CurrentUserContextValue {
  displayName: string;
  setDisplayName: (v: string) => void;
  linkedAssigneeId: AssigneeId;
  setLinkedAssigneeId: (id: AssigneeId) => void;
  assigneeManualByDate: AssigneeManualDayMap;
  setAssigneeDayMark: (assigneeId: AssigneeId, ymd: string, mark: ManualDayMark | null) => void;
  cycleAssigneeDayMark: (assigneeId: AssigneeId, ymd: string) => void;
}

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [displayName, setDisplayName] = useState(DEFAULT.displayName);
  const [linkedAssigneeId, setLinkedAssigneeId] = useState<AssigneeId>(DEFAULT.linkedAssigneeId);
  const [assigneeManualByDate, setAssigneeManualByDate] = useState<AssigneeManualDayMap>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const parsed = parseStored(typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null);
    if (parsed) {
      setDisplayName(parsed.displayName);
      setLinkedAssigneeId(parsed.linkedAssigneeId);
      setAssigneeManualByDate(parsed.assigneeManualByDate);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || typeof window === "undefined") return;
    const payload: PersistedShape = { displayName, linkedAssigneeId, assigneeManualByDate };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [ready, displayName, linkedAssigneeId, assigneeManualByDate]);

  const setAssigneeDayMark = useCallback((assigneeId: AssigneeId, ymd: string, mark: ManualDayMark | null) => {
    setAssigneeManualByDate((prev) => {
      const next: AssigneeManualDayMap = { ...prev };
      const sub = { ...(next[assigneeId] ?? {}) };
      if (mark === null) delete sub[ymd];
      else sub[ymd] = mark;
      if (Object.keys(sub).length === 0) delete next[assigneeId];
      else next[assigneeId] = sub;
      return next;
    });
  }, []);

  const cycleAssigneeDayMark = useCallback((assigneeId: AssigneeId, ymd: string) => {
    setAssigneeManualByDate((prev) => {
      const cur = prev[assigneeId]?.[ymd];
      const nextMark: ManualDayMark | null =
        cur === undefined ? "free" : cur === "free" ? "busy" : null;
      const next: AssigneeManualDayMap = { ...prev };
      const sub = { ...(next[assigneeId] ?? {}) };
      if (nextMark === null) delete sub[ymd];
      else sub[ymd] = nextMark;
      if (Object.keys(sub).length === 0) delete next[assigneeId];
      else next[assigneeId] = sub;
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      displayName,
      setDisplayName,
      linkedAssigneeId,
      setLinkedAssigneeId,
      assigneeManualByDate,
      setAssigneeDayMark,
      cycleAssigneeDayMark,
    }),
    [
      displayName,
      linkedAssigneeId,
      assigneeManualByDate,
      setAssigneeDayMark,
      cycleAssigneeDayMark,
    ]
  );

  return <CurrentUserContext.Provider value={value}>{children}</CurrentUserContext.Provider>;
}

export function useCurrentUser() {
  const ctx = useContext(CurrentUserContext);
  if (!ctx) throw new Error("useCurrentUser must be used within CurrentUserProvider");
  return ctx;
}
