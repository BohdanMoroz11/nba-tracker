// "How important is this guy to the team?" — a rough, explainable heuristic, not real analytics.
// Blends this season with last season (early in the year, last season dominates),
// and adds a little salary signal so an injured star on a max deal still ranks high.
import type { RosterPlayer, StatLine, Tier } from "../shared/types.ts";

type Base = Omit<RosterPlayer, "importance" | "tier">;

function production(s?: StatLine): number {
  if (!s || !s.gp) return 0;
  const startShare = s.gp ? s.gs / s.gp : 0;
  const raw = s.min * 0.6 + s.pts + s.reb * 0.6 + s.ast * 0.9 + (s.stl + s.blk) * 1.2;
  return raw * (0.85 + 0.15 * startShare);
}

export function rawScore(p: Base): number {
  const cur = production(p.current);
  const last = production(p.last);
  // Weight of the current season grows with games played; full weight after ~15 games.
  const w = p.current?.gp ? Math.min(1, p.current.gp / 15) : 0;
  const stats = last ? w * cur + (1 - w) * last : cur;
  const salary = (p.salary ?? 0) / 1e6; // $M
  return stats + Math.min(salary, 60) * 0.3;
}

export function rankRoster(players: Base[]): RosterPlayer[] {
  const scored = players.map((p) => ({ p, s: rawScore(p) })).sort((a, b) => b.s - a.s);
  const max = scored[0]?.s || 1;
  return scored.map(({ p, s }, rank) => {
    const importance = Math.round((s / max) * 100);
    let tier: Tier;
    if (rank === 0 || (rank <= 2 && importance >= 85)) tier = "star";
    else if (rank < 5) tier = "starter";
    else if (rank < 10) tier = "rotation";
    else tier = "bench";
    return { ...p, importance, tier };
  });
}
