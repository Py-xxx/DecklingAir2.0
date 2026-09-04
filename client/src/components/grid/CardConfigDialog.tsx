// The config form for card types that need one: Label, Macro, Shortcut, and standalone
// Fader/VU Meter/Toggle (target + index, and for Toggle, which param). Strip Panel/Bus
// Panel don't get a form — their only "config" is which strip/bus, already chosen in
// AddCardMenu, and re-pointing one at a different channel is rare enough that deleting
// and re-adding is fine.
//
// Controlled from outside: `target` is null when closed, otherwise
// `{ type, initialConfig? }` — present initialConfig means editing an existing card
// (adds a Delete button), absent means creating a new one.
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { boolParamsFor, BUS_LABELS, STRIP_LABELS } from '@/lib/vm';
import { DESKTOP_ACTIONS, desktopActionOption } from '@/lib/desktopActions';
import { CARD_TYPE_LABEL } from '@/components/grid/cardRegistry';
import type {
  CardConfig,
  CardType,
  FaderConfig,
  LabelConfig,
  MacroConfig,
  ShortcutConfig,
  ToggleConfig,
  VuMeterConfig,
} from '@/lib/layout';

export interface ConfigTarget {
  type: CardType;
  initialConfig?: CardConfig;
}

interface Props {
  target: ConfigTarget | null;
  onClose: () => void;
  onSave: (config: CardConfig) => void;
  onDelete?: () => void;
}

// Sensible starting point per type when creating fresh (no initialConfig).
function defaultConfig(type: CardType): CardConfig {
  switch (type) {
    case 'fader':
    case 'vu_meter':
      return { target: 'strip', index: 0 } as FaderConfig | VuMeterConfig;
    case 'toggle':
      return { target: 'strip', index: 0, param: 'Mute', label: 'Mute' } as ToggleConfig;
    case 'macro':
      return { label: 'Macro', params: [{ param: '', value: 0 }], momentary: false } as MacroConfig;
    case 'label':
      return { text: 'Label' } as LabelConfig;
    case 'shortcut':
      return { label: 'Shortcut', action: 'media_play_pause' } as ShortcutConfig;
    default:
      return { text: '' } as LabelConfig;
  }
}

export function CardConfigDialog({ target, onClose, onSave, onDelete }: Props) {
  const [draft, setDraft] = useState<CardConfig | null>(null);

  useEffect(() => {
    if (target) setDraft(target.initialConfig ?? defaultConfig(target.type));
  }, [target]);

  if (!target || !draft) return null;
  const isEdit = !!target.initialConfig;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogTitle className="mb-3 pr-8 font-sans text-base font-semibold text-ink">
          {isEdit ? `Edit ${CARD_TYPE_LABEL[target.type]}` : `Add ${CARD_TYPE_LABEL[target.type]}`}
        </DialogTitle>

        <div className="flex flex-col gap-3">
          {target.type === 'label' && <LabelForm draft={draft as LabelConfig} setDraft={setDraft} />}
          {(target.type === 'fader' || target.type === 'vu_meter') && (
            <TargetIndexForm draft={draft as FaderConfig} setDraft={setDraft} />
          )}
          {target.type === 'toggle' && <ToggleForm draft={draft as ToggleConfig} setDraft={setDraft} />}
          {target.type === 'macro' && <MacroForm draft={draft as MacroConfig} setDraft={setDraft} />}
          {target.type === 'shortcut' && <ShortcutForm draft={draft as ShortcutConfig} setDraft={setDraft} />}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          {isEdit && onDelete ? (
            <Button variant="destructive" size="sm" onClick={onDelete}>
              Delete card
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => onSave(draft)}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[11px] uppercase tracking-wider text-ink-dim">{label}</span>
      {children}
    </label>
  );
}

function LabelForm({ draft, setDraft }: { draft: LabelConfig; setDraft: (c: CardConfig) => void }) {
  return (
    <Field label="Text">
      <Input value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} autoFocus />
    </Field>
  );
}

