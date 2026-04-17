import { ReactNode, useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, LogOut, Swords, Check, X, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { SupaBet } from '@/types';

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-white/5 animate-pulse rounded-xl ${className}`} />;
}

/** Compute net P&L for a single settled bet from this user's perspective. */
function betPnl(bet: SupaBet, userId: string): number | null {
  if (!bet.winner_id) return null;
  const isCreator = bet.creator_id === userId;
  const won = bet.winner_id === userId;
  if (isCreator) {
    return won ? (bet.creator_payout ?? 0) - bet.stake : -bet.stake;
  } else {
    // opponent won → wins creator's stake; opponent lost → loses their own stake
    const opponentStake = Math.max(0, (bet.creator_payout ?? bet.stake) - bet.stake);
    return won ? bet.stake : -opponentStake;
  }
}

function formatBetOdds(bet: SupaBet): string {
  const d = bet.bet_details;
  if (d.odds_format === 'custom' && d.odds_num && d.odds_den) return `${d.odds_num}:${d.odds_den}`;
  return '–';
}

function gameLabel(bet: SupaBet): string {
  const d = bet.bet_details;
  if (d.visitor_team && d.home_team) return `${d.visitor_team} @ ${d.home_team}`;
  if (bet.match_id) return `Game #${bet.match_id}`;
  return 'Unknown game';
}

function selectionLabel(bet: SupaBet, userId: string): string {
  const d = bet.bet_details;
  return bet.creator_id === userId
    ? (d.creator_selection ?? bet.bet_type)
    : (d.opponent_selection ?? bet.bet_type);
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div className="w-7 h-7 rounded-full bg-[#00ff87]/10 border border-[#00ff87]/20 flex items-center justify-center text-[10px] font-bold text-[#00ff87] shrink-0">
      {initials}
    </div>
  );
}

