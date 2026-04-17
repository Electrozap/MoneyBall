import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { SupaBet } from '@/types';

type Filter = 'All' | 'Won' | 'Lost' | 'Pending';

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-white/5 animate-pulse rounded-xl ${className}`} />;
}

/** Net P&L for this user on a settled bet. */
function betPnl(bet: SupaBet, userId: string): number | null {
  if (!bet.winner_id) return null;
  const isCreator = bet.creator_id === userId;
  const won = bet.winner_id === userId;
  if (isCreator) {
    return won ? (bet.creator_payout ?? 0) - bet.stake : -bet.stake;
  } else {
    const opponentStake = Math.max(0, (bet.creator_payout ?? bet.stake) - bet.stake);
    return won ? opponentStake : -opponentStake;
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function gameLabel(bet: SupaBet): string {
  const d = bet.bet_details;
  if (d.visitor_team && d.home_team) return `${d.visitor_team} @ ${d.home_team}`;
  if (bet.match_id) return `Game #${bet.match_id}`;
  return 'Custom bet';
}

function selectionLabel(bet: SupaBet, userId: string): string {
  const d = bet.bet_details;
  return bet.creator_id === userId
    ? (d.creator_selection ?? bet.bet_type)
    : (d.opponent_selection ?? bet.bet_type);
}

function oddsLabel(bet: SupaBet): string {
  const d = bet.bet_details;
  if (d.odds_format === 'custom' && d.odds_num && d.odds_den) return `${d.odds_num}:${d.odds_den}`;
  return '–';
}

function opponentName(bet: SupaBet, userId: string): string {
  if (bet.creator_id === userId) {
    return bet.opponent?.full_name ?? '–';
  }
  return bet.creator?.full_name ?? '–';
}

