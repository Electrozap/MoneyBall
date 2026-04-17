import { NBAGame } from '@/types';

const BASE_URL = 'https://api.balldontlie.io/v1';
const API_KEY = import.meta.env.VITE_BALLDONTLIE_KEY ?? '';

const headers: HeadersInit = API_KEY ? { Authorization: API_KEY } : {};

// Simple in-memory cache — keyed by URL, expires after 5 minutes
const cache = new Map<string, { data: NBAGame[]; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000;

function dateString(offset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
}

function buildQS(params: Record<string, string>): string {
  return Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');
}

async function getGames(params: Record<string, string>): Promise<NBAGame[]> {
  const qs = buildQS(params);
  const url = `${BASE_URL}/games?${qs}`;

  const cached = cache.get(url);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`BallDontLie ${res.status}: ${body || res.statusText}`);
  }
  const json = await res.json();
  const data: NBAGame[] = json.data ?? [];
  cache.set(url, { data, ts: Date.now() });
  return data;
}

/**
 * Fetch today's games. If none today, fetch the next 8 days in ONE request
 * (start_date + end_date) to avoid hammering the rate limit.
 */
export async function fetchTodayGames(): Promise<NBAGame[]> {
  const today = dateString(0);
  const games = await getGames({ 'dates[]': today, per_page: '100' });
  if (games.length > 0) return games;

  // No games today — get the nearest upcoming games in a single ranged call
  const end = dateString(8);
  const upcoming = await getGames({ start_date: today, end_date: end, per_page: '100' });
  if (upcoming.length === 0) return [];

  // Return only the earliest date's games
  const firstDate = upcoming[0].date.split('T')[0];
  return upcoming.filter((g) => g.date.split('T')[0] === firstDate);
}

/** Fetch tomorrow's games (single request, cached). */
export async function fetchTomorrowGames(): Promise<NBAGame[]> {
  return getGames({ 'dates[]': dateString(1), per_page: '100' });
}

/** Fetch a single game by id. */
export async function fetchGameById(id: number): Promise<NBAGame> {
  const res = await fetch(`${BASE_URL}/games/${id}`, { headers });
  if (!res.ok) throw new Error(`BallDontLie API ${res.status}`);
  return res.json();
}

/** Fetch player stats for a game (used for props display). */
export async function fetchPlayerStats(gameId: number) {
  const res = await fetch(`${BASE_URL}/stats?game_ids[]=${gameId}&per_page=30`, { headers });
  if (!res.ok) throw new Error(`BallDontLie API ${res.status}`);
  const json = await res.json();
  return json.data ?? [];
}

/** True if the game is currently in progress. */
export function isGameLive(status: string): boolean {
  return /qtr|quarter|half/i.test(status);
}

/** True if the game has ended. */
export function isGameFinal(status: string): boolean {
  return /^final$/i.test(status.trim());
}

/** Format game status for display (e.g. "Q3 4:32" or "Final" or "7:30 PM"). */
export function formatGameStatus(game: NBAGame): string {
  if (isGameFinal(game.status)) return 'Final';
  if (isGameLive(game.status)) return game.status;
  // Upcoming: show the time portion if it looks like a time
  return game.status;
}

/**
 * Generate illustrative betting markets for a game.
 * Since BallDontLie doesn't provide odds, these are placeholder values
 * to enable the bet-slip and challenge flows to function.
 */
export function generateMarkets(game: NBAGame) {
  const home = game.home_team.abbreviation;
  const away = game.visitor_team.abbreviation;
  return {
    moneyline: {
      home: { label: home, odds: '-120', oddsFormat: 'american' as const },
      away: { label: away, odds: '+100', oddsFormat: 'american' as const },
    },
    spread: {
      home: { label: `${home} -1.5`, odds: '-110', oddsFormat: 'american' as const },
      away: { label: `${away} +1.5`, odds: '-110', oddsFormat: 'american' as const },
      line: 1.5,
    },
    over_under: {
      over: { label: 'Over 222.5', odds: '-110', oddsFormat: 'american' as const },
      under: { label: 'Under 222.5', odds: '-110', oddsFormat: 'american' as const },
      total: 222.5,
    },
    props: [] as { player: string; line: string; over: { label: string; odds: string; oddsFormat: 'american' }; under: { label: string; odds: string; oddsFormat: 'american' } }[],
  };
}
