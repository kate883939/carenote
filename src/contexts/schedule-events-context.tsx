"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { type ScheduleEvent, createDefaultScheduleEvents } from "@/lib/schedule";

type ScheduleEventsContextValue = {
  events: ScheduleEvent[];
  setEvents: React.Dispatch<React.SetStateAction<ScheduleEvent[]>>;
  toggleEventDone: (id: string) => void;
};

const ScheduleEventsContext = createContext<ScheduleEventsContextValue | null>(null);

export function ScheduleEventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<ScheduleEvent[]>(() =>
    createDefaultScheduleEvents(new Date())
  );

  const toggleEventDone = useCallback((id: string) => {
    setEvents((prev) =>
      prev.map((ev) => (ev.id === id ? { ...ev, done: !ev.done } : ev))
    );
  }, []);

  const value = useMemo(
    () => ({ events, setEvents, toggleEventDone }),
    [events, toggleEventDone]
  );

  return (
    <ScheduleEventsContext.Provider value={value}>
      {children}
    </ScheduleEventsContext.Provider>
  );
}

export function useScheduleEvents() {
  const ctx = useContext(ScheduleEventsContext);
  if (!ctx) {
    throw new Error("useScheduleEvents must be used within ScheduleEventsProvider");
  }
  return ctx;
}