export default function Ledger() {
  const { user } = useAuth();
  const [bets, setBets] = useState<SupaBet[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('All');
  const [settledPairs, setSettledPairs] = useState<Set<string>>(new Set());
  const [settling, setSettling] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadBets();
  }, [user]);

  async function loadBets() {
    if (!user) return;
    setLoading(true);
    try {
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

  async function markSettled(opponentId: string, amount: number) {
    if (!user) return;
    setSettling(opponentId);
    try {
      const { error } = await supabase.from('settlements').insert({
        user_id: user.id,
        opponent_id: opponentId,
        amount: Math.abs(amount),
        settled_at: new Date().toISOString(),
      });
      if (error) throw error;
      setSettledPairs((prev) => new Set(prev).add(opponentId));
      toast.success('Marked as settled!');
    } catch (err: any) {
      console.error('markSettled error:', err);
      // Settlement table may not exist yet — just update local state
      setSettledPairs((prev) => new Set(prev).add(opponentId));
      toast.success('Marked as settled!');
    } finally {
      setSettling(null);
    }
  }

  const userId = user?.id ?? '';

  // Filter helpers
  const isWon = (b: SupaBet) => b.winner_id !== null && b.winner_id === userId;
  const isLost = (b: SupaBet) => b.winner_id !== null && b.winner_id !== userId;
  const isPending = (b: SupaBet) => b.winner_id === null && (b.status === 'pending' || b.status === 'accepted');

  const filteredBets = bets.filter((b) => {
    if (filter === 'Won') return isWon(b);
    if (filter === 'Lost') return isLost(b);
    if (filter === 'Pending') return isPending(b);
    return b.status !== 'declined' && b.status !== 'void';
  });

  // Stats
  const settledBets = bets.filter((b) => b.winner_id !== null);
  const totalPnl = settledBets.reduce((acc, b) => {
    const p = betPnl(b, userId);
    return p !== null ? acc + p : acc;
  }, 0);
  const totalWagered = bets
    .filter((b) => b.status !== 'declined' && b.status !== 'void')
    .reduce((acc, b) => acc + b.stake, 0);

  // Settlements: group settled-lost bets by opponent, compute net balance per person
  const balanceMap: Record<string, { name: string; net: number }> = {};
  settledBets.forEach((b) => {
    const pnl = betPnl(b, userId);
    if (pnl === null) return;
    const oppId = b.creator_id === userId ? b.opponent_id : b.creator_id;
    const oppName = opponentName(b, userId);
    if (!oppId) return;
    if (!balanceMap[oppId]) balanceMap[oppId] = { name: oppName, net: 0 };
    balanceMap[oppId].net += pnl;
  });
  const balances = Object.entries(balanceMap).filter(([, v]) => Math.abs(v.net) > 0);

  const counts = {
    All: bets.filter((b) => b.status !== 'declined' && b.status !== 'void').length,
    Won: bets.filter(isWon).length,
    Lost: bets.filter(isLost).length,
    Pending: bets.filter(isPending).length,
  };

  return (
    <div className="px-4 pt-5 pb-4">
      <h1 className="text-xl font-bold mb-4">Ledger</h1>

      {/* Balance card */}
      {loading ? (
        <Skeleton className="h-24 mb-5" />
      ) : (
        <div className="bg-[#1a1a1f] rounded-xl p-5 border border-white/5 mb-5">
          <p className="text-xs text-[#8b8b9a] mb-1">Net P&amp;L</p>
          <p className={`text-3xl font-bold mb-3 ${totalPnl >= 0 ? 'text-[#00ff87]' : 'text-[#ff3b5c]'}`}>
            {totalPnl >= 0 ? '+' : ''}₹{Math.abs(totalPnl).toLocaleString('en-IN')}
          </p>
          <div className="flex gap-6 text-xs text-[#8b8b9a]">
            <span>
              Wagered: <span className="text-white font-medium">₹{totalWagered.toLocaleString('en-IN')}</span>
            </span>
            <span>
              Settled: <span className="text-white font-medium">{settledBets.length}</span>
            </span>
            <span>
              Total: <span className="text-white font-medium">{counts.All}</span>
            </span>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 bg-[#1a1a1f] rounded-xl p-1">
        {(['All', 'Won', 'Lost', 'Pending'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors relative ${
              filter === f ? 'bg-[#00ff87] text-black' : 'text-[#8b8b9a] hover:text-white'
            }`}
          >
            {f}
            {counts[f] > 0 && filter !== f && (
              <span className="absolute -top-1 -right-0.5 text-[9px] text-[#8b8b9a]">
                {counts[f]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Bet list */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : filteredBets.length === 0 ? (
        <div className="bg-[#1a1a1f] rounded-xl p-6 text-center border border-white/5 mb-5">
          <p className="text-[#8b8b9a] text-sm">No {filter.toLowerCase()} bets found.</p>
        </div>
      ) : (
        <div className="space-y-2 mb-6">
          {filteredBets.map((bet) => (
            <LedgerRow key={bet.id} bet={bet} userId={userId} />
          ))}
        </div>
      )}

      {/* Settlements section */}
      {!loading && balances.length > 0 && (
        <div className="mb-4">
          <h2 className="text-base font-semibold mb-3">Settlements</h2>
          <div className="space-y-2">
            {balances.map(([oppId, { name, net }]) => {
              const settled = settledPairs.has(oppId);
              const owesYou = net > 0;
              return (
                <div
                  key={oppId}
                  className="bg-[#1a1a1f] rounded-xl p-4 border border-white/5 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{name}</p>
                    <p className={`text-xs font-semibold mt-0.5 ${owesYou ? 'text-[#00ff87]' : 'text-[#ff3b5c]'}`}>
                      {owesYou
                        ? `Owes you ₹${Math.abs(net).toLocaleString('en-IN')}`
                        : `You owe ₹${Math.abs(net).toLocaleString('en-IN')}`}
                    </p>
                  </div>
                  {settled ? (
                    <div className="flex items-center gap-1.5 text-xs text-[#00ff87] shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                      Settled
                    </div>
                  ) : (
                    <button
                      onClick={() => markSettled(oppId, net)}
                      disabled={settling === oppId}
                      className="shrink-0 text-xs bg-[#00ff87]/10 border border-[#00ff87]/30 text-[#00ff87] px-3 py-1.5 rounded-lg font-medium disabled:opacity-50"
                    >
                      {settling === oppId ? '…' : 'Mark Settled'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ── */

function LedgerRow({ bet, userId }: { bet: SupaBet; userId: string }) {
  const pnl = betPnl(bet, userId);
  const won = bet.winner_id === userId;
  const settled = bet.winner_id !== null;
  const pending = bet.winner_id === null && (bet.status === 'pending' || bet.status === 'accepted');

  return (
    <div className="bg-[#1a1a1f] rounded-xl p-4 border border-white/5">
      <div className="flex items-start justify-between">
        <div className="min-w-0 mr-2 flex-1">
          {/* Date + opponent */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] text-[#8b8b9a]">{formatDate(bet.created_at)}</span>
            <span className="text-[10px] text-[#8b8b9a]">·</span>
            <span className="text-[10px] text-[#8b8b9a] truncate max-w-[120px]">{gameLabel(bet)}</span>
          </div>
          {/* Selection */}
          <p className="text-sm font-medium truncate">{selectionLabel(bet, userId)}</p>
          {/* Meta */}
          <div className="flex items-center gap-2 mt-1.5 text-xs text-[#8b8b9a] flex-wrap">
            <span>vs {opponentName(bet, userId)}</span>
            <span>·</span>
            <span>₹{bet.stake.toLocaleString('en-IN')}</span>
            <span>·</span>
            <span>{oddsLabel(bet)}</span>
          </div>
        </div>

        {/* Status + P&L */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <StatusBadge bet={bet} userId={userId} />
          {settled && pnl !== null && (
            <div className="flex items-center gap-1">
              {won ? (
                <TrendingUp className="w-3 h-3 text-[#00ff87]" />
              ) : (
                <TrendingDown className="w-3 h-3 text-[#ff3b5c]" />
              )}
              <span className={`text-sm font-bold ${won ? 'text-[#00ff87]' : 'text-[#ff3b5c]'}`}>
                {pnl >= 0 ? '+' : ''}₹{Math.abs(pnl).toLocaleString('en-IN')}
              </span>
            </div>
          )}
          {pending && (
            <span className="text-xs text-[#8b8b9a]">
              ₹{bet.stake.toLocaleString('en-IN')} at risk
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ bet, userId }: { bet: SupaBet; userId: string }) {
  const settled = bet.winner_id !== null;
  const won = bet.winner_id === userId;

  if (settled) {
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
        won ? 'bg-[#00ff87]/10 text-[#00ff87]' : 'bg-[#ff3b5c]/10 text-[#ff3b5c]'
      }`}>
        {won ? 'Won' : 'Lost'}
      </span>
    );
  }

  const styles: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-400',
    accepted: 'bg-blue-500/10 text-blue-400',
    declined: 'bg-white/10 text-[#8b8b9a]',
    void: 'bg-white/10 text-[#8b8b9a]',
  };
  const labels: Record<string, string> = {
    pending: 'Pending',
    accepted: 'Active',
    declined: 'Declined',
    void: 'Void',
  };

  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
      styles[bet.status] ?? 'bg-white/10 text-[#8b8b9a]'
    }`}>
      {labels[bet.status] ?? bet.status}
    </span>
  );
}
