// The grid layout — pages and their cards, plus edit-mode UI state (which is local-only,
// never persisted or sent to the server). Every mutation that touches `pages` schedules a
// debounced save to the server via socket.ts's saveLayout(); edit-mode toggling does not.
import { create } from 'zustand';
import { saveLayout as saveLayoutToServer } from '@/lib/socket';
import {
  DEFAULT_LAYOUT,
  createControl,
  nextFreeRow,
  type CardConfig,
  type CardType,
  type GridControl,
  type Layout,
  type Page,
} from '@/lib/layout';

const SAVE_DEBOUNCE_MS = 400;
let saveTimer: ReturnType<typeof setTimeout> | undefined;

function scheduleSave(layout: Layout) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveLayoutToServer(layout), SAVE_DEBOUNCE_MS);
}

interface LayoutStore {
  pages: Page[];
  activePageId: string;
  editMode: boolean;
  hasReceivedLayout: boolean;

  setLayout: (layout: Layout) => void;
  setActivePage: (id: string) => void;
  toggleEditMode: () => void;

  addControl: (type: CardType, config: CardConfig) => void;
  updateControl: (id: string, patch: Partial<Pick<GridControl, 'x' | 'y' | 'w' | 'h'>>) => void;
  updateControlConfig: (id: string, config: CardConfig) => void;
  removeControl: (id: string) => void;
}

export const useLayoutStore = create<LayoutStore>((set, get) => ({
  pages: DEFAULT_LAYOUT.pages,
  activePageId: DEFAULT_LAYOUT.pages[0].id,
  editMode: false,
  hasReceivedLayout: false,

  // From the server — the layout the user actually saved, not a local guess. Only trust
  // it once; after that, local edits are the source of truth until they're saved back.
  setLayout: (layout) =>
    set((s) => ({
      pages: layout.pages.length ? layout.pages : s.pages,
      activePageId: s.hasReceivedLayout ? s.activePageId : layout.pages[0]?.id ?? s.activePageId,
      hasReceivedLayout: true,
    })),

  setActivePage: (id) => set({ activePageId: id }),
  toggleEditMode: () => set((s) => ({ editMode: !s.editMode })),

  addControl: (type, config) =>
    set((s) => {
      const pages = s.pages.map((page) => {
        if (page.id !== s.activePageId) return page;
        const control = createControl(type, config, 0, nextFreeRow(page.controls));
        return { ...page, controls: [...page.controls, control] };
      });
      scheduleSave({ pages });
      return { pages };
    }),

  updateControl: (id, patch) =>
    set((s) => {
      const pages = s.pages.map((page) => ({
        ...page,
        controls: page.controls.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      }));
      scheduleSave({ pages });
      return { pages };
    }),

  updateControlConfig: (id, config) =>
    set((s) => {
      const pages = s.pages.map((page) => ({
        ...page,
        controls: page.controls.map((c) => (c.id === id ? { ...c, config } : c)),
      }));
      scheduleSave({ pages });
      return { pages };
    }),

  removeControl: (id) =>
    set((s) => {
      const pages = s.pages.map((page) => ({
        ...page,
        controls: page.controls.filter((c) => c.id !== id),
      }));
      scheduleSave({ pages });
      return { pages };
    }),
}));

export function activePage(store: Pick<LayoutStore, 'pages' | 'activePageId'>): Page {
  return store.pages.find((p) => p.id === store.activePageId) ?? store.pages[0];
}
