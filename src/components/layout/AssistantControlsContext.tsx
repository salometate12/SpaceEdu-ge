"use client";

import {
  createContext,
  useContext,
  useEffect,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import type { SmartSpace } from "@/lib/smart-space";

type SetControls = (panel: ReactNode) => void;

const AssistantControlsContext = createContext<SetControls | null>(null);
const SmartSpaceContext = createContext<SmartSpace>("exam");
const SetSmartSpaceContext = createContext<Dispatch<SetStateAction<SmartSpace>> | null>(
  null,
);

export function AssistantControlsProvider({
  setControls,
  space,
  setSpace,
  children,
}: {
  setControls: SetControls;
  space: SmartSpace;
  setSpace: Dispatch<SetStateAction<SmartSpace>>;
  children: ReactNode;
}) {
  return (
    <AssistantControlsContext.Provider value={setControls}>
      <SmartSpaceContext.Provider value={space}>
        <SetSmartSpaceContext.Provider value={setSpace}>
          {children}
        </SetSmartSpaceContext.Provider>
      </SmartSpaceContext.Provider>
    </AssistantControlsContext.Provider>
  );
}

export function useAssistantControls(panel: ReactNode) {
  const setControls = useContext(AssistantControlsContext);

  useEffect(() => {
    if (!setControls) return;
    setControls(panel);
    return () => setControls(null);
  }, [panel, setControls]);
}

export function useSmartSpace() {
  return useContext(SmartSpaceContext);
}

export function useSetSmartSpace() {
  return useContext(SetSmartSpaceContext);
}
