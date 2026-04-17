import { useEffect, useState } from 'react';
import { Search, ChevronDown, ChevronUp, Radio, Swords } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBetSlip } from '@/lib/BetSlipContext';
import { BetSelection, NBAGame } from '@/types';
import {
  fetchTodayGames,
  fetchTomorrowGames,
  generateMarkets,
  isGameLive,
  isGameFinal,
  formatGameStatus,
} from '@/lib/nbaApi';
import ChallengeModal from '@/components/ChallengeModal';

type Tab = 'Today' | 'Tomorrow' | 'Futures';

function Skeleton() {
  return (
    <div className="bg-[#1a1a1f] rounded-xl border border-white/5 p-4 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="space-y-2">
          <div className="h-3 w-32 bg-white/10 rounded" />
          <div className="h-4 w-24 bg-white/10 rounded" />
        </div>
        <div className="flex gap-1.5">
          <div className="h-7 w-14 bg-white/10 rounded-lg" />
          <div className="h-7 w-14 bg-white/10 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function Games() {
  const [tab, setTab] = useState<Tab>('Today');
  const [search, setSearch] = useState('');
  const [todayGames, setTodayGames] = useState<NBAGame[]>([]);
  const [tomorrowGames, setTomorrowGames] = useState<NBAGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGame, setExpandedGame] = useState<number | null>(null);
  const [challengeGame, setChallengeGame] = useState<NBAGame | null>(null);
  const { selections, addSelection } = useBetSlip();
  const navigate = useNavigate();

  useEffect(() => {
    loadGames();
  }, []);

  async function loadGames() {
    setLoading(true);
    try {
      const [today, tomorrow] = await Promise.allSettled([
        fetchTodayGames(),
        fetchTomorrowGames(),
      ]);
      setTodayGames(today.status === 'fulfilled' ? today.value : []);
      setTomorrowGames(tomorrow.status === 'fulfilled' ? tomorrow.value : []);
    } catch (err) {
      console.error('loadGames error:', err);
    } finally {
      setLoading(false);
    }
  }

  const activeGames = tab === 'Today' ? todayGames : tab === 'Tomorrow' ? tomorrowGames : [];

  const filteredGames = activeGames.filter((g) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      g.home_team.full_name.toLowerCase().includes(q) ||
      g.visitor_team.full_name.toLowerCase().includes(q) ||
      g.home_team.abbreviation.toLowerCase().includes(q) ||
      g.visitor_team.abbreviation.toLowerCase().includes(q)
    );
  });

  return (
    <div className="px-4 pt-5 pb-4">
      <h1 className="text-xl font-bold mb-4">Games</h1>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b8b9a]" />
        <input
          type="text"
          placeholder="Search teams…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#1a1a1f] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm placeholder-[#8b8b9a] focus:outline-none focus:border-[#00ff87]/50"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-[#1a1a1f] rounded-xl p-1">
        {(['Today', 'Tomorrow', 'Futures'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === t ? 'bg-[#00ff87] text-black' : 'text-[#8b8b9a] hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Game list */}
      {tab === 'Futures' ? (
        <div className="bg-[#1a1a1f] rounded-xl p-6 text-center border border-white/5">
          <p className="text-[#8b8b9a] text-sm">Futures markets coming soon.</p>
        </div>
      ) : loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} />)}
        </div>
      ) : filteredGames.length === 0 ? (
        <div className="bg-[#1a1a1f] rounded-xl p-6 text-center border border-white/5">
          <p className="text-[#8b8b9a] text-sm">
            {search ? 'No games match your search.' : 'No games scheduled.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              expanded={expandedGame === game.id}
              onToggle={() => setExpandedGame((prev) => (prev === game.id ? null : game.id))}
              onSelect={(sel) => addSelection(sel)}
              onChallenge={() => setChallengeGame(game)}
              selectedIds={selections.map((s) => s.id)}
            />
          ))}
        </div>
      )}

      {/* Floating Bet Slip button */}
      {selections.length > 0 && (
        <button
          onClick={() => navigate('/bet-slip')}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-[#00ff87] text-black text-sm font-bold px-6 py-3 rounded-full shadow-lg shadow-[#00ff87]/30 z-40"
        >
          Bet Slip ({selections.length})
        </button>
      )}

      {/* Challenge modal */}
      {challengeGame && (
        <ChallengeModal
          isOpen={!!challengeGame}
          onClose={() => setChallengeGame(null)}
          preselectedGame={challengeGame}
        />
      )}
    </div>
  );
}

