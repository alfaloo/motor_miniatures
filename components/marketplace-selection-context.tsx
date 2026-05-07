"use client";

import { createContext } from "react";
import type { ListingStatus } from "@/db/schema";

export type { ListingStatus };

export type SelectionState =
  | { active: false }
  | { active: true; selectedIds: Set<string>; pendingStatus: ListingStatus | null };

export type SelectionContextValue = {
  selectionState: SelectionState;
  toggleId: (id: string) => void;
};

export const SelectionContext = createContext<SelectionContextValue>({
  selectionState: { active: false },
  toggleId: () => {},
});
