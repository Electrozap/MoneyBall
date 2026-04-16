import { useState } from 'react';
import { Search, ChevronDown, ChevronUp, Radio } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockGames, mockMarkets, teamAbbr, GameMarket } from '@/lib/mockData';
import { useBetSlip } from '@/lib/BetSlipContext';
import { Game, BetSelection } from '@/types';

type Tab = 'Today' | 'Tomorrow' | 'Futures';

const TODAY = '2026-04-16';
const TOMORROW = '2026-04-17';

function gameDate(g: Game) {
  return g.start_time.split('T')[0];
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function Games() {
  const [tab, setTab] = useState<Tab>('Today');
  const [search, setSearch] = useState('');
  const [expandedGame, setExpandedGame] = useState<string | null>(null);
  const { selections, addSelection } = useBetSlip();
  const navigate = useNavigate();

  const filteredGames = mockGames.filter((g) => {
    const matchesTab =
      tab === 'Today'
        ? gameDate(g) === TODAY
        : tab === 'Tomorrow'
        ? gameDate(g) === TOMORROW
        : false; // Futures: no games in mock
    const matchesSearch =
      !search ||
      g.home_team.toLowerCase().includes(search.toLowerCase()) ||
      g.away_team.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const toggleGame = (id: string) => {
    setExpandedGame((prev) => (prev === id ? null : id));
  };

  const handleSelect = (selection: BetSelection) => {
    addSelection(selection);
  };

  return (
    <div className="px-4 pt-5 pb-4">
      {/* Header */}
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
              tab === t
                ? 'bg-[#00ff87] text-black'
                : 'text-[#8b8b9a] hover:text-white'
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
      ) : filteredGames.length === 0 ? (
        <div className="bg-[#1a1a1f] rounded-xl p-6 text-center border border-white/5">
          <p className="text-[#8b8b9a] text-sm">No games found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              market={mockMarkets[game.id]}
              expanded={expandedGame === game.id}
              onToggle={() => toggleGame(game.id)}
              onSelect={handleSelect}
              selectedIds={selections.map((s) => s.id)}
            />
          ))}
        </div>
      )}

      {/* Floating Bet Slip button */}
      {selections.length > 0 && (
        <button
          onClick={() => navigate('/bet-slip')}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-[#00ff87] text-black text-sm font-bold px-6 py-3 rounded-full shadow-lg shadow-[#00ff87]/30 flex items-center gap-2 z-40"
        >
          Bet Slip ({selections.length})
        </button>
      )}
    </div>
  );
}

/* ── GameCard ── */

