import type { BoxLine, GameDetail, RosterPlayer, TeamDetail } from "../../../shared/types";
import { headlineLine, money, one, tierLabel, tint } from "../lib";
import { Headshot, ImportanceBar, InjuryPill, SectionTitle, Stat } from "./ui";

interface Props {
  team: TeamDetail;
  game: GameDetail;
  color: string;
}

export function Roster({ team, game, color }: Props) {
  const stars = team.roster.filter((p) => p.tier === "star");
  const key = team.roster.filter((p) => p.tier === "starter");
  const rest = team.roster.filter((p) => p.tier === "rotation" || p.tier === "bench");
  const href = (p: RosterPlayer) => `#/game/${game.id}/p/${p.id}`;
  const showBox = game.state !== "pre";

  return (
    <div className="space-y-8">
      <div>
        <SectionTitle aside={`by importance, ${(stars[0] && headlineLine(stars[0].current, stars[0].last)?.season) || "last season"} stats`}>Who to watch</SectionTitle>
        <div className="grid gap-3">
          {stars.map((p) => (
            <StarCard key={p.id} p={p} href={href(p)} color={color} bg={tint(team.team.color)} box={showBox ? game.box[p.id] : undefined} />
          ))}
        </div>
        <div className="mt-3 grid gap-2 @xl:grid-cols-2">
          {key.map((p) => (
            <KeyCard key={p.id} p={p} href={href(p)} color={color} box={showBox ? game.box[p.id] : undefined} />
          ))}
        </div>
      </div>

      <div>
        <SectionTitle aside={<Legend />}>Rest of the roster</SectionTitle>
        <ul className="divide-y divide-line">
          {rest.map((p) => (
            <CompactRow key={p.id} p={p} href={href(p)} color={color} box={showBox ? game.box[p.id] : undefined} />
          ))}
        </ul>
      </div>
    </div>
  );
}

function Legend() {
  return (
    <span>
      <b className="text-ink">points</b> and minutes per game
    </span>
  );
}

function Tonight({ box }: { box?: BoxLine }) {
  if (!box) return null;
  if (box.didNotPlay) return <span className="text-xs text-mute">Tonight: didn't play</span>;
  return (
    <span className="text-xs tnum">
      <span className="font-semibold text-live">Tonight</span> {box.pts} pts, {box.reb} reb, {box.ast} ast in {box.min} min
    </span>
  );
}

function StarCard({ p, href, color, bg, box }: { p: RosterPlayer; href: string; color: string; bg: string; box?: BoxLine }) {
  const line = headlineLine(p.current, p.last);
  return (
    <a
      href={href}
      className="relative block min-h-[200px] overflow-hidden rounded-2xl border border-line transition-colors hover:border-mute/60"
      style={{ background: `linear-gradient(120deg, ${bg} 0%, ${bg}99 45%, #18212f 100%)` }}
    >
      {p.jersey && (
        <span className="jersey-ghost absolute -right-2 -top-4 text-[11rem] @lg:text-[13rem]" style={{ ["--team" as string]: "#ffffff" }} aria-hidden>
          {p.jersey}
        </span>
      )}
      <Headshot src={p.headshot} name={p.name} className="absolute bottom-0 right-0 h-[170px] w-[232px] max-w-[55%] object-contain object-bottom @lg:h-[200px] @lg:w-[272px]" />

      <div className="relative flex h-full flex-col p-5 pr-[45%]">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-full bg-black/35 px-2 py-0.5 font-semibold">{tierLabel[p.tier]}</span>
          <InjuryPill status={p.injuryStatus} />
        </div>
        <div className="mt-3 font-display font-black leading-[0.9]">
          <div className="text-2xl opacity-85">{p.firstName}</div>
          <div className="text-5xl uppercase @lg:text-6xl">{p.lastName}</div>
        </div>
        <div className="mt-1 text-sm text-ink/80">
          #{p.jersey} {p.positionName}
          {p.age ? `, ${p.age}` : ""}
          {p.experience ? `, ${p.experience} yrs in NBA` : ", rookie"}
        </div>

        {line && (
          <div className="mt-auto pt-4">
            <div className="flex gap-5">
              <Stat big value={one(line.pts)} label="points" />
              <Stat big value={one(line.reb)} label="rebounds" />
              <Stat big value={one(line.ast)} label="assists" />
            </div>
            <div className="mt-2 text-xs text-ink/70">
              {line.season} per game{money(p.salary) ? `, earns ${money(p.salary)} this year` : ""}
            </div>
          </div>
        )}
        {box && (
          <div className="mt-2">
            <Tonight box={box} />
          </div>
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-1" style={{ background: color }} />
    </a>
  );
}

function KeyCard({ p, href, color, box }: { p: RosterPlayer; href: string; color: string; box?: BoxLine }) {
  const line = headlineLine(p.current, p.last);
  return (
    <a href={href} className="relative flex gap-3 overflow-hidden rounded-xl border border-line bg-panel p-3 transition-colors hover:bg-panel-2">
      {p.jersey && (
        <span className="jersey-ghost absolute -bottom-4 -right-1 text-[5rem] opacity-25" aria-hidden>
          {p.jersey}
        </span>
      )}
      <Headshot src={p.headshot} name={p.name} className="size-16 shrink-0 rounded-lg bg-panel-2" />
      <div className="relative min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-display text-xl font-bold leading-tight">{p.name}</span>
          <InjuryPill status={p.injuryStatus} small />
        </div>
        <div className="text-xs text-mute">
          #{p.jersey} {p.positionName}
          {money(p.salary) ? `, ${money(p.salary)}` : ""}
        </div>
        {line && (
          <div className="mt-1 text-sm tnum">
            <b>{one(line.pts)}</b> pts <b>{one(line.reb)}</b> reb <b>{one(line.ast)}</b> ast
          </div>
        )}
        <Tonight box={box} />
        <div className="mt-2 w-2/3">
          <ImportanceBar value={p.importance} color={color} />
        </div>
      </div>
    </a>
  );
}

function CompactRow({ p, href, color, box }: { p: RosterPlayer; href: string; color: string; box?: BoxLine }) {
  const line = headlineLine(p.current, p.last);
  return (
    <li>
      <a href={href} className="grid grid-cols-[2.25rem_2.5rem_1fr_auto] items-center gap-3 py-2 hover:bg-panel">
        <span className="text-right font-display text-xl font-bold" style={{ color }}>
          {p.jersey}
        </span>
        <Headshot src={p.headshot} name={p.name} className="size-10 rounded-full bg-panel-2" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium">{p.name}</span>
            <InjuryPill status={p.injuryStatus} small />
          </div>
          <div className="text-xs text-mute">
            {p.position}
            {p.experience === 0 ? ", rookie" : ""}
            {p.tier === "rotation" ? ", rotation" : ""}
            {box && !box.didNotPlay ? `, tonight ${box.pts} pts in ${box.min} min` : ""}
          </div>
        </div>
        <div className="text-right text-sm tnum">
          {line ? (
            <>
              <b>{one(line.pts)}</b> <span className="text-mute">{one(line.min)}</span>
            </>
          ) : (
            <span className="text-xs text-mute">no NBA stats</span>
          )}
        </div>
      </a>
    </li>
  );
}
