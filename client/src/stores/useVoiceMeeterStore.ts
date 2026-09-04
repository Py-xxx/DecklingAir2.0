// Live VoiceMeeter state — populated entirely by socket event handlers (see
// hooks/useDecklingSocket.ts), read by every VM-related card. Writes go back out through
// socket.ts's vmSet/vmMacro, which is a fire-and-forget request to the server; the
// authoritative value only updates once the server echoes vm:update / vm:state back, so
// a card always renders the last value the server actually confirmed, never an
// optimistic local guess.
import { create } from 'zustand';
import type { VmParamValue, VmStatus } from '@/lib/socket';

interface VoiceMeeterStore {
  status: VmStatus;
  state: Record<string, VmParamValue>;
  levels: number[];
  setStatus: (status: VmStatus) => void;
  setState: (state: Record<string, VmParamValue>) => void;
  applyUpdate: (param: string, value: VmParamValue) => void;
  applyPatch: (params: { param: string; value: VmParamValue }[]) => void;
  setLevels: (levels: number[]) => void;
}

export const useVoiceMeeterStore = create<VoiceMeeterStore>((set) => ({
  status: { connected: false, type: null, version: null },
  state: {},
  levels: [],

  setStatus: (status) => set({ status }),
  setState: (state) => set({ state }),

  applyUpdate: (param, value) =>
    set((s) => (s.state[param] === value ? s : { state: { ...s.state, [param]: value } })),

  applyPatch: (params) =>
    set((s) => {
      const next = { ...s.state };
      for (const { param, value } of params) next[param] = value;
      return { state: next };
    }),

  // Levels stream at up to POLL_MS frequency — replace wholesale, no diffing needed,
  // and deliberately never routed through applyUpdate/applyPatch's object-spread path.
  setLevels: (levels) => set({ levels }),
}));
