import type { GameDetail, RecentResult, TeamDetail, TeamStatRow } from "../../../shared/types";
import { accent, ordinal } from "../lib";
import { Term } from "./ui";
import { tip } from "../glossary";

/** Team-vs-team context: preview, stat comparison with league ranks, recent form, odds. */
export function MatchupPanel({ game, away, home }: { game: GameDetail; away?: TeamDetail; home?: TeamDetail }) {
  const ac = accent(game.away.color, game.away.altColor);
  const hc = accent(game.home.color, game.home.altColor);
  const pv = game.preview;
  const season = away?.stats?.season ?? home?.stats?.season;

  return (
    <div className="flex min-h-0 flex-col gap-4 overflow-hidden text-sm">
      {pv?.bottomLine && (
        <div>
          <h3 className="mb-1 font-display text-lg font-bold">Preview</h3>
          <p className="font-medium">{pv.bottomLine}</p>
          {pv.paragraphs.map((p) => (
            <p key={p} className="mt-1.5 line-clamp-3 text-ink/75" data-tip={p} data-tip-overflow>{p}</p>
          ))}
        </div>
      )}

      {(away?.stats || home?.stats) && (
        <div>
          <div className="mb-1 flex items-baseline justify-between">
            <h3 className="font-display text-lg font-bold">Team stats</h3>
            <span className="text-xs text-mute">{season}, <Term k="rank">league rank</Term></span>
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-2 border-b border-line pb-1 text-xs text-mute">
            <span style={{ color: ac }} className="font-semibold">{game.away.abbr}</span>
            <span />
            <span style={{ color: hc }} className="text-right font-semibold">{game.home.abbr}</span>
          </div>
          {(away?.stats?.rows ?? home?.stats?.rows ?? []).map((r) => (
            <CompareRow
              key={r.key}
              label={r.label}
              tipKey={`team.${r.key}`}
              a={away?.stats?.rows.find((x) => x.key === r.key)}
              h={home?.stats?.rows.find((x) => x.key === r.key)}
              lowerIsBetter={r.key === "papg" || r.key === "tov"}
              ac={ac}
              hc={hc}
            />
          ))}
        </div>
      )}

      <div>
        <h3 className="mb-1.5 font-display text-lg font-bold"><Term k="last5">Last 5 games</Term></h3>
        <Form abbr={game.away.abbr} color={ac} games={game.lastFive[game.away.id]} />
        <Form abbr={game.home.abbr} color={hc} games={game.lastFive[game.home.id]} />
        <p className="mt-1 text-xs text-mute">Can include last season's playoffs and preseason early in the year.</p>
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        {game.predictor && <Fact k="Win chance" t="winChance" v={`${game.away.abbr} ${game.predictor.away.toFixed(0)}%, ${game.home.abbr} ${game.predictor.home.toFixed(0)}%`} />}
        {game.odds && <Fact k="Betting line" t="odds" v={game.odds} />}
        {game.overUnder && <Fact k="Expected total points" t="overUnder" v={String(game.overUnder)} />}
        {game.series && <Fact k="Season series" t="series" v={game.series === "0-0" ? "First meeting" : game.series} />}
      </dl>
    </div>
  );
}

function CompareRow({ label, tipKey, a, h, lowerIsBetter, ac, hc }: { label: string; tipKey: string; a?: TeamStatRow; h?: TeamStatRow; lowerIsBetter: boolean; ac: string; hc: string }) {
  const better = a && h && a.value !== h.value ? ((a.value < h.value) === lowerIsBetter ? "a" : "h") : undefined;
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-2 border-b border-line/60 py-1 tnum">
      <span className={better === "a" ? "font-semibold" : "text-ink/70"} style={better === "a" ? { color: ac } : undefined}>
        {a?.display ?? "–"} <Rank r={a?.rank} />
      </span>
      <span className="text-center text-xs text-mute"><Term k={tipKey}>{label}</Term></span>
      <span className={`text-right ${better === "h" ? "font-semibold" : "text-ink/70"}`} style={better === "h" ? { color: hc } : undefined}>
        <Rank r={h?.rank} /> {h?.display ?? "–"}
      </span>
    </div>
  );
}

function Rank({ r }: { r?: number }) {
  if (!r) return null;
  const tone = r <= 5 ? "text-live" : r >= 26 ? "text-out" : "text-mute";
  return <span className={`text-[11px] font-normal ${tone}`}>{ordinal(r)}</span>;
}

function Form({ abbr, color, games = [] }: { abbr: string; color: string; games?: RecentResult[] }) {
  return (
    <div className="mb-1 flex items-center gap-2">
      <span className="w-9 text-xs font-semibold" style={{ color }}>{abbr}</span>
      <div className="flex gap-1">
        {games.map((g) => (
          <span
            key={g.date}
            data-tip={`${g.result === "W" ? "Won" : "Lost"} ${g.atVs} ${g.opponent} ${g.score}, ${new Date(g.date).toLocaleDateString([], { month: "short", day: "numeric" })}`}
            className={`grid h-6 w-11 place-items-center rounded text-[11px] font-semibold ${g.result === "W" ? "bg-live/15 text-live" : "bg-out/15 text-out"}`}
          >
            {g.result} {g.opponent}
          </span>
        ))}
        {!games.length && <span className="text-xs text-mute">No games yet</span>}
      </div>
    </div>
  );
}

function Fact({ k, v, t }: { k: string; v: string; t: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-mute"><span className="explain" {...tip(t)}>{k}</span></dt>
      <dd className="font-medium">{v}</dd>
    </div>
  );
}