/* ── GameCard ── */
function GameCard({
  game,
  expanded,
  onToggle,
  onSelect,
  onChallenge,
  selectedIds,
}: {
  game: NBAGame;
  expanded: boolean;
  onToggle: () => void;
  onSelect: (s: BetSelection) => void;
  onChallenge: () => void;
  selectedIds: string[];
}) {
  const market = generateMarkets(game);
  const live = isGameLive(game.status);
  const final = isGameFinal(game.status);
  const gameIdStr = String(game.id);

  return (
    <div className="bg-[#1a1a1f] rounded-xl border border-white/5 overflow-hidden">
      <button className="w-full p-4 text-left" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {/* Status badge */}
            {live && (
              <div className="flex items-center gap-1.5 mb-2">
                <Radio className="w-3 h-3 text-[#ff3b5c] animate-pulse" />
                <span className="text-[10px] font-bold text-[#ff3b5c] uppercase tracking-wider">Live · {game.status}</span>
              </div>
            )}
            {final && (
              <div className="mb-2">
                <span className="text-[10px] font-bold text-[#8b8b9a] uppercase tracking-wider">Final</span>
              </div>
            )}

            {/* Matchup */}
            <div className="flex items-center gap-3">
              <div className="text-center">
                <p className="text-sm font-bold">{game.visitor_team.abbreviation}</p>
                {(live || final) && (
                  <p className={`text-lg font-bold ${live ? 'text-[#00ff87]' : 'text-white'}`}>
                    {game.visitor_team_score}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xs text-[#8b8b9a]">@</span>
                {!live && !final && (
                  <span className="text-[10px] text-[#8b8b9a] mt-0.5">{formatGameStatus(game)}</span>
                )}
              </div>
              <div className="text-center">
                <p className="text-sm font-bold">{game.home_team.abbreviation}</p>
                {(live || final) && (
                  <p className={`text-lg font-bold ${live ? 'text-[#00ff87]' : 'text-white'}`}>
                    {game.home_team_score}
                  </p>
                )}
              </div>
            </div>
            <p className="text-[10px] text-[#8b8b9a] mt-1">
              {game.visitor_team.full_name} vs {game.home_team.full_name}
            </p>
          </div>

          {/* Quick ML odds + expand */}
          <div className="flex items-center gap-2 ml-3">
            <div className="flex gap-1 text-xs">
              <OddsChip
                label={game.visitor_team.abbreviation}
                odds={market.moneyline.away.odds}
                selectionId={`${gameIdStr}-ml-away`}
                selected={selectedIds.includes(`${gameIdStr}-ml-away`)}
                onSelect={() => onSelect({
                  id: `${gameIdStr}-ml-away`,
                  game_id: gameIdStr,
                  market: 'Moneyline',
                  selection_label: `${game.visitor_team.full_name} ML`,
                  odds: market.moneyline.away.odds,
                  odds_format: 'american',
                })}
              />
              <OddsChip
                label={game.home_team.abbreviation}
                odds={market.moneyline.home.odds}
                selectionId={`${gameIdStr}-ml-home`}
                selected={selectedIds.includes(`${gameIdStr}-ml-home`)}
                onSelect={() => onSelect({
                  id: `${gameIdStr}-ml-home`,
                  game_id: gameIdStr,
                  market: 'Moneyline',
                  selection_label: `${game.home_team.full_name} ML`,
                  odds: market.moneyline.home.odds,
                  odds_format: 'american',
                })}
              />
            </div>
            {expanded ? <ChevronUp className="w-4 h-4 text-[#8b8b9a]" /> : <ChevronDown className="w-4 h-4 text-[#8b8b9a]" />}
          </div>
        </div>
      </button>

      {/* Expanded markets */}
      {expanded && (
        <div className="border-t border-white/5 p-4 space-y-4">
          {/* Challenge button */}
          <button
            onClick={(e) => { e.stopPropagation(); onChallenge(); }}
            className="w-full flex items-center justify-center gap-2 border border-[#00ff87]/30 bg-[#00ff87]/5 text-[#00ff87] text-sm font-medium py-2.5 rounded-xl"
          >
            <Swords className="w-4 h-4" /> Challenge a Friend on This Game
          </button>

          {/* Spread */}
          <MarketRow
            title="Spread"
            options={[
              { id: `${gameIdStr}-spread-away`, label: market.spread.away.label, odds: market.spread.away.odds,
                selection: { id: `${gameIdStr}-spread-away`, game_id: gameIdStr, market: 'Spread', selection_label: market.spread.away.label, odds: market.spread.away.odds, odds_format: 'american' } },
              { id: `${gameIdStr}-spread-home`, label: market.spread.home.label, odds: market.spread.home.odds,
                selection: { id: `${gameIdStr}-spread-home`, game_id: gameIdStr, market: 'Spread', selection_label: market.spread.home.label, odds: market.spread.home.odds, odds_format: 'american' } },
            ]}
            selectedIds={selectedIds}
            onSelect={onSelect}
          />

          {/* Over/Under */}
          <MarketRow
            title={`O/U ${market.over_under.total}`}
            options={[
              { id: `${gameIdStr}-ou-over`, label: `Over ${market.over_under.total}`, odds: market.over_under.over.odds,
                selection: { id: `${gameIdStr}-ou-over`, game_id: gameIdStr, market: 'Over/Under', selection_label: `Over ${market.over_under.total}`, odds: market.over_under.over.odds, odds_format: 'american' } },
              { id: `${gameIdStr}-ou-under`, label: `Under ${market.over_under.total}`, odds: market.over_under.under.odds,
                selection: { id: `${gameIdStr}-ou-under`, game_id: gameIdStr, market: 'Over/Under', selection_label: `Under ${market.over_under.total}`, odds: market.over_under.under.odds, odds_format: 'american' } },
            ]}
            selectedIds={selectedIds}
            onSelect={onSelect}
          />

          <p className="text-[10px] text-[#8b8b9a] text-center italic">
            Odds are illustrative — set custom odds when challenging a friend
          </p>
        </div>
      )}
    </div>
  );
}

function MarketRow({ title, options, selectedIds, onSelect }: {
  title: string;
  options: { id: string; label: string; odds: string; selection: BetSelection }[];
  selectedIds: string[];
  onSelect: (s: BetSelection) => void;
}) {
  return (
    <div>
      <p className="text-xs text-[#8b8b9a] font-medium mb-2">{title}</p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onSelect(opt.selection)}
            className={`flex flex-col items-center py-2.5 px-3 rounded-lg border text-sm transition-colors ${
              selectedIds.includes(opt.id)
                ? 'border-[#00ff87] bg-[#00ff87]/10 text-[#00ff87]'
                : 'border-white/10 bg-white/5 text-white hover:border-white/30'
            }`}
          >
            <span className="text-xs text-[#8b8b9a] mb-0.5 truncate w-full text-center">{opt.label}</span>
            <span className="font-bold">{opt.odds}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function OddsChip({ label, odds, selectionId, selected, onSelect }: {
  label: string; odds: string; selectionId: string; selected: boolean; onSelect: () => void;
}) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      className={`px-2 py-1 rounded-lg text-xs font-semibold border transition-colors ${
        selected
          ? 'border-[#00ff87] bg-[#00ff87]/10 text-[#00ff87]'
          : 'border-white/10 bg-white/5 text-white hover:border-white/30'
      }`}
    >
      {label} <span className="opacity-70">{odds}</span>
    </button>
  );
}
