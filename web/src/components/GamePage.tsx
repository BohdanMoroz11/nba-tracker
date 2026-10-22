import { useEffect, useState, type ReactNode } from "react";
import type { GameDetail, TeamDetail, TeamRef } from "../../../shared/types";
import { accent, go, tint, tipTime, useGame, useTeam, type StatMode } from "../lib";
import { TeamPanel } from "./TeamPanel";
import { PlayerModal } from "./PlayerModal";
import { ErrorNote, Segmented, Spinner } from "./ui";

// A fixed-viewport dashboard: nothing on this page scrolls. Detail lives in modals.
export function GamePage({ id, playerId }: { id: string; playerId?: string }) {
  const game = useGame(id);
  const awayTeam = useTeam(game.data?.away.id);
  const homeTeam = useTeam(game.data?.home.id);
  const [side, setSide] = useState<"away" | "home">("away");
  const [mode, setMode] = useState<StatMode | null>(null);

  useEffect(() => setMode(null), [id]);

  const g = game.data;
  if (game.isLoading) return <div className="p-6"><Spinner label="Loading the game" /></div>;
  if (game.error || !g) return <div className="p-6"><ErrorNote error={game.error} what="this game" /></div>;

  const statMode = mode ?? defaultMode(g, [awayTeam.data, homeTeam.data]);
  const seasonNow = awayTeam.data?.season ?? homeTeam.data?.season;
  const seasonLast = awayTeam.data?.lastSeason?.season ?? homeTeam.data?.lastSeason?.season;
  const modeOptions: { value: StatMode; label: string }[] = [
    { value: "last", label: seasonLast ?? "Last season" },
    { value: "current", label: seasonNow ?? "This season" },
    ...(g.state !== "pre" ? [{ value: "tonight" as const, label: g.state === "in" ? "Live game" : "This game" }] : []),
  ];

  return (
    <div className="flex h-dvh flex-col overflow-hidden @container">
      <Header game={g} toggle={<Segmented value={statMode} onChange={setMode} options={modeOptions} />} />

      <div className="flex shrink-0 flex-wrap items-center gap-2 px-3 py-2 sm:px-4 @4xl:hidden">
        {/* Narrow: one team at a time. */}
        <Segmented
          className="@4xl:hidden"
          value={side}
          onChange={setSide}
          options={(["away", "home"] as const).map((s) => ({
            value: s,
            label: (
              <span className="flex items-center gap-1.5">
                <img src={g[s].logo} alt="" className="size-4" />
                {g[s].name}
              </span>
            ),
          }))}
        />
        <div className="ml-auto">
          <Segmented value={statMode} onChange={setMode} options={modeOptions} />
        </div>
      </div>

      <main className="grid min-h-0 flex-1 gap-3 px-3 pb-3 sm:px-4 @4xl:grid-cols-2 @4xl:pt-3">
        {(["away", "home"] as const).map((s) => {
          const q = s === "away" ? awayTeam : homeTeam;
          return (
            <div key={s} className={`min-h-0 flex-col ${side === s ? "flex" : "hidden @4xl:flex"}`}>
              {q.isLoading && <Spinner label={`Loading ${g[s].displayName}`} />}
              {q.error && <ErrorNote error={q.error} what={g[s].displayName} />}
              {q.data && <TeamPanel team={q.data} game={g} mode={statMode} />}
            </div>
          );
        })}
      </main>

      {playerId && (
        <PlayerModal playerId={playerId} game={g} teams={[awayTeam.data, homeTeam.data]} onClose={() => go(`#/game/${id}`)} />
      )}
    </div>
  );
}

function defaultMode(g: GameDetail, teams: (TeamDetail | undefined)[]): StatMode {
  if (g.state !== "pre") return "tonight";
  // Early in the season this year's sample is tiny; show last season until teams have ~8 games.
  const gp = Math.max(0, ...teams.flatMap((t) => t?.roster.map((p) => p.current?.gp ?? 0) ?? []));
  return gp >= 8 ? "current" : "last";
}

