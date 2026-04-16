import { Game, Bet } from '@/types';

export const mockGames: Game[] = [
  {
    id: 'game_001',
    home_team: 'Los Angeles Lakers',
    away_team: 'Golden State Warriors',
    start_time: '2026-04-16T19:30:00',
    status: 'live',
    home_score: 87,
    away_score: 92,
    league: 'NBA',
  },
  {
    id: 'game_002',
    home_team: 'Boston Celtics',
    away_team: 'Miami Heat',
    start_time: '2026-04-16T20:00:00',
    status: 'upcoming',
    league: 'NBA',
  },
  {
    id: 'game_003',
    home_team: 'Milwaukee Bucks',
    away_team: 'Brooklyn Nets',
    start_time: '2026-04-16T21:30:00',
    status: 'upcoming',
    league: 'NBA',
  },
  {
    id: 'game_004',
    home_team: 'Dallas Mavericks',
    away_team: 'Phoenix Suns',
    start_time: '2026-04-17T19:00:00',
    status: 'upcoming',
    league: 'NBA',
  },
  {
    id: 'game_005',
    home_team: 'Denver Nuggets',
    away_team: 'LA Clippers',
    start_time: '2026-04-17T21:00:00',
    status: 'upcoming',
    league: 'NBA',
  },
];

// Abbrevations used in display
export const teamAbbr: Record<string, string> = {
  'Los Angeles Lakers': 'LAL',
  'Golden State Warriors': 'GSW',
  'Boston Celtics': 'BOS',
  'Miami Heat': 'MIA',
  'Milwaukee Bucks': 'MIL',
  'Brooklyn Nets': 'BKN',
  'Dallas Mavericks': 'DAL',
  'Phoenix Suns': 'PHX',
  'Denver Nuggets': 'DEN',
  'LA Clippers': 'LAC',
};

export const USER_ID = 'user_001';

export const mockBets: Bet[] = [
  {
    id: 'bet_001',
    game_id: 'game_001',
    bet_type: 'moneyline',
    selection: 'Golden State Warriors ML',
    odds_format: 'custom',
    custom_odds_numerator: 3,
    custom_odds_denominator: 2,
    stake: 2000,
    status: 'pending',
    created_by: USER_ID,
    created_at: '2026-04-16T18:00:00',
  },
  {
    id: 'bet_002',
    game_id: 'game_002',
    bet_type: 'spread',
    selection: 'Boston Celtics -5.5',
    odds_format: 'american',
    stake: 1500,
    status: 'pending',
    created_by: USER_ID,
    created_at: '2026-04-16T17:30:00',
  },
  {
    id: 'bet_003',
    game_id: 'game_003',
    bet_type: 'over_under',
    selection: 'Over 224.5',
    odds_format: 'custom',
    custom_odds_numerator: 1,
    custom_odds_denominator: 1,
    stake: 1000,
    status: 'won',
    created_by: USER_ID,
    created_at: '2026-04-15T20:00:00',
  },
  {
    id: 'bet_004',
    game_id: 'game_004',
    bet_type: 'prop',
    selection: 'Luka Dončić 35+ pts',
    odds_format: 'custom',
    custom_odds_numerator: 2,
    custom_odds_denominator: 5,
    stake: 3000,
    status: 'won',
    created_by: USER_ID,
    created_at: '2026-04-14T19:00:00',
  },
  {
    id: 'bet_005',
    game_id: 'game_005',
    bet_type: 'moneyline',
    selection: 'LA Clippers ML',
    odds_format: 'custom',
    custom_odds_numerator: 5,
    custom_odds_denominator: 3,
    stake: 2500,
    status: 'lost',
    created_by: USER_ID,
    created_at: '2026-04-13T21:00:00',
  },
  {
    id: 'bet_006',
    game_id: 'game_001',
    bet_type: 'parlay',
    selection: 'Lakers ML + Celtics -5.5',
    odds_format: 'decimal',
    stake: 500,
    status: 'lost',
    created_by: USER_ID,
    created_at: '2026-04-12T18:00:00',
  },
];

// Mock market data for each game
export interface MarketOption {
  label: string;
  odds: string;
  oddsFormat: 'american';
}

export interface GameMarket {
  moneyline: { home: MarketOption; away: MarketOption };
  spread: { home: MarketOption; away: MarketOption; line: number };
  over_under: { over: MarketOption; under: MarketOption; total: number };
  props: { player: string; line: string; over: MarketOption; under: MarketOption }[];
}