export default function Dashboard() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [bets, setBets] = useState<SupaBet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadBets();
  }, [user]);

  async function loadBets() {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch all bets for this user with creator/opponent profiles joined
      const { data, error } = await supabase
        .from('bets')
        .select(`
          *,
          creator:profiles!bets_creator_id_fkey(id, full_name, email, avatar_url),
          opponent:profiles!bets_opponent_id_fkey(id, full_name, email, avatar_url)
        `)
        .or(`creator_id.eq.${user.id},opponent_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setBets(data ?? []);
    } catch (err) {
      console.error('loadBets error:', err);
      toast.error('Failed to load bets.');
    } finally {
      setLoading(false);
    }
  }

  async function acceptChallenge(betId: string) {
    try {
      const { error } = await supabase
        .from('bets')
        .update({ status: 'accepted' })
        .eq('id', betId);
      if (error) throw error;
      toast.success('Challenge accepted!');
      loadBets();
    } catch (err) {
      console.error('acceptChallenge error:', err);
      toast.error('Failed to accept.');
    }
  }

  async function declineChallenge(betId: string) {
    try {
      const { error } = await supabase
        .from('bets')
        .update({ status: 'declined' })
        .eq('id', betId);
      if (error) throw error;
      toast.success('Challenge declined.');
      loadBets();
    } catch (err) {
      console.error('declineChallenge error:', err);
      toast.error('Failed to decline.');
    }
  }

  const userId = user?.id ?? '';

  // Incoming challenges: pending bets where opponent = user
  const incomingChallenges = bets.filter(
    (b) => b.opponent_id === userId && b.status === 'pending'
  );

  // Active bets: accepted or pending (excluding incoming challenges)
  const activeBets = bets.filter(
    (b) => (b.status === 'pending' && b.creator_id === userId) || b.status === 'accepted'
  );

  // Settled results (last 5)
  const recentResults = bets
    .filter((b) => b.winner_id !== null)
    .slice(0, 5);

  // Stats
  const settledBets = bets.filter((b) => b.winner_id !== null);
  const totalPnl = settledBets.reduce((acc, b) => {
    const p = betPnl(b, userId);
    return p !== null ? acc + p : acc;
  }, 0);
  const wonCount = settledBets.filter((b) => b.winner_id === userId).length;
  const winRate = settledBets.length > 0 ? Math.round((wonCount / settledBets.length) * 100) : 0;

  return (
    <div className="px-4 pt-5 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">MoneyBall 🏀</h1>
          <p className="text-[#8b8b9a] text-sm mt-0.5">
            {profile?.full_name ?? 'Your bets. Your rules.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/group-bet')}
            className="w-9 h-9 rounded-full bg-[#1a1a1f] border border-white/10 flex items-center justify-center"
            title="Group Bets"
          >
            <Users className="w-4.5 h-4.5 text-[#8b8b9a]" />
          </button>
          <button
            onClick={async () => { await signOut(); navigate('/auth'); }}
            className="w-9 h-9 rounded-full bg-[#1a1a1f] border border-white/10 flex items-center justify-center"
            title="Sign out"
          >
            <LogOut className="w-4 h-4 text-[#8b8b9a]" />
          </button>
        </div>
      </div>

      {/* Stats Row */}
      {loading ? (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatCard
            label="P&L"
            value={`${totalPnl >= 0 ? '+' : ''}₹${Math.abs(totalPnl).toLocaleString('en-IN')}`}
            positive={totalPnl >= 0}
          />
          <StatCard label="Active" value={`${activeBets.length}`} neutral />
          <StatCard
            label="Win Rate"
            value={winRate > 0 ? `${winRate}%` : '–'}
            positive={winRate >= 50}
            neutral={winRate === 0}
          />
        </div>
      )}

      {/* Incoming Challenges */}
      {incomingChallenges.length > 0 && (
        <Section title="Incoming Challenges" count={incomingChallenges.length}>
          <div className="space-y-3">
            {incomingChallenges.map((bet) => (
              <ChallengeCard
                key={bet.id}
                bet={bet}
                onAccept={() => acceptChallenge(bet.id)}
                onDecline={() => declineChallenge(bet.id)}
              />
            ))}
          </div>
        </Section>
      )}

      {/* Active Bets */}
      <Section title="Active Bets" count={activeBets.length}>
        {loading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : activeBets.length === 0 ? (
          <EmptyState message="No active bets. Head to Games to place one." />
        ) : (
          <div className="space-y-3">
            {activeBets.map((bet) => (
              <ActiveBetCard key={bet.id} bet={bet} userId={userId} />
            ))}
          </div>
        )}
      </Section>

      {/* Recent Results */}
      <Section title="Recent Results" count={recentResults.length}>
        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : recentResults.length === 0 ? (
          <EmptyState message="No settled bets yet." />
        ) : (
          <div className="space-y-2">
            {recentResults.map((bet) => (
              <ResultRow key={bet.id} bet={bet} userId={userId} />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

/* ── Sub-components ── */

function StatCard({ label, value, positive, neutral }: {
  label: string; value: string; positive?: boolean; neutral?: boolean;
}) {
  const color = neutral ? 'text-white' : positive ? 'text-[#00ff87]' : 'text-[#ff3b5c]';
  return (
    <div className="bg-[#1a1a1f] rounded-xl p-3 border border-white/5">
      <p className="text-[#8b8b9a] text-xs mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}

function Section({ title, count, children }: {
  title: string; count: number; children: ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold">{title}</h2>
        {count > 0 && (
          <span className="text-xs text-[#8b8b9a] bg-white/5 px-2 py-0.5 rounded-full">{count}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-[#1a1a1f] rounded-xl p-6 text-center border border-white/5">
      <p className="text-[#8b8b9a] text-sm">{message}</p>
    </div>
  );
}

function ChallengeCard({ bet, onAccept, onDecline }: {
  bet: SupaBet; onAccept: () => void; onDecline: () => void;
}) {
  const from = bet.creator?.full_name ?? 'Someone';
  return (
    <div className="bg-[#1a1a1f] rounded-xl p-4 border border-[#00ff87]/20">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-[#00ff87]/10 border border-[#00ff87]/20 flex items-center justify-center shrink-0">
          <Swords className="w-4 h-4 text-[#00ff87]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">
            <span className="text-[#00ff87]">{from}</span> challenged you
          </p>
          <p className="text-xs text-[#8b8b9a] mt-0.5 truncate">{gameLabel(bet)}</p>
          <p className="text-xs text-white mt-0.5 truncate">
            Their pick: {bet.bet_details.creator_selection ?? '–'}
          </p>
          <p className="text-xs text-[#8b8b9a] mt-0.5">
            Your pick: {bet.bet_details.opponent_selection ?? '–'} · Stake: ₹{bet.stake.toLocaleString('en-IN')}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onAccept}
          className="flex-1 flex items-center justify-center gap-1.5 bg-[#00ff87]/10 border border-[#00ff87]/30 text-[#00ff87] text-xs font-bold py-2 rounded-lg"
        >
          <Check className="w-3.5 h-3.5" /> Accept
        </button>
        <button
          onClick={onDecline}
          className="flex-1 flex items-center justify-center gap-1.5 bg-[#ff3b5c]/10 border border-[#ff3b5c]/30 text-[#ff3b5c] text-xs font-bold py-2 rounded-lg"
        >
          <X className="w-3.5 h-3.5" /> Decline
        </button>
      </div>
    </div>
  );
}

function ActiveBetCard({ bet, userId }: { bet: SupaBet; userId: string }) {
  const payout = bet.creator_payout ?? 0;
  const isCreator = bet.creator_id === userId;
  const potentialWin = isCreator ? payout - bet.stake : bet.stake;
  const opponent = isCreator ? bet.opponent : bet.creator;

  return (
    <div className="bg-[#1a1a1f] rounded-xl p-4 border border-white/5">
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0 mr-2">
          <p className="text-xs text-[#8b8b9a] mb-0.5 truncate">{gameLabel(bet)}</p>
          <p className="text-sm font-medium truncate">{selectionLabel(bet, userId)}</p>
          {opponent && (
            <div className="flex items-center gap-1.5 mt-1">
              <Avatar name={opponent.full_name} />
              <span className="text-xs text-[#8b8b9a]">vs {opponent.full_name}</span>
            </div>
          )}
        </div>
        <span className="text-xs bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded-full shrink-0">
          {bet.status === 'accepted' ? 'Active' : 'Pending'}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs text-[#8b8b9a] mt-2 pt-2 border-t border-white/5">
        <span>Stake: <span className="text-white font-medium">₹{bet.stake.toLocaleString('en-IN')}</span></span>
        <span>Odds: <span className="text-white font-medium">{formatBetOdds(bet)}</span></span>
        <span>Win: <span className="text-[#00ff87] font-medium">+₹{potentialWin.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span></span>
      </div>
    </div>
  );
}

function ResultRow({ bet, userId }: { bet: SupaBet; userId: string }) {
  const pnl = betPnl(bet, userId);
  const won = bet.winner_id === userId;

  return (
    <div className="bg-[#1a1a1f] rounded-xl px-4 py-3 flex items-center justify-between border border-white/5">
      <div className="min-w-0">
        <p className="text-xs text-[#8b8b9a] mb-0.5 truncate">{gameLabel(bet)}</p>
        <p className="text-sm font-medium truncate">{selectionLabel(bet, userId)}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-3">
        {won ? (
          <TrendingUp className="w-3.5 h-3.5 text-[#00ff87]" />
        ) : (
          <TrendingDown className="w-3.5 h-3.5 text-[#ff3b5c]" />
        )}
        {pnl !== null && (
          <span className={`text-sm font-semibold ${won ? 'text-[#00ff87]' : 'text-[#ff3b5c]'}`}>
            {pnl >= 0 ? '+' : ''}₹{Math.abs(pnl).toLocaleString('en-IN')}
          </span>
        )}
        <span className={`text-xs px-2 py-0.5 rounded-full ${won ? 'bg-[#00ff87]/10 text-[#00ff87]' : 'bg-[#ff3b5c]/10 text-[#ff3b5c]'}`}>
          {won ? 'Won' : 'Lost'}
        </span>
      </div>
    </div>
  );
}
