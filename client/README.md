# DecklingAir client

The frontend — Vite + React 18 + TypeScript + Tailwind v4 + Base UI. See the root
[CLAUDE.md](../CLAUDE.md) and [.claude/design/ELEMENTS.md](../.claude/design/ELEMENTS.md) before
touching any UI.

## First-time setup

This scaffold was written without a working Node.js environment available, so nothing has been
installed or run yet. From this directory:

```bash
npm install
```

Then pull in Base UI + the first shadcn primitives (this also finalizes `components.json`'s
detected settings):

```bash
npx shadcn@latest add button
```

Answer its prompts to confirm the existing `components.json`/`tailwind`/`tsconfig` setup, then add
more as needed (`tooltip`, `popover`, `dialog`, `switch`, `tabs`, `badge`, `select`, `skeleton`,
`context-menu`) — see `.claude/design/ELEMENTS.md` §2 for the planned list. Each one lands in
`src/components/ui/`; restyle it against the tokens in `src/index.css` per
`.claude/skills/deckling-interface-polish/`, and record what changed in the file's header.

## Running it

```bash
npm run dev
```

Opens on `http://localhost:5173`, proxying `/socket.io` to the server on `:3002` (see
`vite.config.ts`) — so **the server must already be running** (`cd ../server && npm start`) for the
client to see live data.

## Building for the controlled PC

```bash
npm run build
```

Outputs straight into `../server/public`, which `server/index.js` serves as static files — so a
production run is just `cd ../server && npm start` after a build, same PC, same port.
