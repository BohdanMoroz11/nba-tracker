# Courtside

A personal second-screen app for watching NBA games. Pick tonight's game and see:

- **Matchup header**: score or tip-off time in your timezone, live status, ESPN's win probability, betting favorite, season series, TV channel, arena.
- **Team primer** (each side): one-line identity, a rough "what are they aiming for" label, this season's record and standing, last season's record, seed and playoff result, coach, titles, a short history paragraph with legends and rivals, and the latest ESPN headlines.
- **Injury report** for the game: who's out or day-to-day, what the injury is, expected return.
- **Roster ranked by importance**: stars get big cards, key players medium cards, the rest a compact list. Each player shows number, headshot, position, per-game stats, salary and injury status. During and after a game, each player's line from that game shows up too.
- **Player sheet** (click anyone): bio, draft, contract, honors, career path across teams, season-by-season stats, recent games, the latest Rotowire note and news.

Works from a narrow side window up to full screen.

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
- The team history text (`data/lore.json`) is hand-written and static.

## Ideas for later

See [AGENTS.md](AGENTS.md#roadmap--ideas).
