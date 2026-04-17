// ── Existing local types ──────────────────────────────────────────────────────

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
  odds: string;
  odds_format: 'american' | 'decimal' | 'custom';
  custom_odds_numerator?: number;
  custom_odds_denominator?: number;
}

// ── Supabase schema types ─────────────────────────────────────────────────────

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
}

export interface BetDetails {
  creator_selection?: string;
  opponent_selection?: string;
  odds_format?: 'custom' | 'american' | 'decimal';
  odds_num?: number;
  odds_den?: number;
  description?: string;
  home_team?: string;
  visitor_team?: string;
  game_date?: string;
}

export interface SupaBet {
  id: string;
  creator_id: string;
  opponent_id: string | null;
  match_id: string | null;
  bet_type: string;
  bet_details: BetDetails;
  stake: number;
  creator_payout: number | null;
  opponent_payout: number | null;
  status: 'pending' | 'accepted' | 'active' | 'settled' | 'declined' | 'void';
  winner_id: string | null;
  created_at: string;
  // joined
  creator?: Profile;
  opponent?: Profile;
}

export interface Friend {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
}

export interface FriendWithProfile extends Friend {
  friend: Profile; // the "other" person (not the current user)
}

export interface GroupBet {
  id: string;
  created_by: string;
  match_id: string | null;
  bet_details: { description: string; home_team?: string; visitor_team?: string; game_date?: string };
  status: 'open' | 'locked' | 'settled';
  winner_id: string | null;
  created_at: string;
  participants?: GroupBetParticipant[];
  creator?: Profile;
}

export interface GroupBetParticipant {
  id: string;
  group_bet_id: string;
  user_id: string;
  stake: number;
  selection: string;
  custom_odds_num: number;
  custom_odds_den: number;
  payout: number | null;
  joined_at: string;
  user?: Profile;
}

// ── BallDontLie NBA API types ─────────────────────────────────────────────────

export interface NBATeam {
  id: number;
  full_name: string;
  abbreviation: string;
  city: string;
  name: string;
  conference: string;
  division: string;
}

export interface NBAGame {
  id: number;
  home_team: NBATeam;
  visitor_team: NBATeam;
  home_team_score: number;
  visitor_team_score: number;
  status: string; // "Final" | "7:30 pm ET" | "1st Qtr" | "2nd Qtr" | "Halftime" etc.
  date: string;   // "2026-04-16"
  period: number;
  time: string;
  postseason: boolean;
}
