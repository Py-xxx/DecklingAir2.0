import { Pencil, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AddCardMenu } from '@/components/grid/AddCardMenu';
import { GridCanvas } from '@/components/grid/GridCanvas';
import { useDecklingSocket } from '@/hooks/useDecklingSocket';
import { activePage, useLayoutStore } from '@/stores/useLayoutStore';
import { useVoiceMeeterStore } from '@/stores/useVoiceMeeterStore';
import { cn } from '@/lib/utils';

export default function App() {
  useDecklingSocket();

  const pages = useLayoutStore((s) => s.pages);
  const activePageId = useLayoutStore((s) => s.activePageId);
  const setActivePage = useLayoutStore((s) => s.setActivePage);
  const editMode = useLayoutStore((s) => s.editMode);
  const toggleEditMode = useLayoutStore((s) => s.toggleEditMode);
  const page = useLayoutStore(activePage);

  const connected = useVoiceMeeterStore((s) => s.status.connected);

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <header className="flex items-center gap-3 border-b border-line bg-bg-surface px-4 py-2">
        <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
          {pages.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePage(p.id)}
              className={cn(
                'h-10 shrink-0 rounded-md px-3 font-sans text-sm transition-colors duration-150 ease-out',
                p.id === activePageId ? 'bg-bg-elevated text-ink' : 'text-ink-dim hover:text-ink',
              )}
            >
              {p.name}
            </button>
          ))}
        </nav>

        <Badge tone={connected ? 'green' : 'red'}>{connected ? 'Connected' : 'Offline'}</Badge>

        <Button
          variant={editMode ? 'default' : 'ghost'}
          size="icon"
          aria-label={editMode ? 'Done editing' : 'Edit layout'}
          onClick={toggleEditMode}
        >
          {editMode ? <Check className="size-4" /> : <Pencil className="size-4" />}
        </Button>

        {editMode && <AddCardMenu />}
      </header>

      <main className="flex-1 overflow-auto p-4">
        <GridCanvas page={page} editMode={editMode} />
      </main>
    </div>
  );
}
