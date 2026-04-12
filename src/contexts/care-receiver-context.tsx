"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { careReceivers, DEFAULT_RECEIVER_ID, type CareReceiver } from "@/lib/care-receivers";

interface CareReceiverContextValue {
  current: CareReceiver;
  all: CareReceiver[];
  switchReceiver: (id: string) => void;
}

const CareReceiverContext = createContext<CareReceiverContextValue | null>(null);

export function CareReceiverProvider({ children }: { children: ReactNode }) {
  const [currentId, setCurrentId] = useState(DEFAULT_RECEIVER_ID);
  const current = careReceivers.find((r) => r.id === currentId) ?? careReceivers[0];

  return (
    <CareReceiverContext.Provider
      value={{
        current,
        all: careReceivers,
        switchReceiver: setCurrentId,
      }}
    >
      {children}
    </CareReceiverContext.Provider>
  );
}

export function useCareReceiver() {
  const ctx = useContext(CareReceiverContext);
  if (!ctx) throw new Error("useCareReceiver must be used within CareReceiverProvider");
  return ctx;
}
