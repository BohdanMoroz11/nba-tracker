import type { GameCard, TeamRef } from "../../../shared/types";
import { dayLabel, go, tint, tipTime, useGames } from "../lib";
import { ErrorNote, Spinner } from "./ui";

export function GamesPage() {
  const { data, isLoading, error } = useGames();
  return (
    <>
      <header className="flex items-center justify-between py-5">
        <span className="font-display text-2xl font-extrabold tracking-wide">Courtside</span>
      </header>

      <h1 className="font-display text-5xl font-black leading-none sm:text-7xl">
        {data?.upcoming ? "Next games" : "Tonight"}
      </h1>
      <p className="mt-2 text-mute">
        {data ? `${dayLabel(data.date)}, US time. Tip-off times shown in your timezone.` : " "}
      </p>

      <div className="mt-8">
        {isLoading && <Spinner label="Loading the schedule" />}
        {error && <ErrorNote error={error} what="the schedule" />}
        {data && data.games.length === 0 && (
          <p className="text-mute">No NBA games in the next 10 days. It's probably the offseason.</p>
        )}
        <ul className="grid gap-3 @4xl:grid-cols-2">
          {data?.games.map((g) => (
            <li key={g.id}>
              <GameRow game={g} />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

function GameRow({ game }: { game: GameCard }) {
  const { away, home, state } = game;
  return (
    <button
      onClick={() => go(`#/game/${game.id}`)}
      className="group relative grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2 overflow-hidden rounded-xl border border-line bg-panel px-3 py-4 text-left transition-colors hover:border-mute/60 sm:px-5"
      style={{
        backgroundImage: `linear-gradient(90deg, ${tint(away.color)}55, transparent 38%, transparent 62%, ${tint(home.color)}55)`,
      }}
    >
      <Side team={away} />
      <div className="min-w-[88px] text-center">
        {state === "pre" ? (
          <div className="font-display text-2xl font-bold tnum">{tipTime(game.date)}</div>
        ) : (
          <div className="font-display text-3xl font-extrabold tnum">
            <span className={state === "post" && !away.winner ? "text-mute" : ""}>{away.score}</span>
            <span className="mx-1.5 text-mute">–</span>
            <span className={state === "post" && !home.winner ? "text-mute" : ""}>{home.score}</span>
          </div>
        )}
        <div className="mt-0.5 flex items-center justify-center gap-1.5 text-xs text-mute">
          {state === "in" && <span className="live-dot size-1.5 rounded-full bg-live" />}
          {state === "pre" ? "" : game.statusText}
        </div>
      </div>
      <Side team={home} right />
    </button>
  );
}

function Side({ team, right }: { team: TeamRef; right?: boolean }) {
  return (
    <div className={`flex min-w-0 items-center gap-3 ${right ? "flex-row-reverse text-right" : ""}`}>
      <img src={team.logo} alt="" className="size-10 shrink-0 sm:size-12" />
      <div className="min-w-0">
        <div className="text-xs text-mute">{team.location}</div>
        <div className="truncate font-display text-2xl font-extrabold leading-tight sm:text-3xl">{team.name}</div>
        <div className="text-xs text-mute tnum">{team.record}</div>
      </div>
    </div>
  );
}
