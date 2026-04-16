export interface Game {
  id: string;
  home_team: string;
  away_team: string;
  start_time: string;
  status: 'upcoming' | 'live' | 'finished';
  home_score?: number;
  away_score?: number;
  league: 'NBA';
}

export interface Bet {
  id: string;
  game_id: string;
  bet_type: 'moneyline' | 'spread' | 'over_under' | 'prop' | 'parlay' | 'futures';
  selection: string;
  odds_format: 'custom' | 'american' | 'decimal';
  custom_odds_numerator?: number;
  custom_odds_denominator?: number;
  stake: number;
  status: 'pending' | 'won' | 'lost' | 'void';
  created_by: string;
  opponent_id?: string;
  created_at: string;
}

export interface BetSelection {
  id: string;
  game_id: string;
  market: string;
  selection_label: string;
  odds: string; // display string e.g. "-110" or "1.91" or "2:5"
  odds_format: 'american' | 'decimal' | 'custom';
  custom_odds_numerator?: number;
  custom_odds_denominator?: number;
}