function TargetIndexForm({ draft, setDraft }: { draft: FaderConfig | VuMeterConfig; setDraft: (c: CardConfig) => void }) {
  const options = draft.target === 'strip' ? STRIP_LABELS : BUS_LABELS;
  return (
    <>
      <Field label="Target">
        <Select
          value={draft.target}
          onChange={(e) => setDraft({ ...draft, target: e.target.value as 'strip' | 'bus', index: 0 })}
        >
          <option value="strip">Strip (input)</option>
          <option value="bus">Bus (output)</option>
        </Select>
      </Field>
      <Field label="Channel">
        <Select value={draft.index} onChange={(e) => setDraft({ ...draft, index: Number(e.target.value) })}>
          {options.map((label, i) => (
            <option key={label} value={i}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
    </>
  );
}

function ToggleForm({ draft, setDraft }: { draft: ToggleConfig; setDraft: (c: CardConfig) => void }) {
  const options = draft.target === 'strip' ? STRIP_LABELS : BUS_LABELS;
  const params = boolParamsFor(draft.target);
  return (
    <>
      <Field label="Target">
        <Select
          value={draft.target}
          onChange={(e) => {
            const target = e.target.value as 'strip' | 'bus';
            setDraft({ ...draft, target, index: 0, param: boolParamsFor(target)[0] });
          }}
        >
          <option value="strip">Strip (input)</option>
          <option value="bus">Bus (output)</option>
        </Select>
      </Field>
      <Field label="Channel">
        <Select value={draft.index} onChange={(e) => setDraft({ ...draft, index: Number(e.target.value) })}>
          {options.map((label, i) => (
            <option key={label} value={i}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Parameter">
        <Select value={draft.param} onChange={(e) => setDraft({ ...draft, param: e.target.value })}>
          {params.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Label">
        <Input value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
      </Field>
    </>
  );
}

function MacroForm({ draft, setDraft }: { draft: MacroConfig; setDraft: (c: CardConfig) => void }) {
  function updateRow(i: number, patch: Partial<{ param: string; value: number }>) {
    const params = draft.params.map((p, idx) => (idx === i ? { ...p, ...patch } : p));
    setDraft({ ...draft, params });
  }
  function removeRow(i: number) {
    setDraft({ ...draft, params: draft.params.filter((_, idx) => idx !== i) });
  }

  return (
    <>
      <Field label="Label">
        <Input value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} autoFocus />
      </Field>
      <div className="flex flex-col gap-2">
        <span className="font-mono text-[11px] uppercase tracking-wider text-ink-dim">Parameters</span>
        {draft.params.map((p, i) => (
          <div key={i} className="flex gap-2">
            <Input
              placeholder="Strip[0].Gain"
              value={p.param}
              onChange={(e) => updateRow(i, { param: e.target.value })}
              className="flex-[2]"
            />
            <Input
              type="number"
              value={p.value}
              onChange={(e) => updateRow(i, { value: Number(e.target.value) })}
              className="flex-1"
            />
            <Button variant="ghost" size="icon" aria-label="Remove parameter" onClick={() => removeRow(i)}>
              ×
            </Button>
          </div>
        ))}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setDraft({ ...draft, params: [...draft.params, { param: '', value: 0 }] })}
        >
          Add parameter
        </Button>
      </div>
      <label className="flex h-10 items-center gap-2">
        <input
          type="checkbox"
          checked={draft.momentary}
          onChange={(e) => setDraft({ ...draft, momentary: e.target.checked })}
          className="size-4"
        />
        <span className="font-sans text-sm text-ink">Momentary (revert on release)</span>
      </label>
    </>
  );
}

function ShortcutForm({ draft, setDraft }: { draft: ShortcutConfig; setDraft: (c: CardConfig) => void }) {
  const option = desktopActionOption(draft.action);
  return (
    <>
      <Field label="Label">
        <Input value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} autoFocus />
      </Field>
      <Field label="Action">
        <Select value={draft.action} onChange={(e) => setDraft({ ...draft, action: e.target.value })}>
          {DESKTOP_ACTIONS.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </Select>
      </Field>
      {option?.needsTarget && (
        <Field
          label={option.needsTarget === 'url' ? 'URL' : option.needsTarget === 'combo' ? 'Key combo (e.g. ctrl+shift+esc)' : 'Path'}
        >
          <Input value={draft.target ?? ''} onChange={(e) => setDraft({ ...draft, target: e.target.value })} />
        </Field>
      )}
      {option?.needsArgs && (
        <Field label="Arguments (optional)">
          <Input value={draft.args ?? ''} onChange={(e) => setDraft({ ...draft, args: e.target.value })} />
        </Field>
      )}
    </>
  );
}
