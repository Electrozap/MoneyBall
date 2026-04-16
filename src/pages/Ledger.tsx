import { useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { mockBets, mockGames, teamAbbr } from '@/lib/mockData';
import { Bet } from '@/types';

// TODO: Replace with Supabase query:
// const { data: bets } = await supabase
//   .from('bets')
//   .select('*')
//   .eq('created_by', USER_ID)
//   .order('created_at', { ascending: false });
const allBets = mockBets;

type Filter = 'All' | 'Won' | 'Lost' | 'Pending';

function getGameLabel(gameId: string): string {
  const g = mockGames.find((g) => g.id === gameId);
  if (!g) return gameId;
  return `${teamAbbr[g.away_team] ?? g.away_team} @ ${teamAbbr[g.home_team] ?? g.home_team}`;
}

function calcReturn(bet: Bet): number {
  if (bet.odds_format === 'custom' && bet.custom_odds_numerator && bet.custom_odds_denominator) {
    return bet.stake + bet.stake * (bet.custom_odds_denominator / bet.custom_odds_numerator);
  }
  return bet.stake * 2;
}

function calcPnl(bet: Bet): number | null {
  if (bet.status === 'won') return calcReturn(bet) - bet.stake;
  if (bet.status === 'lost') return -bet.stake;
  return null;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function formatOdds(bet: Bet): string {
  if (bet.odds_format === 'custom' && bet.custom_odds_numerator && bet.custom_odds_denominator) {
    return `${bet.custom_odds_numerator}:${bet.custom_odds_denominator}`;
  }
  return '–';
}

export default function Ledger() {
  const [filter, setFilter] = useState<Filter>('All');

  const filteredBets = allBets
    .filter((b) => {
      if (filter === 'All') return true;
      if (filter === 'Won') return b.status === 'won';
      if (filter === 'Lost') return b.status === 'lost';
      if (filter === 'Pending') return b.status === 'pending';
      return true;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Balance = sum of all won profits - sum of all lost stakes
  const balance = allBets.reduce((acc, b) => {
    const pnl = calcPnl(b);
    return pnl !== null ? acc + pnl : acc;
  }, 0);

  const totalWagered = allBets.reduce((acc, b) => acc + b.stake, 0);

  return (
    <div className="px-4 pt-5 pb-4">
      {/* Header */}
      <h1 className="text-xl font-bold mb-4">Ledger</h1>

      {/* Balance card */}
      <div className="bg-[#1a1a1f] rounded-xl p-5 border border-white/5 mb-5">
        <p className="text-xs text-[#8b8b9a] mb-1">Total Balance</p>
        <p className={`text-3xl font-bold mb-3 ${balance >= 0 ? 'text-[#00ff87]' : 'text-[#ff3b5c]'}`}>
          {balance >= 0 ? '+' : ''}₹{Math.abs(balance).toLocaleString('en-IN')}
        </p>
        <div className="flex gap-6 text-xs text-[#8b8b9a]">
          <span>
            Wagered: <span className="text-white font-medium">₹{totalWagered.toLocaleString('en-IN')}</span>
          </span>
          <span>
            Bets: <span className="text-white font-medium">{allBets.length}</span>
          </span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 bg-[#1a1a1f] rounded-xl p-1">
        {(['All', 'Won', 'Lost', 'Pending'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
              filter === f
                ? 'bg-[#00ff87] text-black'
                : 'text-[#8b8b9a] hover:text-white'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Bet list */}
      {filteredBets.length === 0 ? (
        <div className="bg-[#1a1a1f] rounded-xl p-6 text-center border border-white/5">
          <p className="text-[#8b8b9a] text-sm">No {filter.toLowerCase()} bets found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredBets.map((bet) => (
            <LedgerRow key={bet.id} bet={bet} />
          ))}
        </div>
      )}
    </div>
  );
}

function LedgerRow({ bet }: { bet: Bet }) {
  const pnl = calcPnl(bet);
  const isWon = bet.status === 'won';
  const isLost = bet.status === 'lost';
  const isPending = bet.status === 'pending';

  return (
    <div className="bg-[#1a1a1f] rounded-xl p-4 border border-white/5">
      <div className="flex items-start justify-between">
        <div className="min-w-0 mr-2 flex-1">
          {/* Date + game */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] text-[#8b8b9a]">{formatDate(bet.created_at)}</span>
            <span className="text-[10px] text-[#8b8b9a]">·</span>
            <span className="text-[10px] text-[#8b8b9a]">{getGameLabel(bet.game_id)}</span>
          </div>
          {/* Selection */}
          <p className="text-sm font-medium truncate">{bet.selection}</p>
          {/* Meta row */}
          <div className="flex items-center gap-3 mt-1.5 text-xs text-[#8b8b9a]">
            <span>
              ₹{bet.stake.toLocaleString('en-IN')} stake
            </span>
            <span>·</span>
            <span>Odds {formatOdds(bet)}</span>
            <span>·</span>
            <span className="capitalize">{bet.bet_type.replace('_', ' ')}</span>
          </div>
        </div>

        {/* Right side: status badge + P&L */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <StatusBadge status={bet.status} />
          {pnl !== null && (
            <div className="flex items-center gap-1">
              {isWon ? (
                <TrendingUp className="w-3 h-3 text-[#00ff87]" />
              ) : (
                <TrendingDown className="w-3 h-3 text-[#ff3b5c]" />
              )}
              <span className={`text-sm font-bold ${isWon ? 'text-[#00ff87]' : 'text-[#ff3b5c]'}`}>
                {pnl >= 0 ? '+' : ''}₹{Math.abs(pnl).toLocaleString('en-IN')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Bet['status'] }) {
  const styles = {
    won: 'bg-[#00ff87]/10 text-[#00ff87]',
    lost: 'bg-[#ff3b5c]/10 text-[#ff3b5c]',
    pending: 'bg-yellow-500/10 text-yellow-400',
    void: 'bg-white/10 text-[#8b8b9a]',
  };
  const labels = { won: 'Won', lost: 'Lost', pending: 'Pending', void: 'Void' };

  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
