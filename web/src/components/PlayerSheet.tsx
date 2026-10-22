import { useEffect } from "react";
import type { GameDetail, Injury, RosterPlayer, StatLine, TeamDetail } from "../../../shared/types";
import { accent, money, one, tierLabel, tint, usePlayer } from "../lib";
import { ErrorNote, Headshot, InjuryPill, SectionTitle, Spinner } from "./ui";

interface Props {
  playerId: string;
  game: GameDetail;
  teams: (TeamDetail | undefined)[];
  onClose: () => void;
}

export function PlayerSheet({ playerId, game, teams, onClose }: Props) {
  const { data: p, isLoading, error } = usePlayer(playerId);

  // Roster entry (contract, importance) and game injury detail come from data we already have.
  const team = teams.find((t) => t?.roster.some((r) => r.id === playerId));
  const rp = team?.roster.find((r) => r.id === playerId);
  const injury = Object.values(game.injuries).flat().find((i) => i.athleteId === playerId);
  const color = team ? accent(team.team.color, team.team.altColor) : "#aab4c3";
  const bg = team ? tint(team.team.color) : "#2a3240";
  const box = game.state !== "pre" ? game.box[playerId] : undefined;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={p?.name ?? "Player"}>
      <button className="absolute inset-0 bg-black/60" onClick={onClose} aria-label="Close player" />
      <aside className="sheet-in relative h-full w-full max-w-[600px] overflow-y-auto bg-court shadow-2xl @container" style={{ ["--team" as string]: color }}>
        <button onClick={onClose} className="absolute right-3 top-3 z-10 rounded-full bg-black/50 px-3 py-1 text-sm hover:bg-black/70">
          Close
        </button>
        {isLoading && <div className="p-6"><Spinner label="Loading player" /></div>}
        {error && <div className="p-6"><ErrorNote error={error} what="this player" /></div>}
        {p && (
          <>
            <div className="relative h-[260px] overflow-hidden" style={{ background: `linear-gradient(160deg, ${bg}, ${bg}66 60%, #0f1622)` }}>
              {p.jersey && (
                <span className="jersey-ghost absolute -left-2 -top-6 text-[16rem]" style={{ ["--team" as string]: "#fff" }} aria-hidden>
                  {p.jersey}
                </span>
              )}
              <Headshot src={p.headshot} name={p.name} className="absolute bottom-0 right-2 h-[240px] w-[330px] max-w-[58%] object-contain object-bottom" />
              <div className="absolute bottom-0 left-0 p-5">
                <h2 className="font-display text-5xl font-black uppercase leading-[0.9] drop-shadow">
                  {p.name.split(" ").map((w, i) => (
                    <span key={i} className="block">{w}</span>
                  ))}
                </h2>
                <div className="mt-2 text-sm text-ink/85 drop-shadow">
                  #{p.jersey} {p.position}, {p.team?.name}
                </div>
              </div>
            </div>

            <div className="space-y-7 p-5">
              <div className="flex flex-wrap items-center gap-2">
                {rp && <span className="rounded-full px-2.5 py-0.5 text-sm font-semibold text-court" style={{ background: color }}>{tierLabel[rp.tier]}</span>}
                {rp && <span className="text-sm text-mute">importance {rp.importance}/100 on this roster</span>}
                <InjuryPill status={injury?.status ?? rp?.injuryStatus} />
              </div>

              {injury && <InjuryDetail injury={injury} />}

              {box && (
                <div className="rounded-xl border border-live/40 bg-live/10 p-3 text-sm tnum">
                  {box.didNotPlay ? "Didn't play tonight." : (
                    <>
                      <b className="text-live">Tonight</b> {box.pts} pts, {box.reb} reb, {box.ast} ast, FG {box.fg}, 3PT {box.threes}, {box.min} min, {box.plusMinus} +/-
                      {box.starter ? ", started" : ", off the bench"}
                    </>
                  )}
                </div>
              )}

              <Facts p={p} rp={rp} />

              {p.latestNote && (
                <div>
                  <SectionTitle aside="Rotowire">Latest</SectionTitle>
                  <p className="font-medium">{p.latestNote.headline}</p>
                  {p.latestNote.story && <p className="mt-2 text-sm leading-relaxed text-ink/80">{p.latestNote.story}</p>}
                </div>
              )}

              {p.awards.length > 0 && (
                <div>
                  <SectionTitle>Honors</SectionTitle>
                  <ul className="flex flex-wrap gap-2">
                    {p.awards.map((a) => (
                      <li key={a.name} className="rounded-lg border border-line bg-panel px-2.5 py-1 text-sm" title={a.seasons.join(", ")}>
                        <b className="tnum">{a.count}</b> {a.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {p.teamsPath.length > 0 && (
                <div>
                  <SectionTitle>Career path</SectionTitle>
                  <ol className="flex flex-wrap items-center gap-1.5 text-sm">
                    {p.teamsPath.map((t, i) => (
                      <li key={`${t}-${i}`} className="flex items-center gap-1.5">
                        {i > 0 && <span className="text-mute" aria-hidden>›</span>}
                        <span className="rounded bg-panel px-2 py-0.5 font-semibold">{t.toUpperCase()}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {p.seasons.length > 0 && <SeasonTable seasons={p.seasons} career={p.career} />}

              {p.recentGames.length > 0 && (
                <div>
                  <SectionTitle>Recent games</SectionTitle>
                  <table className="w-full text-sm tnum">
                    <thead className="text-xs text-mute">
                      <tr className="text-left">
                        <th className="py-1 font-normal">Date</th><th className="font-normal">Opp</th><th className="font-normal">Result</th>
                        <th className="text-right font-normal">MIN</th><th className="text-right font-normal">PTS</th><th className="text-right font-normal">REB</th><th className="text-right font-normal">AST</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {p.recentGames.map((g) => (
                        <tr key={g.date}>
                          <td className="py-1.5">{new Date(g.date).toLocaleDateString([], { month: "short", day: "numeric" })}</td>
                          <td>{g.atVs} {g.opponent}</td>
                          <td className={g.result === "W" ? "text-live" : "text-out"}>{g.result} {g.score}</td>
                          <td className="text-right">{g.min}</td><td className="text-right font-semibold">{g.pts}</td><td className="text-right">{g.reb}</td><td className="text-right">{g.ast}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {p.news.length > 0 && (
                <div>
                  <SectionTitle aside="ESPN">In the news</SectionTitle>
                  <ul className="space-y-2">
                    {p.news.map((n) => (
                      <li key={n.headline}>
                        <a href={n.url} target="_blank" rel="noreferrer" className="font-medium hover:underline">{n.headline}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

function InjuryDetail({ injury }: { injury: Injury }) {
  const what = [injury.side, injury.type, injury.detail?.toLowerCase()].filter(Boolean).join(" ");
  return (
    <div className="rounded-xl border border-out/30 bg-out/10 p-3 text-sm">
      <b>{injury.status}</b>
      {what && `: ${what}`}
      {injury.returnDate && `. Expected back around ${new Date(injury.returnDate).toLocaleDateString([], { month: "long", day: "numeric" })}.`}
    </div>
  );
}

function Facts({ p, rp }: { p: NonNullable<ReturnType<typeof usePlayer>["data"]>; rp?: RosterPlayer }) {
  const contract = rp?.salary
    ? `${money(rp.salary)} this season${rp.contractYearsLeft ? `, ${rp.contractYearsLeft} more yr${rp.contractYearsLeft > 1 ? "s" : ""} after` : ""}`
    : undefined;
  const items: [string, string | number | undefined][] = [
    ["Age", p.age && `${p.age}${p.dob ? ` (born ${p.dob})` : ""}`],
    ["Height and weight", [p.height, p.weight].filter(Boolean).join(", ")],
    ["From", [p.birthPlace, p.citizenship && p.citizenship !== "USA" && !p.birthPlace?.includes(p.citizenship) ? p.citizenship : undefined].filter(Boolean).join(", ")],
    ["College", p.college],
    ["Draft", p.draft ?? "Undrafted"],
    ["Experience", p.experience],
    ["Contract", contract],
  ];
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
      {items.filter(([, v]) => v).map(([k, v]) => (
        <div key={k}>
          <dt className="text-xs text-mute">{k}</dt>
          <dd className="font-medium">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function SeasonTable({ seasons, career }: { seasons: StatLine[]; career?: StatLine }) {
  const rows = [...seasons].reverse();
  const cols: [string, (s: StatLine) => string][] = [
    ["GP", (s) => String(s.gp)],
    ["MIN", (s) => one(s.min)],
    ["PTS", (s) => one(s.pts)],
    ["REB", (s) => one(s.reb)],
    ["AST", (s) => one(s.ast)],
    ["FG%", (s) => one(s.fgPct)],
    ["3P%", (s) => one(s.threePct)],
  ];
  return (
    <div>
      <SectionTitle aside="per game">Season by season</SectionTitle>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[440px] text-sm tnum">
          <thead className="text-xs text-mute">
            <tr>
              <th className="py-1 text-left font-normal">Season</th>
              {cols.map(([c]) => <th key={c} className="text-right font-normal">{c}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((s, i) => (
              <tr key={`${s.season}-${s.team}-${i}`}>
                <td className="py-1.5">{s.season} <span className="text-xs text-mute">{s.team?.toUpperCase()}</span></td>
                {cols.map(([c, f]) => <td key={c} className={`text-right ${c === "PTS" ? "font-semibold" : ""}`}>{f(s)}</td>)}
              </tr>
            ))}
            {career && (
              <tr className="border-t-2 border-line font-semibold">
                <td className="py-1.5">Career</td>
                {cols.map(([c, f]) => <td key={c} className="text-right">{f(career)}</td>)}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
