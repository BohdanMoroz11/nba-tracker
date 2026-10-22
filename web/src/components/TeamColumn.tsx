import { useState } from "react";
import type { GameDetail, Injury, TeamDetail } from "../../../shared/types";
import { accent, ordinal } from "../lib";
import { Roster } from "./Roster";
import { InjuryPill, SectionTitle } from "./ui";

export function TeamColumn({ team, game }: { team: TeamDetail; game: GameDetail }) {
  const color = accent(team.team.color, team.team.altColor);
  const injuries = game.injuries[team.team.id] ?? [];
  return (
    <section style={{ ["--team" as string]: color }} className="space-y-8 @container">
      <TeamIntro team={team} color={color} />
      {injuries.length > 0 && <InjuryReport injuries={injuries} gameId={game.id} />}
      <Roster team={team} game={game} color={color} />
      {team.news.length > 0 && <News team={team} />}
    </section>
  );
}

function TeamIntro({ team, color }: { team: TeamDetail; color: string }) {
  const [open, setOpen] = useState(false);
  const lore = team.lore;
  const ls = team.lastSeason;
  const lastTitle = lore?.titles.at(-1);
  const facts: [string, string | undefined][] = [
    ["This season", [team.record, team.streak && `(${team.streak})`].filter(Boolean).join(" ")],
    ["Standing", team.standing],
    [`Last season (${ls?.season ?? ""})`, ls?.record && `${ls.record}${ls.seed ? `, ${ordinal(ls.seed)} seed` : ""}`],
    ["Playoffs", ls?.playoffs],
    ["Coach", team.coach],
    ["Titles", lore && (lore.titles.length ? `${lore.titles.length} (last in ${lastTitle})` : "None yet")],
  ];

  return (
    <div>
      <div className="flex items-start gap-4">
        <img src={team.team.logo} alt="" className="size-16 shrink-0" />
        <div className="min-w-0">
          <h2 className="font-display text-4xl font-black leading-none">{team.team.displayName}</h2>
          {lore && <p className="mt-1 text-lg italic text-ink/85">{lore.nickname}</p>}
          <p className="mt-2">
            <span className="rounded-full px-2.5 py-0.5 text-sm font-semibold text-court" style={{ background: color }}>
              {team.outlook.label}
            </span>
            <span className="ml-2 text-xs text-mute">rough guess from last season</span>
          </p>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-line bg-panel p-4 @lg:grid-cols-3">
        {facts
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k} className="min-w-0">
              <dt className="text-xs text-mute">{k}</dt>
              <dd className="font-medium leading-snug">{v}</dd>
            </div>
          ))}
      </dl>

      {lore && (
        <div className="mt-4 max-w-prose">
          <p className="leading-relaxed text-ink/90">{lore.identity}</p>
          <button onClick={() => setOpen(!open)} aria-expanded={open} className="mt-2 text-sm font-semibold hover:underline" style={{ color }}>
            {open ? "Hide legends and history" : "Show legends and history"}
          </button>
          {open && (
            <dl className="mt-3 space-y-2 text-sm">
              <Row k="Legends" v={lore.legends.join(", ")} />
              <Row k="Rivals" v={lore.rivals.join(", ")} />
              <Row k="Championships" v={lore.titles.join(", ") || "None"} />
              <Row k="Founded" v={`${lore.founded}${lore.formerly ? `, formerly ${lore.formerly}` : ""}`} />
              <Row k="Arena" v={lore.arena} />
            </dl>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-2">
      <dt className="text-mute">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}

function InjuryReport({ injuries, gameId }: { injuries: Injury[]; gameId: string }) {
  return (
    <div>
      <SectionTitle aside="for this game">Injury report</SectionTitle>
      <ul className="divide-y divide-line">
        {injuries.map((i) => (
          <li key={i.athleteId}>
            <a href={`#/game/${gameId}/p/${i.athleteId}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 hover:bg-panel">
              <span className="font-semibold">{i.name}</span>
              <InjuryPill status={i.status} />
              <span className="text-sm text-mute">
                {[i.side, i.type, i.detail?.toLowerCase()].filter(Boolean).join(" ")}
                {i.returnDate && `, expected back ${new Date(i.returnDate).toLocaleDateString([], { month: "short", day: "numeric" })}`}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function News({ team }: { team: TeamDetail }) {
  return (
    <div>
      <SectionTitle aside="ESPN">Latest news</SectionTitle>
      <ul className="space-y-3">
        {team.news.slice(0, 6).map((n) => (
          <li key={n.headline}>
            <a href={n.url} target="_blank" rel="noreferrer" className="group block">
              <div className="font-semibold leading-snug group-hover:underline">{n.headline}</div>
              <div className="mt-0.5 line-clamp-2 text-sm text-mute">
                {n.published && <time>{new Date(n.published).toLocaleDateString([], { month: "short", day: "numeric" })}: </time>}
                {n.description}
              </div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
