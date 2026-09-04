# DecklingAir

A touch-friendly control panel (VoiceMeeter remote + Stream Deck-style shortcuts, Spotify
dashboard coming later) that runs **locally on the Windows PC it controls**. Other devices on the
same network (iPad, phone, laptop) connect to it via that PC's IP address and a port — there's no
separate hub machine and no cloud service in the loop.

This is a ground-up rewrite. [github.com/Py-xxx/DecklingAir](https://github.com/Py-xxx/DecklingAir)
is the earlier version, kept only as a functional reference for what the app should do — none of
its code lives in this repo. See [CLAUDE.md](CLAUDE.md) for what's built so far and what isn't.

---

## Running it during development

You need [Node.js 20+](https://nodejs.org) installed. Two terminals, both on the PC that has
VoiceMeeter Potato installed:

```bash
# Terminal 1 — the server (VoiceMeeter control, desktop shortcuts, the web UI's data)
cd server
npm install
npm start
```

```bash
# Terminal 2 — the client, in dev mode with hot reload
cd client
npm install
npm run dev
```

Open `http://localhost:5173` (the client's dev server — it proxies API calls through to the
server on `:3002`, see `client/vite.config.ts`). The server's own startup log prints this PC's LAN
address; open the same page from that address (e.g. `http://192.168.1.42:3002` once you've done a
production build, see below) from another device on the network to control it from there.

VoiceMeeter Potato should already be running before you start the server — it logs in on startup
and retries automatically every few seconds if VoiceMeeter isn't up yet.

## Running it for real (production, one port)

```bash
cd client && npm install && npm run build   # outputs into ../server/public
cd ../server && npm install && npm start
```

Now everything is served from the one port: `http://localhost:3002` on this PC, or
`http://<this-PC's-IP>:3002` from any other device on the network. No separate dev servers, no
proxy — this is the same thing the packaged `.exe` below runs.

**Keep it running in the background** with [PM2](https://pm2.keymetrics.io/):

```bash
npm install -g pm2
pm2 start index.js --name decklingair --cwd server
pm2 save
```

## A standalone `.exe`

The goal: double-click an icon, a tray icon appears (`Open DecklingAir`, `Start with Windows`,
`Quit`), no console window, no need to have Node.js installed on the machine you hand this to.

```bash
cd client && npm install && npm run build
cd ../server && npm install
npm run dist:exe
```

This uses [`@yao-pkg/pkg`](https://github.com/yao-pkg/pkg) (the maintained fork of the now-archived
`vercel/pkg`) to bundle the server, the built client, and a Node runtime into
`server/dist/DecklingAir.exe`. **Building it requires Node.js 22+ on the machine doing the build**
(the app itself still only needs Node 20+ to *run* the non-packaged way above).

**This is the least proven part of the whole project — read this before relying on it.** Three of
this app's dependencies touch native platform code: `koffi` (calls the VoiceMeeter DLL directly),
`screenshot-desktop`, and `systray2` (the tray icon). Bundling native modules into a single exe is
the one part of Node packaging that's genuinely finicky, and none of it has been tested on a real
Windows machine — this environment has no Windows install to verify against. If the packaged exe
fails to start or a specific feature (VoiceMeeter control, screenshots, or the tray icon
specifically) doesn't work once packaged but *does* work under plain `npm start`, that's almost
certainly a pkg asset-bundling issue for that one dependency, not a problem with the feature itself
— check `server/package.json`'s `pkg.assets` list first.

If packaging turns out to be too fragile in practice, the fallback is simple and still much better
than the old setup: ship the `server/` and `client/dist`-built-into-`public/` folders together with
a `.bat` file that runs `node index.js`, plus a note that Node.js needs to be installed once. That
gets you the tray icon and the one-port experience without pkg in the loop at all.
# DecklingAir2.0
