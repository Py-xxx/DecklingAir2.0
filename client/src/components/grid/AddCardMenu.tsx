// The "+" add-card flow. Scoped deliberately small for this first pass: Strip Panel and
// Bus Panel (each already composes a fader, mute, and — for strips — routing, so they're
// the one-click-useful cards) plus Label. Standalone Fader/VU Meter/Toggle/Macro/Shortcut
// cards render fine once a control for them exists in the layout — they just don't have
// a quick-add entry yet, since Macro and Shortcut in particular need real config (which
// params, which desktop action) that this app has no editor for yet. That's next, not
// this pass — see .claude/design/ELEMENTS.md.
//
// The menu itself is also a known, deliberate exception to "never hand-position an
// overlay" (deckling-interface-polish/layering.md) — it's a plain absolutely-positioned
// div, not a portalled/collision-aware Popover, because Base UI isn't in the project yet
// (nothing built so far has needed it). Swap this for a real Popover once Base UI is
// added for Settings/Dialog work, rather than letting a second hand-rolled overlay
// pattern take root.
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Panel } from '@/components/ui/panel';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { STRIP_LABELS, BUS_LABELS } from '@/lib/vm';
import { cn } from '@/lib/utils';

export function AddCardMenu() {
  const [open, setOpen] = useState(false);
  const addControl = useLayoutStore((s) => s.addControl);

  function add(type: 'strip_panel' | 'bus_panel' | 'label', index: number) {
    if (type === 'label') addControl('label', { text: 'Label' });
    else addControl(type, { index });
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
              <MenuItem key={label} onClick={() => add('strip_panel', i)}>
                {label}
              </MenuItem>
            ))}
          </MenuSection>
          <MenuSection title="Bus panels">
            {BUS_LABELS.map((label, i) => (
              <MenuItem key={label} onClick={() => add('bus_panel', i)}>
                {label}
              </MenuItem>
            ))}
          </MenuSection>
          <MenuSection title="Other">
            <MenuItem onClick={() => add('label', 0)}>Label</MenuItem>
          </MenuSection>
        </Panel>
      )}
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