function Header({ game, toggle }: { game: GameDetail; toggle: ReactNode }) {
  const { away, home, state } = game;
  return (
    <header
      className="shrink-0 border-b border-line"
      style={{ background: `linear-gradient(100deg, ${tint(away.color)} 0%, ${tint(away.color)}aa 22%, #18212f 45%, #18212f 55%, ${tint(home.color)}aa 78%, ${tint(home.color)} 100%)` }}
    >
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 px-3 py-2 sm:px-4">
        <a href="#/" className="text-sm text-ink/80 hover:text-ink" aria-label="All games">‹<span className="hidden @md:inline"> Games</span></a>

        <div className="grid flex-1 grid-cols-[1fr_auto_1fr] items-center gap-3 @4xl:flex-none @4xl:gap-6">
          <HeaderTeam team={away} />
          <div className="text-center leading-none">
            {state === "pre" ? (
              <div className="font-display text-3xl font-black tnum">{tipTime(game.date)}</div>
            ) : (
              <div className="font-display text-3xl font-black tnum">
                <span className={state === "post" && !away.winner ? "opacity-50" : ""}>{away.score}</span>
                <span className="mx-1.5 opacity-50">–</span>
                <span className={state === "post" && !home.winner ? "opacity-50" : ""}>{home.score}</span>
              </div>
            )}
            <div className="mt-0.5 flex items-center justify-center gap-1.5 text-xs text-ink/80">
              {state === "in" && <span className="live-dot size-1.5 rounded-full bg-live" />}
              {state === "pre" ? "tip-off" : game.statusText}
            </div>
          </div>
          <HeaderTeam team={home} right />
        </div>

        <div className="flex w-full flex-wrap items-center gap-x-5 gap-y-1 text-xs @4xl:ml-auto @4xl:w-auto @4xl:text-sm">
          {game.predictor && <Predictor game={game} />}
          {game.odds && <span><span className="text-ink/60">Favorite </span>{game.odds}</span>}
          {game.series && game.series !== "0-0" && <span><span className="text-ink/60">Series </span>{game.series}</span>}
          {game.broadcasts.length > 0 && <span><span className="text-ink/60">On </span>{game.broadcasts.join(", ")}</span>}
          {game.venue && <span className="hidden text-ink/60 @7xl:inline">{game.venue}</span>}
          <span className="hidden items-center gap-2 @4xl:flex">
            <span className="text-xs text-ink/60">Stats from</span>
            {toggle}
          </span>
        </div>
      </div>
    </header>
  );
}

function HeaderTeam({ team, right }: { team: TeamRef; right?: boolean }) {
  return (
    <div className={`flex min-w-0 items-center gap-2 ${right ? "flex-row-reverse text-right" : ""}`}>
      <img src={team.logo} alt="" className="hidden size-9 shrink-0 drop-shadow @md:block" />
      <div className="min-w-0 leading-none">
        <div className="truncate font-display text-2xl font-black uppercase">
          <span className="@xl:hidden">{team.abbr}</span>
          <span className="hidden @xl:inline">{team.name}</span>
        </div>
        <div className="mt-0.5 text-xs text-ink/75 tnum">{team.record}</div>
      </div>
    </div>
  );
}

function Predictor({ game }: { game: GameDetail }) {
  const p = game.predictor!;
  return (
    <div className="flex items-center gap-1.5" title="ESPN's pre-game win probability">
      <span className="tnum font-semibold">{p.away.toFixed(0)}%</span>
      <div className="flex h-1.5 w-20 overflow-hidden rounded-full @6xl:w-28">
        <div style={{ width: `${p.away}%`, background: accent(game.away.color, game.away.altColor) }} />
        <div style={{ width: `${p.home}%`, background: accent(game.home.color, game.home.altColor) }} />
      </div>
      <span className="tnum font-semibold">{p.home.toFixed(0)}%</span>
      <span className="text-ink/60">to win</span>
    </div>
  );
}
