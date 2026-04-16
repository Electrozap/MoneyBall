import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, User } from 'lucide-react';
import { mockBets, mockGames, teamAbbr } from '@/lib/mockData';
import { Bet } from '@/types';

// TODO: Replace with Supabase query:
// const { data: bets } = await supabase
//   .from('bets')
//   .select('*')
//   .eq('created_by', USER_ID)
//   .order('created_at', { ascending: false });
const bets = mockBets;

function calcReturn(bet: Bet): number {
  if (bet.odds_format === 'custom' && bet.custom_odds_numerator && bet.custom_odds_denominator) {
    return bet.stake + bet.stake * (bet.custom_odds_denominator / bet.custom_odds_numerator);
  }
  return bet.stake * 2;
}

function calcPnl(bets: Bet[]): number {
  return bets.reduce((acc, b) => {
    if (b.status === 'won') return acc + (calcReturn(b) - b.stake);
    if (b.status === 'lost') return acc - b.stake;
    return acc;
  }, 0);
}

function formatOdds(bet: Bet): string {
  if (bet.odds_format === 'custom' && bet.custom_odds_numerator && bet.custom_odds_denominator) {
    return `${bet.custom_odds_numerator}:${bet.custom_odds_denominator}`;
  }
  return '–';
}

function getGameLabel(gameId: string): string {
  const g = mockGames.find((g) => g.id === gameId);
  if (!g) return gameId;
  return `${teamAbbr[g.away_team] ?? g.away_team} @ ${teamAbbr[g.home_team] ?? g.home_team}`;
}

export default function Dashboard() {
  const pendingBets = bets.filter((b) => b.status === 'pending');
  const settledBets = bets
    .filter((b) => b.status === 'won' || b.status === 'lost')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const totalPnl = calcPnl(bets);
  const wonBets = bets.filter((b) => b.status === 'won');
  const settledCount = bets.filter((b) => b.status === 'won' || b.status === 'lost').length;
  const winRate = settledCount > 0 ? Math.round((wonBets.length / settledCount) * 100) : 0;

  return (
    <div className="px-4 pt-5 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">MoneyBall 🏀</h1>
          <p className="text-[#8b8b9a] text-sm mt-0.5">Your bets. Your rules.</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-[#1a1a1f] border border-white/10 flex items-center justify-center">
          <User className="w-5 h-5 text-[#8b8b9a]" />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard
          label="P&L"
          value={`${totalPnl >= 0 ? '+' : ''}₹${Math.abs(totalPnl).toLocaleString('en-IN')}`}
          positive={totalPnl >= 0}
        />
        <StatCard label="Active" value={`${pendingBets.length}`} neutral />
        <StatCard
          label="Win Rate"
          value={`${winRate}%`}
          positive={winRate >= 50}
        />
      </div>

      {/* Active Bets */}
      <Section title="Active Bets" count={pendingBets.length}>
        {pendingBets.length === 0 ? (
          <EmptyState message="No active bets. Head to Games to place one." />
        ) : (
          <div className="space-y-3">
            {pendingBets.map((bet) => (
              <ActiveBetCard key={bet.id} bet={bet} />
            ))}
          </div>
        )}
      </Section>

      {/* Recent Results */}
      <Section title="Recent Results" count={settledBets.length}>
        {settledBets.length === 0 ? (
          <EmptyState message="No settled bets yet." />
        ) : (
          <div className="space-y-2">
            {settledBets.map((bet) => (
              <ResultRow key={bet.id} bet={bet} />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

/* ── Sub-components ── */

function StatCard({
  label,
  value,
  positive,
  neutral,
}: {
  label: string;
  value: string;
  positive?: boolean;
  neutral?: boolean;
}) {
  const color = neutral ? 'text-white' : positive ? 'text-[#00ff87]' : 'text-[#ff3b5c]';

  return (
    <div className="bg-[#1a1a1f] rounded-xl p-3 border border-white/5">
      <p className="text-[#8b8b9a] text-xs mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold">{title}</h2>
        {count > 0 && (
          <span className="text-xs text-[#8b8b9a] bg-white/5 px-2 py-0.5 rounded-full">
            {count}
          </span>
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

function ActiveBetCard({ bet }: { bet: Bet }) {
  const potentialReturn = calcReturn(bet);
  const profit = potentialReturn - bet.stake;

  return (
    <div className="bg-[#1a1a1f] rounded-xl p-4 border border-white/5">
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0 mr-2">
          <p className="text-xs text-[#8b8b9a] mb-0.5">{getGameLabel(bet.game_id)}</p>
          <p className="text-sm font-medium truncate">{bet.selection}</p>
        </div>
        <span className="text-xs bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded-full shrink-0">
          Pending
        </span>
      </div>
      <div className="flex items-center justify-between text-xs text-[#8b8b9a] mt-2 pt-2 border-t border-white/5">
        <span>
          Stake: <span className="text-white font-medium">₹{bet.stake.toLocaleString('en-IN')}</span>
        </span>
        <span>
          Odds: <span className="text-white font-medium">{formatOdds(bet)}</span>
        </span>
        <span>
          Win: <span className="text-[#00ff87] font-medium">+₹{profit.toLocaleString('en-IN')}</span>
        </span>
      </div>
    </div>
  );
}

function ResultRow({ bet }: { bet: Bet }) {
  const isWon = bet.status === 'won';
  const pnl = isWon ? calcReturn(bet) - bet.stake : -bet.stake;

  return (
    <div className="bg-[#1a1a1f] rounded-xl px-4 py-3 flex items-center justify-between border border-white/5">
      <div className="min-w-0">
        <p className="text-xs text-[#8b8b9a] mb-0.5 truncate">{getGameLabel(bet.game_id)}</p>
        <p className="text-sm font-medium truncate">{bet.selection}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-3">
        {isWon ? (
          <TrendingUp className="w-3.5 h-3.5 text-[#00ff87]" />
        ) : (
          <TrendingDown className="w-3.5 h-3.5 text-[#ff3b5c]" />
        )}
        <span className={`text-sm font-semibold ${isWon ? 'text-[#00ff87]' : 'text-[#ff3b5c]'}`}>
          {pnl >= 0 ? '+' : ''}₹{Math.abs(pnl).toLocaleString('en-IN')}
        </span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            isWon ? 'bg-[#00ff87]/10 text-[#00ff87]' : 'bg-[#ff3b5c]/10 text-[#ff3b5c]'
          }`}
        >
          {isWon ? 'Won' : 'Lost'}
        </span>
      </div>
    </div>
  );
}
