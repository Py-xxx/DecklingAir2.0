// The "+" add-card flow. Strip Panel, Bus Panel, and Label add directly with no config
// needed; Fader, VU Meter, Toggle, Macro, and Shortcut open CardConfigDialog first,
// since a Fader/VU Meter/Toggle needs to know which channel, and Macro/Shortcut have no
// sensible default at all.
//
// The menu itself is a known, deliberate exception to "never hand-position an overlay"
// (deckling-interface-polish/layering.md) — it's a plain absolutely-positioned div, not
// a portalled/collision-aware Popover, because Base UI wasn't in the project when this
// was first written. Base UI is in the project now (dialog.tsx) — this is the next
// thing that should become a real Popover rather than staying the second hand-rolled
// overlay pattern.
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Panel } from '@/components/ui/panel';
import { CardConfigDialog, type ConfigTarget } from '@/components/grid/CardConfigDialog';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { STRIP_LABELS, BUS_LABELS } from '@/lib/vm';
import type { CardType } from '@/lib/layout';
import { cn } from '@/lib/utils';

export function AddCardMenu() {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState<ConfigTarget | null>(null);
  const addControl = useLayoutStore((s) => s.addControl);

  function addDirect(type: 'strip_panel' | 'bus_panel', index: number) {
    addControl(type, { index });
    setOpen(false);
  }

  function addLabel() {
    addControl('label', { text: 'Label' });
    setOpen(false);
  }

  function openConfig(type: CardType) {
    setCreating({ type });
    setOpen(false);
  }

  return (
    <div className="relative">
      <Button
        variant="default"
        size="icon"
        aria-label={open ? 'Close add card menu' : 'Add card'}
        onClick={() => setOpen((v) => !v)}
      >
        <Plus className={cn('size-5 transition-transform duration-150', open && 'rotate-45')} />
      </Button>

      {open && (
        <Panel className="absolute right-0 top-12 z-(--z-dropdown) max-h-[70vh] w-56 overflow-y-auto p-1">
          <MenuSection title="Strip panels">
            {STRIP_LABELS.map((label, i) => (
              <MenuItem key={label} onClick={() => addDirect('strip_panel', i)}>
                {label}
              </MenuItem>
            ))}
          </MenuSection>
          <MenuSection title="Bus panels">
            {BUS_LABELS.map((label, i) => (
              <MenuItem key={label} onClick={() => addDirect('bus_panel', i)}>
                {label}
              </MenuItem>
            ))}
          </MenuSection>
          <MenuSection title="Individual controls">
            <MenuItem onClick={() => openConfig('fader')}>Fader…</MenuItem>
            <MenuItem onClick={() => openConfig('vu_meter')}>VU meter…</MenuItem>
            <MenuItem onClick={() => openConfig('toggle')}>Toggle…</MenuItem>
          </MenuSection>
          <MenuSection title="Other">
            <MenuItem onClick={() => openConfig('macro')}>Macro…</MenuItem>
            <MenuItem onClick={() => openConfig('shortcut')}>Shortcut…</MenuItem>
            <MenuItem onClick={addLabel}>Label</MenuItem>
          </MenuSection>
        </Panel>
      )}

      <CardConfigDialog
        target={creating}
        onClose={() => setCreating(null)}
        onSave={(config) => {
          if (creating) addControl(creating.type, config);
          setCreating(null);
        }}
      />
    </div>
  );
}

function MenuSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-1">
      <div className="px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-ink-faint">{title}</div>
      {children}
    </div>
  );
}

function MenuItem({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-10 w-full items-center rounded-md px-2 text-left font-sans text-sm text-ink transition-colors duration-150 ease-out hover:bg-bg-elevated"
    >
      {children}
    </button>
  );
}
