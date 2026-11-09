# Mars Outpost Survival

A 15-day survival and resource-management browser game for kids aged 7–12, by Team Rocket.

> **New here, or using an AI tool?** Start with [AGENTS.md](AGENTS.md).

## Run it

You need [Node.js](https://nodejs.org) (LTS version).

```sh
npm install      # first time only
npm run dev      # opens a local server, usually http://localhost:5173
```

Other commands:

| Command | What it does |
|---|---|
| `npm run typecheck` | Checks the TypeScript for mistakes |
| `npm run build` | Builds the finished game into `dist/` (upload this folder to host it) |
| `npm run preview` | Plays the built version locally |

**Windows tip:** if `npm run dev` fails with "is not recognized as an internal or external command", your folder path probably contains a `&` (e.g. `extracurriculars&certs`). Rename or move the folder so the path has no `&`, or run the tools directly: `node node_modules/vite/bin/vite.js` and `node node_modules/typescript/bin/tsc`.

## Current state: clickable prototype

- Every screen from [docs/screen-flow.md](docs/screen-flow.md) exists as a grey box.
- The game runs on a **fake engine** ([src/fake-engine/](src/fake-engine/)) with rough numbers, so the flow can be clicked through before the real engine exists. Don't balance anything there.
- Grey dashed boxes are image placeholders, at the exact sizes in [docs/asset-list.md](docs/asset-list.md). Drop real art into `public/assets/` and it appears automatically.

### Debug tools

Press the **`** key (top-left of the keyboard), or open the game with `?debug` at the end of the URL. You can jump to hazard days, the final day, max out stats, or nearly die, to test every screen quickly.
