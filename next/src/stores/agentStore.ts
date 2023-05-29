import { createSelectors } from "./helpers";
import type { StateCreator } from "zustand";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ActiveTool } from "../hooks/useTools";

interface ToolsSlice {
  tools: Omit<ActiveTool, "active">[];
  setTools: (tools: ActiveTool[]) => void;
}

const createToolsSlice: StateCreator<ToolsSlice> = (set) => {
  return {
    tools: [],
    setTools: (tools) => {
      set(() => ({
        tools: tools,
      }));
    },
  };
};

export const useAgentStore = createSelectors(
  create<ToolsSlice>()(
    persist(
      (...a) => ({
        ...createToolsSlice(...a),
      }),
      {
        name: "agent-storage",
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          // isWebSearchEnabled: state.isWebSearchEnabled
        }),
      }
    )
  )
);
