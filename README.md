# Courtside

> ⚡ Vibe coded: agents wrote it, I steered and vibe-checked some code. Maintained to the standard of "works on my machine". Pure vibes.

A personal second-screen app for watching NBA games. Pick tonight's game and get a one-screen dashboard (no scrolling) with:

- **Header**: score or tip-off time in your timezone, live status (refreshes every 15 s, changed numbers glow briefly, "updated Xs ago"), ESPN's win probability, betting favorite, season series.
- **Hover explainers** on every stat and term (what PTS, pace or the betting line mean, and what counts as good), plus tooltips showing the full text of anything cut off.
- **Each team side by side**: name, a rough "what are they aiming for" label, record and standing, head coach (career record on hover), last season's record and playoff result. **About** opens a modal with facts, a short history, legends and rivals, news and the injury report.
- **Full roster ranked by importance**, grouped into stars, key players, rotation and bench, with jersey number, headshot, minutes, points, rebounds, assists, salary and injury status. One toggle switches every row between last season, this season and this game's box score (live during the game).
- **Matchup**: the game preview, a team-vs-team stat comparison with league ranks, each team's last 5 games and the odds. It's a middle column on wide screens, a button on medium ones, and a tab on narrow ones.
- **Honors and the latest note** next to players ("4× MVP, 21× All-NBA", last game's line from Rotowire). More stat columns (GP, FG%, 3P%, STL, BLK) appear as the window gets wider.
- **Player modal** (click anyone), with tabs: overview (bio, contract, injury detail, latest Rotowire note, honors, career path), season-by-season stats, recent games and news.

Works from a narrow side window (one team at a time, with a switcher) up to full screen.

## Run it

Needs Node 22+ (developed on Node 24).

```bash
npm install
npm start          # builds the frontend, serves everything on http://127.0.0.1:5180
```

The server binds to `127.0.0.1` only. From your own machine, tunnel to it:

```bash
ssh -L 5180:127.0.0.1:5180 <server>
# then open http://localhost:5180
```

Development (hot reload for UI and API):

```bash
npm run dev        # Vite on :5173 (proxies /api to :5180), API on :5180 with tsx watch
```

Tunnel `5173` instead when using dev mode. `PORT` and `HOST` env vars override the API server address.

Other scripts: `npm run typecheck`, `npm run build`.

## How it works

- Data comes from ESPN's public JSON API (no key, unofficial). NBA.com's stats API blocks datacenter IPs, so it's not used. See [docs/data-sources.md](docs/data-sources.md).
- A small Express server fetches from ESPN, caches in memory and returns compact JSON. The browser never talks to ESPN directly, except for images.
- Nothing is stored on disk. Data is fetched when you open a game (about 20 requests per team the first time, then cached).
- Heights and weights are shown in cm and kg.
- The team history text (`data/lore.json`) is hand-written and static.

## Ideas for later

See [AGENTS.md](AGENTS.md#roadmap--ideas).
