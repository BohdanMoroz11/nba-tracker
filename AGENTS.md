# AGENTS.md

Context for coding agents (and future me). Read this before changing things.

## What this is

A throwaway-but-loved personal project: a "second screen" web app for someone who **doesn't follow the NBA closely** and wants to understand a game while watching it, meaning who the teams are and who the players are. The owner cares mostly about **UI and how understandable it is**, not the tech. Keep it simple, hackable and fun.

Priorities, in order:
1. Rosters for tonight's game: who matters, pics, numbers, stats, injuries, salary, career gist.
2. Team context: identity, goals, last season, news, lore.
3. Live score and box score (nice to have, already in).

Non-goals for now: browsing beyond today's slate, accounts, persistence, deployment, AI.

## Stack

- **Server**: Node + Express, TypeScript run directly with `tsx` (no build step). `server/`
- **Frontend**: React 18 + Vite + Tailwind v4 + TanStack Query. `web/`
- **Shared types**: `shared/types.ts`, the contract between server and UI. Change it first when adding data.
- Hash routing in `web/src/lib.ts` (no router dependency): `#/`, `#/game/:id`, `#/game/:id/p/:playerId`.

Runs on a Hetzner box (CPU only, 62 GB RAM), accessed through an SSH tunnel. Server binds to `127.0.0.1:5180`.

## Layout

```
server/
  index.ts       Express routes: /api/games, /api/game/:id, /api/team/:id, /api/player/:id, /api/health
  espn.ts        ESPN URLs, fetch + in-memory TTL cache, mapLimit concurrency helper
  data.ts        Raw ESPN payloads -> shared types (games, game detail, team, player)
  importance.ts  Heuristic ranking of a roster into star / starter / rotation / bench
shared/types.ts  API response types
data/lore.json   Hand-written team history keyed by ESPN abbreviation (BOS, GS, NY, UTAH, WSH, ...)
web/src/
  lib.ts         Query hooks, hash router, formatting, team-color helpers
  styles.css     Design tokens (Tailwind @theme) and the few custom classes
  components/    GamesPage, GamePage (header + layout), TeamPanel (team strip + fit-to-height roster),
                 TeamModal, PlayerModal, ui (Modal, Segmented, pills...)
docs/data-sources.md  ESPN endpoints we use and what's in them
```

## Data notes

- Source is ESPN's unofficial API. Details and gotchas are in `docs/data-sources.md`. Payloads are huge and loosely typed; `data.ts` uses `any` on purpose and defensive optional chaining. Keep ESPN's shapes out of the frontend.
- ESPN's "season year" is the year the season ends: `2027` == `2026-27`. Use `seasonLabel()`.
- "Last season" for a team = standings for `year-1` + postseason schedule (`seasontype=3`), from which `describePlayoffs()` derives "Lost in East 1st Round to PHI (3-4)".
- Team "outlook" label (`outlookFor`) is a crude guess from last season's record and playoff result. It's labeled as a guess in the UI.
- Player importance (`importance.ts`): minutes + production, blending this season (weight grows to 100% by ~15 games) with last season, plus a small salary term so injured max-contract stars still rank high. Tiers: #1 is always star, #2–3 are stars if ≥85/100, then 2 more starters, 5 rotation, rest bench. Tune freely.
- Cards headline **this season's stats once a player has 8+ games**, otherwise last season's (`headlineLine`).
- Injury details (body part, return date) come from the game summary, not the roster.
- Caching: scoreboard and live summary 15 s, team/news 30 min, roster and player stats 6 h, last-season data 24 h. All in memory, so a restart clears it.

## Design

Direction: "broadcast tale of the tape". Dark arena base (`#0F1622`), each team brings its own color (there's no house accent color). Fonts: **Big Shoulders Display** (names, numbers, scores) + **Figtree** (body), from Google Fonts.

- Jersey numbers are the signature: big display-font numbers in team color on every roster row, and the giant outlined number (`.jersey-ghost`) in the player modal. Don't add more decoration elsewhere.
- Team colors: use `accent()` for text/strokes on dark (handles black teams like BKN/SA) and `tint()` for backgrounds.
- **The game page must fit the viewport with no page scroll.** This is the owner's #1 UI requirement: everything visible at a glance while watching. Detail goes into modals and tabs (team "About" modal, player modal with tabs), never into a longer page.
  - `TeamPanel`'s roster measures its own height (`useHeight`) and `fit()` keeps as many players as fit, in importance order, with fixed row heights per tier (`ROW_H`). Anything left goes behind a "+N more" row that opens a modal. If you change row markup, keep `ROW_H` in sync.
  - Injuries show inline as a pill (or a dot when narrow) on the player row, with details in the tooltip, team modal and player modal.
  - One stats toggle (last season / this season / this game) drives both rosters; it defaults to "this game" once a game has started, otherwise last season until players have ~8 games.
  - Modals may scroll internally as a last resort on phones; desktop sizes are designed to fit.
- **Responsive via container queries** (`@container`, `@4xl:` etc.), not just viewport breakpoints, because the app often lives in a narrow side window. Below `@4xl` the game page shows one team at a time with a switcher; above it, the two teams sit side by side. Check at 1440×820, 1280×720, 480×860 and 390×760.
- Copy: plain sentence case, explain things for a casual fan, no jargon without context.

## Conventions

- Match the existing style: small files, functional components, Tailwind classes inline, minimal comments explaining *why*.
- Run `npm run typecheck` and `npm run build` before committing.
- To eyeball UI: run `npm start`, then screenshot with Playwright at the sizes above and check `document.documentElement.scrollHeight` equals the viewport height on the game page.

## AI (not in v1, here's the research)

- Local Ollama on this box: qwen2.5:7b runs at ~7 tok/s and gets basic facts wrong. The 27B models (qwen3.8:27b, gemma4:26b/31b) would be ~2 tok/s. Usable only for background, cached jobs.
- OpenRouter has free models (`:free` suffix, ~17 listed in Oct 2026). Needs an account and API key; free daily request limits are tight.
- Plan if added: summarize ESPN team/player **news** into "what's going on right now" (grounded in fetched text, never from model memory), cached per day. OpenRouter free model first, Ollama fallback. The key goes in `.env` (gitignored).

## Roadmap / ideas

- AI "storylines" per team and player from news (see above).
- Date picker / browse any team.
- Live play-by-play or a quarter-by-quarter score table (summary endpoint has `plays` for live games).
- Team stats comparison (pace, offense/defense rank) in the matchup header.
- Head-to-head history between the two teams.
- Persisted cache (SQLite) if ESPN gets slow, and a real deploy.
- Keep `data/lore.json` up to date (titles list ends with 2025; ESPN-derived data is always current).
