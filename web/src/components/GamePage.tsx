import { useEffect, useState } from "react";
import type { GameDetail, TeamRef } from "../../../shared/types";
import { accent, go, tint, tipTime, useGame, useTeam } from "../lib";
import { TeamColumn } from "./TeamColumn";
import { PlayerSheet } from "./PlayerSheet";
import { ErrorNote, Spinner } from "./ui";

export function GamePage({ id, playerId }: { id: string; playerId?: string }) {
  const game = useGame(id);
  const awayTeam = useTeam(game.data?.away.id);
  const homeTeam = useTeam(game.data?.home.id);
  const [side, setSide] = useState<"away" | "home">("away");

  useEffect(() => window.scrollTo(0, 0), [id]);

  if (game.isLoading) return <Spinner label="Loading the game" />;
  if (game.error || !game.data) return <ErrorNote error={game.error} what="this game" />;
  const g = game.data;

  return (
    <>
      <nav className="py-4">
        <a href="#/" className="text-sm text-mute hover:text-ink">
          ‹ All games
        </a>
      </nav>

      <MatchupHeader game={g} />

      {/* Narrow viewports (side window, phone): switch between the two teams. */}
      <div className="sticky top-0 z-20 -mx-4 mt-4 bg-court/90 px-4 py-2 backdrop-blur @4xl:hidden sm:-mx-6 sm:px-6">
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-panel p-1" role="tablist">
          {(["away", "home"] as const).map((s) => {
            const t = g[s];
            const active = side === s;
            return (
              <button
                key={s}
                role="tab"
                aria-selected={active}
                onClick={() => setSide(s)}
                className={`flex items-center justify-center gap-2 rounded-lg py-2 font-display text-lg font-bold transition-colors ${active ? "text-ink" : "text-mute hover:text-ink"}`}
                style={active ? { background: `${tint(t.color)}` } : undefined}
              >
                <img src={t.logo} alt="" className="size-6" />
                {t.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 grid gap-8 @4xl:grid-cols-2">
        {(["away", "home"] as const).map((s) => {
          const q = s === "away" ? awayTeam : homeTeam;
          return (
            <div key={s} className={side === s ? "" : "hidden @4xl:block"}>
              {q.isLoading && <Spinner label={`Loading ${g[s].displayName} roster and stats`} />}
              {q.error && <ErrorNote error={q.error} what={`${g[s].displayName}`} />}
              {q.data && <TeamColumn team={q.data} game={g} />}
            </div>
          );
        })}
      </div>

      {playerId && (
        <PlayerSheet
          playerId={playerId}
          game={g}
          teams={[awayTeam.data, homeTeam.data]}
          onClose={() => go(`#/game/${id}`)}
        />
      )}
    </>
  );
}

function MatchupHeader({ game }: { game: GameDetail }) {
  const { away, home, state } = game;
  return (
    <header
      className="relative overflow-hidden rounded-2xl border border-line"
      style={{ background: `linear-gradient(100deg, ${tint(away.color)} 0%, ${tint(away.color)}cc 30%, #18212f 50%, ${tint(home.color)}cc 70%, ${tint(home.color)} 100%)` }}
    >
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-6 sm:gap-4 sm:px-8 sm:py-8">
        <HeaderTeam team={away} tag="Away" />
        <div className="text-center">
          {state === "pre" ? (
            <>
              <div className="font-display text-3xl font-black tnum @lg:text-6xl">{tipTime(game.date)}</div>
              <div className="text-sm text-ink/80">Tip-off</div>
            </>
          ) : (
            <>
              <div className="font-display text-4xl font-black tnum @lg:text-7xl">
                <span className={state === "post" && !away.winner ? "opacity-50" : ""}>{away.score}</span>
                <span className="mx-2 opacity-50">–</span>
                <span className={state === "post" && !home.winner ? "opacity-50" : ""}>{home.score}</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm font-semibold">
                {state === "in" && <span className="live-dot size-2 rounded-full bg-live" />}
                {game.statusText}
              </div>
            </>
          )}
        </div>
        <HeaderTeam team={home} tag="Home" right />
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/10 bg-black/30 px-4 py-3 text-sm sm:px-8">
        {game.predictor && <Predictor game={game} />}
        {game.odds && (
          <span>
            <span className="text-mute">Betting favorite </span>
            {game.odds}
          </span>
        )}
        {game.series && game.series !== "0-0" && (
          <span>
            <span className="text-mute">Season series </span>
            {game.series}
          </span>
        )}
        {game.broadcasts.length > 0 && (
          <span>
            <span className="text-mute">On </span>
            {game.broadcasts.join(", ")}
          </span>
        )}
        {game.venue && <span className="text-mute">{game.venue}{game.city ? `, ${game.city}` : ""}</span>}
      </div>
    </header>
  );
}

function HeaderTeam({ team, tag, right }: { team: TeamRef; tag: string; right?: boolean }) {
  return (
    <div className={`flex min-w-0 items-center gap-3 sm:gap-5 ${right ? "flex-row-reverse text-right" : ""}`}>
      <img src={team.logo} alt="" className="hidden size-12 shrink-0 drop-shadow-lg @md:block @lg:size-20" />
      <div className="min-w-0">
        <div className="truncate text-xs text-ink/75 sm:text-sm">
          <span className="hidden @lg:inline">{team.location}, </span>
          {tag.toLowerCase()}
        </div>
        <div className="truncate font-display text-3xl font-black uppercase leading-none @lg:text-5xl">
          <span className="@lg:hidden">{team.abbr}</span>
          <span className="hidden @lg:inline">{team.name}</span>
        </div>
        <div className="mt-1 text-sm text-ink/80 tnum">{team.record}</div>
      </div>
    </div>
  );
}

function Predictor({ game }: { game: GameDetail }) {
  const p = game.predictor!;
  return (
    <div className="flex min-w-[220px] flex-1 items-center gap-2" title="ESPN's pre-game win probability">
      <span className="tnum font-semibold">{p.away.toFixed(0)}%</span>
      <div className="flex h-2 flex-1 overflow-hidden rounded-full">
        <div style={{ width: `${p.away}%`, background: accent(game.away.color, game.away.altColor) }} />
        <div style={{ width: `${p.home}%`, background: accent(game.home.color, game.home.altColor) }} />
      </div>
      <span className="tnum font-semibold">{p.home.toFixed(0)}%</span>
      <span className="text-mute">to win</span>
    </div>
  );
}
