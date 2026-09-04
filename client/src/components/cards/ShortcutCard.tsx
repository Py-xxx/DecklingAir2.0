// Fires a desktop action on the PC (launch app, open URL, media keys, system actions,
// custom key combo) — see server/desktopActions.js for the supported `action` values.
import { Button } from '@/components/ui/button';
import { desktopAction } from '@/lib/socket';
import type { ShortcutConfig } from '@/lib/layout';

export function ShortcutCard({ config }: { config: ShortcutConfig }) {
  return (
    <Button
      variant="secondary"
      className="h-full w-full flex-col gap-1 whitespace-normal text-center"
      onClick={() => desktopAction({ action: config.action, target: config.target, args: config.args })}
    >
      {config.label}
    </Button>
  );
}
