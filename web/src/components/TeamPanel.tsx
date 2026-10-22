import { useState } from "react";
import type { BoxLine, GameDetail, Injury, RosterPlayer, StatLine, TeamDetail, Tier } from "../../../shared/types";
import { accent, injuryTone, money, one, tint, useHeight, type StatMode } from "../lib";
import { TeamModal } from "./TeamModal";
import { Headshot, InjuryPill, Modal } from "./ui";

interface Props {
  team: TeamDetail;
  game: GameDetail;
  mode: StatMode;
}

export function TeamPanel({ team, game, mode }: Props) {
  const color = accent(team.team.color, team.team.altColor);
  const bg = tint(team.team.color);
  const [about, setAbout] = useState(false);
  const injuries = game.injuries[team.team.id] ?? [];
  const ls = team.lastSeason;

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-line bg-panel @container" style={{ ["--team" as string]: color }}>
      <div className="flex shrink-0 items-center gap-3 border-b border-line px-3 py-2" style={{ background: `linear-gradient(90deg, ${bg}66, transparent 70%)` }}>
        <img src={team.team.logo} alt="" className="size-10 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="truncate font-display text-2xl font-black leading-tight">{team.team.displayName}</h2>
            <span className="hidden shrink-0 rounded-full px-2 py-px text-xs font-semibold text-court @md:inline" style={{ background: color }} title={team.outlook.reason}>
              {team.outlook.label}
            </span>
          </div>
          <p className="truncate text-xs text-mute" title={`${team.standing ?? ""}. Last season: ${ls?.record ?? ""}, ${ls?.playoffs ?? ""}`}>
            <span className="text-ink">{team.record}</span>
            {team.standing && `, ${team.standing.replace(" Division", "")}`}
            {ls?.record && (
              <>
                <span className="text-ink/40"> | </span>
                last season <span className="text-ink">{ls.record}</span>, {ls.playoffs?.replace(/^Lost in /, "out in ")}
              </>
            )}
          </p>
        </div>
        <button onClick={() => setAbout(true)} className="shrink-0 rounded-lg border border-line px-2.5 py-1 text-sm font-medium hover:bg-panel-2">
          About
        </button>
      </div>

      <RosterTable team={team} game={game} mode={mode} injuries={injuries} color={color} bg={bg} />

      {about && <TeamModal team={team} injuries={injuries} onClose={() => setAbout(false)} />}
    </section>
  );
}

// ---------- roster that fits its box ----------

const ROW_H: Record<Tier, number> = { star: 48, starter: 34, rotation: 29, bench: 29 };
const GROUP_H = 18;
const HEAD_H = 22;
const MORE_H = 30;
const GROUPS: [Tier, string][] = [
  ["star", "Stars"],
  ["starter", "Key players"],
  ["rotation", "Rotation"],
  ["bench", "Bench"],
];

/** Greedily keep the most important players that fit; the rest go behind a "more" button. */
function fit(roster: RosterPlayer[], height: number) {
  const budget = height - HEAD_H;
  const visible: RosterPlayer[] = [];
  let used = 0;
  let lastTier: Tier | undefined;
  for (let i = 0; i < roster.length; i++) {
    const p = roster[i];
    const cost = ROW_H[p.tier] + (p.tier !== lastTier ? GROUP_H : 0);
    const reserve = i < roster.length - 1 ? MORE_H : 0;
    if (used + cost + reserve > budget) break;
    visible.push(p);
    used += cost;
    lastTier = p.tier;
  }
  const hidden = roster.slice(visible.length);
  // Spare room: let rows breathe a little instead of leaving a gap at the bottom.
  const scale = hidden.length ? 1 : Math.min(1.35, Math.max(1, budget / Math.max(used, 1)));
  return { visible, hidden, scale };
}

interface TableProps {
  team: TeamDetail;
  game: GameDetail;
  mode: StatMode;
  injuries: Injury[];
  color: string;
  bg: string;
}

const GRID =
  "grid items-center gap-x-2 grid-cols-[1.75rem_2rem_minmax(0,1fr)_repeat(3,2.2rem)] @md:grid-cols-[2.25rem_2.5rem_minmax(0,1fr)_repeat(4,2.4rem)] @xl:grid-cols-[2.5rem_2.5rem_minmax(0,1fr)_repeat(4,2.6rem)_3.75rem]";

