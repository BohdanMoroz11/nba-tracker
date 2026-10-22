# Data sources

Everything comes from ESPN's public, keyless, **unofficial** JSON API. It can change without notice. If something breaks, `curl` the URL and look at the shape. All URLs live in `server/espn.ts`.

NBA.com (`stats.nba.com`, `cdn.nba.com`) was tested and is **blocked from the Hetzner box** (timeout / 403). Don't bother unless running from a residential IP.

Base: `https://site.api.espn.com/apis/site/v2/sports/basketball/nba`

| Endpoint | Used for |
|---|---|
| `/scoreboard[?dates=YYYYMMDD]` | Game list. Default = ESPN's "today" (US time). Status, scores, records, broadcasts, odds. |
| `/summary?event={id}` | Game page. `header` (status/score), `boxscore.players` (live/final player lines), `injuries` (with body part and return date), `predictor` (win %), `pickcenter` (odds, over/under), `seasonseries`, `article` (preview). Also has `lastFiveGames`, `leaders`, `standings`, `winprobability` and, for live games, play-by-play; none of those are used yet. |
| `/teams/{id}` | Team colors, logos, current record, `standingSummary`. |
| `/teams/{id}/roster` | Players: headshot URL, jersey, position, age, height/weight, college, experience, **contract** (salary, years remaining), injury status. Also `coach`, `season.year`. |
| `/teams/{id}/schedule?season={year}&seasontype=3` | Postseason games, used to derive how far a team went last year. |
| `/news?team={id}&limit=8` | Team news. |

Standings: `https://site.api.espn.com/apis/v2/sports/basketball/nba/standings[?season={year}]`. Conference groups, each entry has `overall`, `playoffSeed`, `streak`, etc.

Athletes: `https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/{id}`

| Path | Used for |
|---|---|
| `` (none) | Bio: DOB, birthplace, draft (`displayDraft`), debut year, experience. |
| `/stats` | Per-season averages with team (`categories[name=averages]`, plus `totals` for career). Missing `categories` for players with no NBA games. |
| `/overview` | `awards`, `rotowire` (latest note), `gameLog` (recent games), `news`, `nextGame`. |
| `/gamelog` | Full game log (not used, large). |

Images: headshots `https://a.espncdn.com/i/headshots/nba/players/full/{id}.png`, logos `https://a.espncdn.com/i/teamlogos/nba/500/{abbr}.png`.

Team IDs / abbreviations (ESPN): ATL 1, BOS 2, NO 3, CHI 4, CLE 5, DAL 6, DEN 7, DET 8, GS 9, HOU 10, IND 11, LAC 12, LAL 13, MIA 14, MIL 15, MIN 16, BKN 17, NY 18, ORL 19, PHI 20, PHX 21, POR 22, SAC 23, SA 24, OKC 25, UTAH 26, WSH 27, TOR 28, MEM 29, CHA 30.
