// Thin client over ESPN's public (unofficial, keyless) JSON API with an in-memory TTL cache.
// NBA.com's own API blocks datacenter IPs, so ESPN is the only source.

const SITE = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba";
const STANDINGS = "https://site.api.espn.com/apis/v2/sports/basketball/nba/standings";
const ATHLETE = "https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes";

export const TTL = {
  live: 15_000,
  short: 5 * 60_000,
  medium: 30 * 60_000,
  long: 6 * 3600_000,
  day: 24 * 3600_000,
};

type Entry = { at: number; ttl: number; value: Promise<any> };
const cache = new Map<string, Entry>();

export async function getJson<T = any>(url: string, ttl: number): Promise<T> {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < hit.ttl) return hit.value;
  const value = fetch(url, { headers: { "User-Agent": "nba-tracker (personal project)" } }).then(async (r) => {
    if (!r.ok) throw new Error(`ESPN ${r.status} for ${url}`);
    return r.json();
  });
  cache.set(url, { at: Date.now(), ttl, value });
  // Don't keep failures around.
  value.catch(() => cache.delete(url));
  return value;
}

export function cacheStats() {
  return { entries: cache.size };
}

/** Run async fn over items with limited concurrency, so a roster load doesn't fire 20 requests at once. */
export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return out;
}

export const espn = {
  scoreboard: (date?: string) => getJson(`${SITE}/scoreboard${date ? `?dates=${date}` : ""}`, TTL.live),
  summary: (eventId: string, live: boolean) => getJson(`${SITE}/summary?event=${eventId}`, live ? TTL.live : TTL.short),
  team: (teamId: string) => getJson(`${SITE}/teams/${teamId}`, TTL.medium),
  roster: (teamId: string) => getJson(`${SITE}/teams/${teamId}/roster`, TTL.long),
  teamNews: (teamId: string) => getJson(`${SITE}/news?team=${teamId}&limit=8`, TTL.medium),
  postseason: (teamId: string, seasonYear: number) =>
    getJson(`${SITE}/teams/${teamId}/schedule?season=${seasonYear}&seasontype=3`, TTL.day),
  standings: (seasonYear?: number) =>
    getJson(`${STANDINGS}${seasonYear ? `?season=${seasonYear}` : ""}`, seasonYear ? TTL.day : TTL.medium),
  athlete: (id: string) => getJson(`${ATHLETE}/${id}`, TTL.long),
  athleteStats: (id: string) => getJson(`${ATHLETE}/${id}/stats`, TTL.long),
  athleteOverview: (id: string) => getJson(`${ATHLETE}/${id}/overview`, TTL.medium),
};