function GameCard({
  game,
  market,
  expanded,
  onToggle,
  onSelect,
  selectedIds,
}: {
  game: Game;
  market: GameMarket;
  expanded: boolean;
  onToggle: () => void;
  onSelect: (s: BetSelection) => void;
  selectedIds: string[];
}) {
  const homeAbbr = teamAbbr[game.home_team] ?? game.home_team;
  const awayAbbr = teamAbbr[game.away_team] ?? game.away_team;

  return (
    <div className="bg-[#1a1a1f] rounded-xl border border-white/5 overflow-hidden">
      {/* Game header — tap to expand */}
      <button className="w-full p-4 text-left" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {/* Live badge */}
            {game.status === 'live' && (
              <div className="flex items-center gap-1.5 mb-2">
                <Radio className="w-3 h-3 text-[#ff3b5c] animate-pulse" />
                <span className="text-[10px] font-bold text-[#ff3b5c] uppercase tracking-wider">
                  Live
                </span>
              </div>
            )}

            {/* Matchup */}
            <div className="flex items-center gap-3">
              <div className="text-center">
                <p className="text-sm font-bold">{awayAbbr}</p>
                {game.status === 'live' && (
                  <p className="text-lg font-bold text-[#00ff87]">{game.away_score}</p>
                )}
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xs text-[#8b8b9a]">@</span>
                {game.status !== 'live' && (
                  <span className="text-[10px] text-[#8b8b9a] mt-0.5">{formatTime(game.start_time)}</span>
                )}
              </div>
              <div className="text-center">
                <p className="text-sm font-bold">{homeAbbr}</p>
                {game.status === 'live' && (
                  <p className="text-lg font-bold text-[#00ff87]">{game.home_score}</p>
                )}
              </div>
            </div>
            <p className="text-[10px] text-[#8b8b9a] mt-1">
              {game.away_team} vs {game.home_team}
            </p>
          </div>

          {/* Quick moneyline preview + expand icon */}
          <div className="flex items-center gap-3 ml-4">
            {market && (
              <div className="flex gap-1.5 text-xs">
                <OddsChip
                  label={awayAbbr}
                  odds={market.moneyline.away.odds}
                  selectionId={`${game.id}-ml-away`}
                  selected={selectedIds.includes(`${game.id}-ml-away`)}
                  onSelect={() =>
                    onSelect({
                      id: `${game.id}-ml-away`,
                      game_id: game.id,
                      market: 'Moneyline',
                      selection_label: `${game.away_team} ML`,
                      odds: market.moneyline.away.odds,
                      odds_format: 'american',
                    })
                  }
                />
                <OddsChip
                  label={homeAbbr}
                  odds={market.moneyline.home.odds}
                  selectionId={`${game.id}-ml-home`}
                  selected={selectedIds.includes(`${game.id}-ml-home`)}
                  onSelect={() =>
                    onSelect({
                      id: `${game.id}-ml-home`,
                      game_id: game.id,
                      market: 'Moneyline',
                      selection_label: `${game.home_team} ML`,
                      odds: market.moneyline.home.odds,
                      odds_format: 'american',
                    })
                  }
                />
              </div>
            )}
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-[#8b8b9a]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#8b8b9a]" />
            )}
          </div>
        </div>
      </button>

      {/* Expanded markets */}
      {expanded && market && (
        <div className="border-t border-white/5 p-4 space-y-4">
          {/* Spread */}
          <MarketRow
            title="Spread"
            options={[
              {
                id: `${game.id}-spread-away`,
                label: market.spread.away.label,
                odds: market.spread.away.odds,
                selection: {
                  id: `${game.id}-spread-away`,
                  game_id: game.id,
                  market: 'Spread',
                  selection_label: market.spread.away.label,
                  odds: market.spread.away.odds,
                  odds_format: 'american',
                },
              },
              {
                id: `${game.id}-spread-home`,
                label: market.spread.home.label,
                odds: market.spread.home.odds,
                selection: {
                  id: `${game.id}-spread-home`,
                  game_id: game.id,
                  market: 'Spread',
                  selection_label: market.spread.home.label,
                  odds: market.spread.home.odds,
                  odds_format: 'american',
                },
              },
            ]}
            selectedIds={selectedIds}
            onSelect={onSelect}
          />

          {/* O/U */}
          <MarketRow
            title={`O/U ${market.over_under.total}`}
            options={[
              {
                id: `${game.id}-ou-over`,
                label: `Over ${market.over_under.total}`,
                odds: market.over_under.over.odds,
                selection: {
                  id: `${game.id}-ou-over`,
                  game_id: game.id,
                  market: 'Over/Under',
                  selection_label: `Over ${market.over_under.total}`,
                  odds: market.over_under.over.odds,
                  odds_format: 'american',
                },
              },
              {
                id: `${game.id}-ou-under`,
                label: `Under ${market.over_under.total}`,
                odds: market.over_under.under.odds,
                selection: {
                  id: `${game.id}-ou-under`,
                  game_id: game.id,
                  market: 'Over/Under',
                  selection_label: `Under ${market.over_under.total}`,
                  odds: market.over_under.under.odds,
                  odds_format: 'american',
                },
              },
            ]}
            selectedIds={selectedIds}
            onSelect={onSelect}
          />

          {/* Props */}
          <div>
            <p className="text-xs text-[#8b8b9a] font-medium mb-2">Player Props</p>
            <div className="space-y-2">
              {market.props.map((prop, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium">{prop.player}</p>
                    <p className="text-[10px] text-[#8b8b9a]">{prop.line}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <OddsChip
                      label={`O ${prop.over.odds}`}
                      odds={prop.over.odds}
                      selectionId={`${game.id}-prop-${i}-over`}
                      selected={selectedIds.includes(`${game.id}-prop-${i}-over`)}
                      onSelect={() =>
                        onSelect({
                          id: `${game.id}-prop-${i}-over`,
                          game_id: game.id,
                          market: 'Props',
                          selection_label: `${prop.player} Over ${prop.line}`,
                          odds: prop.over.odds,
                          odds_format: 'american',
                        })
                      }
                    />
                    <OddsChip
                      label={`U ${prop.under.odds}`}
                      odds={prop.under.odds}
                      selectionId={`${game.id}-prop-${i}-under`}
                      selected={selectedIds.includes(`${game.id}-prop-${i}-under`)}
                      onSelect={() =>
                        onSelect({
                          id: `${game.id}-prop-${i}-under`,
                          game_id: game.id,
                          market: 'Props',
                          selection_label: `${prop.player} Under ${prop.line}`,
                          odds: prop.under.odds,
                          odds_format: 'american',
                        })
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MarketRow({
  title,
  options,
  selectedIds,
  onSelect,
}: {
  title: string;
  options: {
    id: string;
    label: string;
    odds: string;
    selection: BetSelection;
  }[];
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
            <span className="text-xs text-[#8b8b9a] mb-0.5 truncate w-full text-center">
              {opt.label}
            </span>
            <span className="font-bold">{opt.odds}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function OddsChip({
  label,
  odds,
  selectionId,
  selected,
  onSelect,
}: {
  label: string;
  odds: string;
  selectionId: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
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