export const mockMarkets: Record<string, GameMarket> = {
  game_001: {
    moneyline: {
      home: { label: 'Lakers', odds: '+140', oddsFormat: 'american' },
      away: { label: 'Warriors', odds: '-165', oddsFormat: 'american' },
    },
    spread: {
      home: { label: 'Lakers +3.5', odds: '-110', oddsFormat: 'american' },
      away: { label: 'Warriors -3.5', odds: '-110', oddsFormat: 'american' },
      line: 3.5,
    },
    over_under: {
      over: { label: 'Over 228.5', odds: '-115', oddsFormat: 'american' },
      under: { label: 'Under 228.5', odds: '-105', oddsFormat: 'american' },
      total: 228.5,
    },
    props: [
      { player: 'LeBron James', line: '28.5 pts', over: { label: 'Over', odds: '-120', oddsFormat: 'american' }, under: { label: 'Under', odds: '+100', oddsFormat: 'american' } },
      { player: 'Stephen Curry', line: '31.5 pts', over: { label: 'Over', odds: '+110', oddsFormat: 'american' }, under: { label: 'Under', odds: '-130', oddsFormat: 'american' } },
      { player: 'Anthony Davis', line: '8.5 reb', over: { label: 'Over', odds: '-115', oddsFormat: 'american' }, under: { label: 'Under', odds: '-105', oddsFormat: 'american' } },
    ],
  },
  game_002: {
    moneyline: {
      home: { label: 'Celtics', odds: '-200', oddsFormat: 'american' },
      away: { label: 'Heat', odds: '+170', oddsFormat: 'american' },
    },
    spread: {
      home: { label: 'Celtics -5.5', odds: '-110', oddsFormat: 'american' },
      away: { label: 'Heat +5.5', odds: '-110', oddsFormat: 'american' },
      line: 5.5,
    },
    over_under: {
      over: { label: 'Over 216.5', odds: '-110', oddsFormat: 'american' },
      under: { label: 'Under 216.5', odds: '-110', oddsFormat: 'american' },
      total: 216.5,
    },
    props: [
      { player: 'Jayson Tatum', line: '29.5 pts', over: { label: 'Over', odds: '-125', oddsFormat: 'american' }, under: { label: 'Under', odds: '+105', oddsFormat: 'american' } },
      { player: 'Bam Adebayo', line: '10.5 reb', over: { label: 'Over', odds: '+115', oddsFormat: 'american' }, under: { label: 'Under', odds: '-135', oddsFormat: 'american' } },
    ],
  },
  game_003: {
    moneyline: {
      home: { label: 'Bucks', odds: '-180', oddsFormat: 'american' },
      away: { label: 'Nets', odds: '+155', oddsFormat: 'american' },
    },
    spread: {
      home: { label: 'Bucks -4.5', odds: '-110', oddsFormat: 'american' },
      away: { label: 'Nets +4.5', odds: '-110', oddsFormat: 'american' },
      line: 4.5,
    },
    over_under: {
      over: { label: 'Over 224.5', odds: '-110', oddsFormat: 'american' },
      under: { label: 'Under 224.5', odds: '-110', oddsFormat: 'american' },
      total: 224.5,
    },
    props: [
      { player: 'Giannis Antetokounmpo', line: '32.5 pts', over: { label: 'Over', odds: '-110', oddsFormat: 'american' }, under: { label: 'Under', odds: '-110', oddsFormat: 'american' } },
      { player: 'Damian Lillard', line: '26.5 pts', over: { label: 'Over', odds: '-115', oddsFormat: 'american' }, under: { label: 'Under', odds: '-105', oddsFormat: 'american' } },
    ],
  },
  game_004: {
    moneyline: {
      home: { label: 'Mavericks', odds: '+120', oddsFormat: 'american' },
      away: { label: 'Suns', odds: '-140', oddsFormat: 'american' },
    },
    spread: {
      home: { label: 'Mavericks +2.5', odds: '-110', oddsFormat: 'american' },
      away: { label: 'Suns -2.5', odds: '-110', oddsFormat: 'american' },
      line: 2.5,
    },
    over_under: {
      over: { label: 'Over 232.5', odds: '-115', oddsFormat: 'american' },
      under: { label: 'Under 232.5', odds: '-105', oddsFormat: 'american' },
      total: 232.5,
    },
    props: [
      { player: 'Luka Dončić', line: '34.5 pts', over: { label: 'Over', odds: '+105', oddsFormat: 'american' }, under: { label: 'Under', odds: '-125', oddsFormat: 'american' } },
      { player: 'Kevin Durant', line: '28.5 pts', over: { label: 'Over', odds: '-120', oddsFormat: 'american' }, under: { label: 'Under', odds: '+100', oddsFormat: 'american' } },
    ],
  },
  game_005: {
    moneyline: {
      home: { label: 'Nuggets', odds: '-155', oddsFormat: 'american' },
      away: { label: 'Clippers', odds: '+130', oddsFormat: 'american' },
    },
    spread: {
      home: { label: 'Nuggets -3.5', odds: '-110', oddsFormat: 'american' },
      away: { label: 'Clippers +3.5', odds: '-110', oddsFormat: 'american' },
      line: 3.5,
    },
    over_under: {
      over: { label: 'Over 220.5', odds: '-110', oddsFormat: 'american' },
      under: { label: 'Under 220.5', odds: '-110', oddsFormat: 'american' },
      total: 220.5,
    },
    props: [
      { player: 'Nikola Jokić', line: '12.5 ast', over: { label: 'Over', odds: '-110', oddsFormat: 'american' }, under: { label: 'Under', odds: '-110', oddsFormat: 'american' } },
      { player: 'Kawhi Leonard', line: '24.5 pts', over: { label: 'Over', odds: '+100', oddsFormat: 'american' }, under: { label: 'Under', odds: '-120', oddsFormat: 'american' } },
    ],
  },
};