function RosterTable({ team, game, mode, injuries, color, bg }: TableProps) {
  const [ref, height] = useHeight<HTMLDivElement>();
  const [showMore, setShowMore] = useState(false);
  const { visible, hidden, scale } = fit(team.roster, height);
  const injuryOf = (id: string) => injuries.find((i) => i.athleteId === id);
  const row = (p: RosterPlayer, s: number) => (
    <PlayerRow key={p.id} p={p} game={game} mode={mode} injury={injuryOf(p.id)} color={color} bg={bg} height={ROW_H[p.tier] * s} />
  );

  return (
    <div ref={ref} className="min-h-0 flex-1 overflow-hidden px-1">
      {height > 0 && (
        <>
          <div className={`${GRID} px-2 text-[11px] text-mute`} style={{ height: HEAD_H }}>
            <span className="text-right">#</span>
            <span />
            <span>Player</span>
            <span className="hidden text-right @md:block">MIN</span>
            <span className="text-right">PTS</span>
            <span className="text-right">REB</span>
            <span className="text-right">AST</span>
            <span className="hidden text-right @xl:block">Salary</span>
          </div>
          {GROUPS.map(([tier, label]) => {
            const ps = visible.filter((p) => p.tier === tier);
            if (!ps.length) return null;
            return (
              <div key={tier}>
                <div className="flex items-end border-t border-line px-2 pb-0.5 text-[11px] font-semibold text-mute" style={{ height: GROUP_H }}>
                  {label}
                </div>
                {ps.map((p) => row(p, scale))}
              </div>
            );
          })}
          {hidden.length > 0 && (
            <button
              onClick={() => setShowMore(true)}
              className="w-full truncate rounded-md border-t border-line px-2 text-left text-sm text-mute hover:bg-panel-2 hover:text-ink"
              style={{ height: MORE_H }}
            >
              + {hidden.length} more {hidden.length === 1 ? "player" : "players"} ({hidden.map((p) => p.lastName).join(", ")})
            </button>
          )}
        </>
      )}
      {showMore && (
        <Modal label={`More ${team.team.name} players`} onClose={() => setShowMore(false)} className="@container sm:w-[min(640px,94vw)]">
          <div className="p-4 pt-12">
            <h2 className="mb-2 font-display text-2xl font-black">More {team.team.name} players</h2>
            <div onClick={() => setShowMore(false)}>{hidden.map((p) => row(p, 1))}</div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function statCells(mode: StatMode, p: RosterPlayer, box?: BoxLine): { min: string; pts: string; reb: string; ast: string; note?: string } {
  if (mode === "tonight") {
    if (!box) return { min: "", pts: "–", reb: "", ast: "" };
    if (box.didNotPlay) return { min: "", pts: "", reb: "", ast: "", note: "Didn't play" };
    return { min: box.min, pts: box.pts, reb: box.reb, ast: box.ast };
  }
  const s: StatLine | undefined = mode === "current" ? p.current : p.last;
  if (!s) return { min: "", pts: "–", reb: "", ast: "", note: mode === "last" && p.experience <= 1 ? "Rookie" : undefined };
  return { min: one(s.min), pts: one(s.pts), reb: one(s.reb), ast: one(s.ast) };
}

interface RowProps {
  p: RosterPlayer;
  game: GameDetail;
  mode: StatMode;
  injury?: Injury;
  color: string;
  bg: string;
  height: number;
}

function PlayerRow({ p, game, mode, injury, color, bg, height }: RowProps) {
  const star = p.tier === "star";
  const box = game.box[p.id];
  const c = statCells(mode, p, box);
  const status = injury?.status ?? p.injuryStatus;
  const injuryText = injury && [injury.status, [injury.side, injury.type, injury.detail?.toLowerCase()].filter(Boolean).join(" ")].filter(Boolean).join(": ");
  const big = star ? "font-display text-lg font-bold @md:text-xl" : "text-sm";

  return (
    <a
      href={`#/game/${game.id}/p/${p.id}`}
      className={`${GRID} rounded-md px-2 hover:bg-panel-2`}
      style={{ height, background: star ? `linear-gradient(90deg, ${bg}55, transparent 75%)` : undefined }}
    >
      <span className={`text-right font-display font-black leading-none ${star ? "text-3xl" : "text-xl"}`} style={{ color }}>
        {p.jersey}
      </span>
      <Headshot src={p.headshot} name={p.name} className={star ? "size-10 rounded-md bg-panel-2" : "size-8 rounded-full bg-panel-2"} />
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className={`truncate ${star ? "font-display text-xl font-extrabold" : "font-medium"}`}>
            <span className="@md:hidden">{p.firstName?.[0]}. {p.lastName}</span>
            <span className="hidden @md:inline">{p.name}</span>
          </span>
          {!star && <span className="hidden shrink-0 text-xs text-mute @lg:inline">{p.position}</span>}
          {status && (
            <span className="shrink-0" title={injuryText || status}>
              <span className="hidden @lg:inline"><InjuryPill status={status} small /></span>
              <span className={`inline-block size-2 rounded-full @lg:hidden ${injuryTone(status) === "out" ? "bg-out" : "bg-doubt"}`} aria-label={status} />
            </span>
          )}
          {c.note && <span className="shrink-0 text-xs text-mute">{c.note}</span>}
        </div>
        {star && (
          <div className="truncate text-xs text-ink/70">
            {p.positionName}, {p.age}, {p.experience ? `${p.experience} yrs in NBA` : "rookie"}
          </div>
        )}
      </div>
      <span className={`hidden text-right tnum text-mute @md:block ${star ? "text-sm" : "text-sm"}`}>{c.min}</span>
      <span className={`text-right tnum font-semibold ${big}`}>{c.pts}</span>
      <span className={`text-right tnum ${big}`}>{c.reb}</span>
      <span className={`text-right tnum ${big}`}>{c.ast}</span>
      <span className="hidden text-right text-xs tnum text-mute @xl:block">{money(p.salary) ?? ""}</span>
    </a>
  );
}
