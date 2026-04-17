import { useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useBetSlip } from '@/lib/BetSlipContext';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { BetSelection } from '@/types';

type OddsFormat = 'american' | 'decimal' | 'custom';

interface BetConfig {
  oddsFormat: OddsFormat;
  customNum: string;
  customDen: string;
  americanOdds: string;
  decimalOdds: string;
  stake: string;
}

function getGameLabel(gameId: string): string {
  // game IDs are numeric strings from BallDontLie API
  return gameId ? `Game #${gameId}` : 'Unknown game';
}

function calcReturn(config: BetConfig, stake: number): number {
  if (config.oddsFormat === 'custom') {
    const num = parseFloat(config.customNum) || 1;
    const den = parseFloat(config.customDen) || 1;
    // stake * (den/num) = net profit; total return = stake + profit
    return stake + stake * (den / num);
  }
  if (config.oddsFormat === 'decimal') {
    const dec = parseFloat(config.decimalOdds) || 1;
    return stake * dec;
  }
  // American
  const am = parseFloat(config.americanOdds) || 0;
  if (am > 0) return stake + stake * (am / 100);
  if (am < 0) return stake + stake * (100 / Math.abs(am));
  return stake;
}

function calcParlayReturn(configs: BetConfig[], stakes: number[]): number {
  // Combine all as decimal multipliers
  const combined = configs.reduce((acc, cfg) => {
    let dec = 1;
    if (cfg.oddsFormat === 'custom') {
      const num = parseFloat(cfg.customNum) || 1;
      const den = parseFloat(cfg.customDen) || 1;
      dec = 1 + den / num;
    } else if (cfg.oddsFormat === 'decimal') {
      dec = parseFloat(cfg.decimalOdds) || 1;
    } else {
      const am = parseFloat(cfg.americanOdds) || 0;
      if (am > 0) dec = 1 + am / 100;
      else if (am < 0) dec = 1 + 100 / Math.abs(am);
    }
    return acc * dec;
  }, 1);
  const totalStake = stakes.reduce((a, b) => a + b, 0);
  return totalStake * combined;
}

function defaultConfig(sel: BetSelection): BetConfig {
  return {
    oddsFormat: sel.odds_format === 'custom' ? 'custom' : sel.odds_format,
    customNum: String(sel.custom_odds_numerator ?? '1'),
    customDen: String(sel.custom_odds_denominator ?? '1'),
    americanOdds: sel.odds_format === 'american' ? sel.odds : '-110',
    decimalOdds: sel.odds_format === 'decimal' ? sel.odds : '1.91',
    stake: '1000',
  };
}

