import { useState } from "react";
import type { Injury, TeamDetail } from "../../../shared/types";
import { accent, ordinal, tint } from "../lib";
import { InjuryPill, Modal, Segmented } from "./ui";

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
              <Fact k="This season" v={[team.record, team.streak && `(${team.streak})`].filter(Boolean).join(" ")} />
              <Fact k="Standing" v={team.standing} />
              <Fact k="Coach" v={team.coach} />
              <Fact k={`Last season (${team.lastSeason?.season ?? ""})`} v={team.lastSeason?.record && `${team.lastSeason.record}${team.lastSeason.seed ? `, ${ordinal(team.lastSeason.seed)} seed` : ""}`} />
              <Fact k="Playoffs" v={team.lastSeason?.playoffs} />
              <Fact k="Titles" v={lore && (lore.titles.length ? `${lore.titles.length} (last in ${lore.titles.at(-1)})` : "None yet")} />
            </dl>
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
                  <div className="line-clamp-1 text-sm text-mute">
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
                <InjuryPill status={i.status} />
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

function Fact({ k, v }: { k: string; v?: string }) {
  if (!v) return null;
  return (
    <div className="min-w-0">
      <dt className="text-xs text-mute">{k}</dt>
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
