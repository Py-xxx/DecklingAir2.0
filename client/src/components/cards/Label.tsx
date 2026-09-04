// A text header / separator for organising the grid. No interaction.
import type { LabelConfig } from '@/lib/layout';

export function Label({ config }: { config: LabelConfig }) {
  return (
    <div className="flex h-full items-center px-1">
      <span className="truncate font-sans text-sm font-semibold text-ink-soft">{config.text}</span>
    </div>
  );
}
