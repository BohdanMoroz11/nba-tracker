import { useState } from "react";
import type { Coach, Injury, TeamDetail } from "../../../shared/types";
import { accent, ordinal, tint } from "../lib";
import { Headshot, InjuryPill, Modal, Segmented } from "./ui";
import { statusMeaning, tip } from "../glossary";

type Tab = "about" | "history" | "news" | "injuries";

export function TeamModal({ team, injuries, onClose }: { team: TeamDetail; injuries: Injury[]; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("about");
  const color = accent(team.team.color, team.team.altColor);
  const lore = team.lore;
  const tabs: { value: Tab; label: string }[] = [
    { value: "about", label: "About" },
    ...(lore ? [{ value: "history" as const, label: "History" }] : []),
    ...(team.news.length ? [{ value: "news" as const, label: "News" }] : []),
    ...(injuries.length ? [{ value: "injuries" as const, label: `Injuries (${injuries.length})` }] : []),
  ];

  return (
    <Modal label={team.team.displayName} onClose={onClose} className="sm:h-[min(620px,90dvh)] sm:w-[min(760px,94vw)]">
      <div className="shrink-0 px-5 pb-3 pt-5" style={{ background: `linear-gradient(120deg, ${tint(team.team.color)}, transparent 80%)` }}>
        <div className="flex items-center gap-4 pr-16">
          <img src={team.team.logo} alt="" className="size-14" />
          <div className="min-w-0">
            <h2 className="font-display text-3xl font-black leading-none">{team.team.displayName}</h2>
            {lore && <p className="mt-1 italic text-ink/85">{lore.nickname}</p>}
          </div>
        </div>
        <Segmented className="mt-4" value={tab} onChange={setTab} options={tabs} />
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-5 py-4">
        {tab === "about" && (
          <div className="space-y-4">
            <p>
              <span className="rounded-full px-2.5 py-0.5 text-sm font-semibold text-court" style={{ background: color }}>{team.outlook.label}</span>
              <span className="ml-2 text-sm text-mute">Rough guess. {team.outlook.reason}</span>
            </p>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
              <Fact k="This season" t="record" v={[team.record, team.streak && `(${team.streak})`].filter(Boolean).join(" ")} />
              <Fact k="Standing" t="standing" v={team.standing} />
              <Fact k={`Last season (${team.lastSeason?.season ?? ""})`} v={team.lastSeason?.record && `${team.lastSeason.record}${team.lastSeason.seed ? `, ${ordinal(team.lastSeason.seed)} seed` : ""}`} />
              <Fact k="Playoffs" v={team.lastSeason?.playoffs} />
              <Fact k="Titles" v={lore && (lore.titles.length ? `${lore.titles.length} (last in ${lore.titles.at(-1)})` : "None yet")} />
            </dl>
            {team.coach && <CoachCard coach={team.coach} />}
            {lore && <p className="max-w-prose leading-relaxed text-ink/90">{lore.identity}</p>}
          </div>
        )}

        {tab === "history" && lore && (
          <dl className="space-y-3">
            <Line k="Legends" v={lore.legends.join(", ")} />
            <Line k="Rivals" v={lore.rivals.join(", ")} />
            <Line k="Championships" v={lore.titles.join(", ") || "None yet"} />
            <Line k="Founded" v={`${lore.founded}${lore.formerly ? `, formerly ${lore.formerly}` : ""}`} />
            <Line k="Arena" v={lore.arena} />
          </dl>
        )}

        {tab === "news" && (
          <ul className="space-y-3">
            {team.news.slice(0, 6).map((n) => (
              <li key={n.headline}>
                <a href={n.url} target="_blank" rel="noreferrer" className="group block">
                  <div className="font-semibold leading-snug group-hover:underline">{n.headline}</div>
                  <div className="line-clamp-1 text-sm text-mute" data-tip={n.description} data-tip-overflow>
                    {n.published && `${new Date(n.published).toLocaleDateString([], { month: "short", day: "numeric" })}: `}
                    {n.description}
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}

        {tab === "injuries" && (
          <ul className="divide-y divide-line">
            {injuries.map((i) => (
              <li key={i.athleteId} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                <span className="font-semibold">{i.name}</span>
                <span data-tip-title={i.status} data-tip={statusMeaning(i.status)}><InjuryPill status={i.status} /></span>
                <span className="text-sm text-mute">
                  {[i.side, i.type, i.detail?.toLowerCase()].filter(Boolean).join(" ")}
                  {i.returnDate && `, expected back ${new Date(i.returnDate).toLocaleDateString([], { month: "short", day: "numeric" })}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}

function CoachCard({ coach: c }: { coach: Coach }) {
  const facts = [
    c.age && `Age ${c.age}`,
    c.seasonsBefore ? `${ordinal(c.seasonsBefore + 1)} season as an NBA head coach` : "First season as an NBA head coach",
    c.record && `Career ${c.record}`,
    c.playoffRecord && c.playoffRecord !== "0-0" && `Playoffs ${c.playoffRecord}`,
  ].filter(Boolean);
  return (
    <div className="flex items-center gap-3 rounded-lg border border-line bg-panel p-2.5">
      <Headshot src={c.headshot} name={c.name} className="size-12 shrink-0 rounded-full bg-panel-2" />
      <div className="min-w-0">
        <div className="text-xs text-mute"><span className="explain" {...tip("coach")}>Head coach</span></div>
        <div className="font-semibold">{c.name}</div>
        <div className="text-sm text-mute" data-tip="Wins-losses across his whole NBA head coaching career, all teams.">{facts.join(", ")}</div>
      </div>
    </div>
  );
}

function Fact({ k, v, t }: { k: string; v?: string; t?: string }) {
  if (!v) return null;
  return (
    <div className="min-w-0">
      <dt className="text-xs text-mute">{t ? <span className="explain" {...tip(t)}>{k}</span> : k}</dt>
      <dd className="font-medium leading-snug">{v}</dd>
    </div>
  );
}

function Line({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3">
      <dt className="text-mute">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}