export default function BetSlip() {
  const { user } = useAuth();
  const { selections, removeSelection, clearSlip } = useBetSlip();
  const [configs, setConfigs] = useState<Record<string, BetConfig>>(() => {
    const init: Record<string, BetConfig> = {};
    selections.forEach((s) => { init[s.id] = defaultConfig(s); });
    return init;
  });
  const [isParlay, setIsParlay] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(false);
  const navigate = useNavigate();

  const getConfig = (id: string): BetConfig => {
    return configs[id] ?? { oddsFormat: 'custom', customNum: '1', customDen: '1', americanOdds: '-110', decimalOdds: '1.91', stake: '1000' };
  };

  const updateConfig = (id: string, patch: Partial<BetConfig>) => {
    setConfigs((prev) => ({ ...prev, [id]: { ...getConfig(id), ...patch } }));
  };

  const handleRemove = (id: string) => {
    removeSelection(id);
    setConfigs((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const totalStake = selections.reduce((acc, s) => {
    const stake = parseFloat(getConfig(s.id).stake) || 0;
    return acc + stake;
  }, 0);

  const totalReturn = isParlay
    ? calcParlayReturn(
        selections.map((s) => getConfig(s.id)),
        selections.map((s) => parseFloat(getConfig(s.id).stake) || 0)
      )
    : selections.reduce((acc, s) => {
        const cfg = getConfig(s.id);
        return acc + calcReturn(cfg, parseFloat(cfg.stake) || 0);
      }, 0);

  const handlePlaceBet = async () => {
    if (!user) { toast.error('Please sign in first.'); return; }
    setPlacing(true);
    try {
      const rows = selections.map((s) => {
        const cfg = getConfig(s.id);
        const stakeAmt = parseFloat(cfg.stake) || 0;
        const payoutAmt = calcReturn(cfg, stakeAmt);
        return {
          creator_id: user.id,
          opponent_id: null,
          match_id: s.game_id,
          bet_type: s.market.toLowerCase().replace(/[\s/]+/g, '_'),
          bet_details: {
            creator_selection: s.selection_label,
            odds_format: cfg.oddsFormat,
            odds_num: cfg.oddsFormat === 'custom' ? parseInt(cfg.customNum) || 1 : null,
            odds_den: cfg.oddsFormat === 'custom' ? parseInt(cfg.customDen) || 1 : null,
          },
          stake: stakeAmt,
          creator_payout: payoutAmt,
          opponent_payout: null,
          status: 'pending',
          winner_id: null,
        };
      });

      const { error } = await supabase.from('bets').insert(rows);
      if (error) throw error;

      toast.success('Bets placed!');
      setPlaced(true);
      clearSlip();
    } catch (err: any) {
      console.error('handlePlaceBet error:', err);
      toast.error(err.message ?? 'Failed to place bets.');
    } finally {
      setPlacing(false);
    }
  };

  if (placed) {
    return (
      <div className="px-4 pt-5 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-full bg-[#00ff87]/10 flex items-center justify-center mb-4">
          <span className="text-3xl">✅</span>
        </div>
        <h2 className="text-xl font-bold mb-2">Bets Placed!</h2>
        <p className="text-[#8b8b9a] text-sm mb-6">Your bets have been submitted successfully.</p>
        <button
          onClick={() => { setPlaced(false); navigate('/'); }}
          className="bg-[#00ff87] text-black font-bold px-8 py-3 rounded-xl"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (selections.length === 0) {
    return (
      <div className="px-4 pt-5">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">Bet Slip</h1>
        </div>
        <div className="bg-[#1a1a1f] rounded-xl p-8 text-center border border-white/5">
          <p className="text-4xl mb-3">🎟️</p>
          <p className="text-white font-medium mb-1">Your slip is empty</p>
          <p className="text-[#8b8b9a] text-sm mb-5">Add selections from the Games tab.</p>
          <button
            onClick={() => navigate('/games')}
            className="bg-[#00ff87] text-black font-bold px-6 py-2.5 rounded-xl text-sm"
          >
            Browse Games
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-5 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold">Bet Slip</h1>
        <button
          onClick={clearSlip}
          className="text-xs text-[#ff3b5c] flex items-center gap-1"
        >
          <X className="w-3.5 h-3.5" /> Clear All
        </button>
      </div>

      {/* Selections */}
      <div className="space-y-3 mb-4">
        {selections.map((sel) => (
          <BetCard
            key={sel.id}
            selection={sel}
            config={getConfig(sel.id)}
            onUpdate={(patch) => updateConfig(sel.id, patch)}
            onRemove={() => handleRemove(sel.id)}
          />
        ))}
      </div>

      {/* Parlay toggle */}
      {selections.length > 1 && (
        <div className="bg-[#1a1a1f] rounded-xl p-4 border border-white/5 mb-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium">Combine as Parlay</p>
              <p className="text-xs text-[#8b8b9a] mt-0.5">Multiply all odds together</p>
            </div>
            <div
              className={`w-11 h-6 rounded-full transition-colors relative ${
                isParlay ? 'bg-[#00ff87]' : 'bg-white/10'
              }`}
              onClick={() => setIsParlay(!isParlay)}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  isParlay ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </div>
          </label>
        </div>
      )}

      {/* Summary */}
      <div className="bg-[#1a1a1f] rounded-xl p-4 border border-white/5 mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-[#8b8b9a]">Total Stake</span>
          <span className="font-medium">₹{totalStake.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#8b8b9a]">Potential Return</span>
          <span className="font-bold text-[#00ff87]">
            ₹{totalReturn.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className="flex justify-between text-xs text-[#8b8b9a] mt-1 pt-1 border-t border-white/5">
          <span>Net Profit</span>
          <span className="text-[#00ff87]">
            +₹{(totalReturn - totalStake).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>

      {/* Place Bet */}
      <button
        onClick={handlePlaceBet}
        disabled={placing || totalStake === 0}
        className="w-full bg-[#00ff87] text-black font-bold py-4 rounded-xl text-base disabled:opacity-50 transition-opacity"
      >
        {placing ? 'Placing…' : `Place ${isParlay ? 'Parlay ' : ''}Bet${selections.length > 1 && !isParlay ? 's' : ''}`}
      </button>
    </div>
  );
}

/* ── BetCard ── */

function BetCard({
  selection,
  config,
  onUpdate,
  onRemove,
}: {
  selection: BetSelection;
  config: BetConfig;
  onUpdate: (patch: Partial<BetConfig>) => void;
  onRemove: () => void;
}) {
  const stake = parseFloat(config.stake) || 0;
  const potentialReturn = calcReturn(config, stake);
  const profit = potentialReturn - stake;

  return (
    <div className="bg-[#1a1a1f] rounded-xl p-4 border border-white/5">
      {/* Selection header */}
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 mr-2">
          <p className="text-[10px] text-[#8b8b9a] mb-0.5">{getGameLabel(selection.game_id)} · {selection.market}</p>
          <p className="text-sm font-semibold">{selection.selection_label}</p>
        </div>
        <button onClick={onRemove} className="text-[#8b8b9a] hover:text-[#ff3b5c] shrink-0 mt-0.5">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Odds format toggle */}
      <div className="flex gap-1 mb-3 bg-black/30 rounded-lg p-0.5">
        {(['american', 'decimal', 'custom'] as OddsFormat[]).map((fmt) => (
          <button
            key={fmt}
            onClick={() => onUpdate({ oddsFormat: fmt })}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
              config.oddsFormat === fmt
                ? 'bg-[#00ff87] text-black'
                : 'text-[#8b8b9a] hover:text-white'
            }`}
          >
            {fmt === 'over_under' ? 'O/U' : fmt}
          </button>
        ))}
      </div>

      {/* Odds input */}
      {config.oddsFormat === 'custom' ? (
        <div className="flex items-center gap-2 mb-3">
          <label className="text-xs text-[#8b8b9a] w-10 shrink-0">Odds</label>
          <input
            type="number"
            min="1"
            value={config.customNum}
            onChange={(e) => onUpdate({ customNum: e.target.value })}
            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:border-[#00ff87]/50"
          />
          <span className="text-[#8b8b9a] font-bold text-lg">:</span>
          <input
            type="number"
            min="1"
            value={config.customDen}
            onChange={(e) => onUpdate({ customDen: e.target.value })}
            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:border-[#00ff87]/50"
          />
        </div>
      ) : config.oddsFormat === 'american' ? (
        <div className="flex items-center gap-2 mb-3">
          <label className="text-xs text-[#8b8b9a] w-10 shrink-0">Odds</label>
          <input
            type="text"
            value={config.americanOdds}
            onChange={(e) => onUpdate({ americanOdds: e.target.value })}
            placeholder="-110"
            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00ff87]/50"
          />
        </div>
      ) : (
        <div className="flex items-center gap-2 mb-3">
          <label className="text-xs text-[#8b8b9a] w-10 shrink-0">Odds</label>
          <input
            type="number"
            step="0.01"
            min="1"
            value={config.decimalOdds}
            onChange={(e) => onUpdate({ decimalOdds: e.target.value })}
            placeholder="1.91"
            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00ff87]/50"
          />
        </div>
      )}

      {/* Stake input */}
      <div className="flex items-center gap-2 mb-3">
        <label className="text-xs text-[#8b8b9a] w-10 shrink-0">Stake</label>
        <div className="relative w-full">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b8b9a] text-sm">₹</span>
          <input
            type="number"
            min="0"
            value={config.stake}
            onChange={(e) => onUpdate({ stake: e.target.value })}
            className="w-full bg-black/30 border border-white/10 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:border-[#00ff87]/50"
          />
        </div>
      </div>

      {/* Return preview */}
      {stake > 0 && (
        <div className="flex justify-between text-xs pt-2 border-t border-white/5">
          <span className="text-[#8b8b9a]">Potential return</span>
          <span className="text-[#00ff87] font-semibold">
            ₹{potentialReturn.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            {' '}
            <span className="text-[#8b8b9a]">(+₹{profit.toLocaleString('en-IN', { maximumFractionDigits: 0 })})</span>
          </span>
        </div>
      )}
    </div>
  );
}
