import { useEffect, useState } from 'react';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { NBAGame, Profile, FriendWithProfile } from '@/types';
import { fetchTodayGames, isGameLive, isGameFinal } from '@/lib/nbaApi';

type OddsFormat = 'custom' | 'american' | 'decimal';
type Step = 1 | 2 | 3 | 4;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  preselectedGame?: NBAGame;
  preselectedFriendId?: string;
  preselectedMarket?: string;
  preselectedSelection?: string;
}

function calcCreatorPayout(stake: number, fmt: OddsFormat, num: string, den: string, am: string, dec: string): number {
  const s = stake;
  if (fmt === 'custom') {
    const n = parseFloat(num) || 1;
    const d = parseFloat(den) || 1;
    return s + s * (d / n);
  }
  if (fmt === 'decimal') return s * (parseFloat(dec) || 1);
  const a = parseFloat(am) || 0;
  if (a > 0) return s + s * (a / 100);
  if (a < 0) return s + s * (100 / Math.abs(a));
  return s;
}

export default function ChallengeModal({
  isOpen,
  onClose,
  preselectedGame,
  preselectedFriendId,
  preselectedMarket,
  preselectedSelection,
}: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>(preselectedGame ? 2 : 1);

  // Step 1
  const [games, setGames] = useState<NBAGame[]>([]);
  const [gamesLoading, setGamesLoading] = useState(false);
  const [selectedGame, setSelectedGame] = useState<NBAGame | null>(preselectedGame ?? null);

  // Step 2
  const MARKETS = ['Moneyline', 'Spread', 'Over/Under', 'Custom Prop'] as const;
  const [market, setMarket] = useState<string>(preselectedMarket ?? '');
  const [customProp, setCustomProp] = useState('');

  // Step 3
  const [creatorSel, setCreatorSel] = useState(preselectedSelection ?? '');
  const [opponentSel, setOpponentSel] = useState('');
  const [oddsFormat, setOddsFormat] = useState<OddsFormat>('custom');
  const [oddsNum, setOddsNum] = useState('1');
  const [oddsDen, setOddsDen] = useState('1');
  const [americanOdds, setAmericanOdds] = useState('-110');
  const [decimalOdds, setDecimalOdds] = useState('1.91');
  const [stake, setStake] = useState('1000');

  // Step 4 — friend picker
  const [friends, setFriends] = useState<Profile[]>([]);
  const [selectedFriendId, setSelectedFriendId] = useState(preselectedFriendId ?? '');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (!preselectedGame) loadGames();
    if (user) loadFriends();
  }, [isOpen, user]);

  async function loadGames() {
    setGamesLoading(true);
    try {
      const data = await fetchTodayGames();
      setGames(data);
    } catch (err) {
      console.error('loadGames error:', err);
      toast.error('Could not load games.');
    } finally {
      setGamesLoading(false);
    }
  }

  async function loadFriends() {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('friends')
        .select('requester:profiles!friends_requester_id_fkey(*), addressee:profiles!friends_addressee_id_fkey(*), requester_id')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
      if (error) throw error;
      setFriends(
        (data ?? []).map((row: any) =>
          row.requester_id === user.id ? row.addressee : row.requester
        )
      );
    } catch (err) {
      console.error('loadFriends error:', err);
    }
  }

  function handleSelectGame(game: NBAGame) {
    setSelectedGame(game);
    setStep(2);
  }

  function handleSelectMarket(m: string) {
    setMarket(m);
    if (m !== 'Custom Prop') setCustomProp('');
    // Auto-fill selections based on market + game
    if (selectedGame) {
      const home = selectedGame.home_team.full_name;
      const away = selectedGame.visitor_team.full_name;
      if (m === 'Moneyline') { setCreatorSel(`${home} to win`); setOpponentSel(`${away} to win`); }
      else if (m === 'Spread') { setCreatorSel(`${home} -1.5`); setOpponentSel(`${away} +1.5`); }
      else if (m === 'Over/Under') { setCreatorSel('Over 222.5'); setOpponentSel('Under 222.5'); }
    }
    setStep(3);
  }

  async function handleSubmit() {
    if (!user || !selectedGame) return;
    const stakeNum = parseFloat(stake);
    if (!stakeNum || stakeNum <= 0) { toast.error('Enter a valid stake.'); return; }
    if (!creatorSel.trim()) { toast.error('Enter your selection.'); return; }
    if (!selectedFriendId && step === 4) { toast.error('Pick a friend to challenge.'); return; }

    const creatorPayout = calcCreatorPayout(stakeNum, oddsFormat, oddsNum, oddsDen, americanOdds, decimalOdds);

    setSubmitting(true);
    try {
      const { error } = await supabase.from('bets').insert({
        creator_id: user.id,
        opponent_id: selectedFriendId || null,
        match_id: String(selectedGame.id),
        bet_type: market === 'Custom Prop' ? 'prop' : market.toLowerCase().replace('/', '_'),
        bet_details: {
          creator_selection: creatorSel.trim(),
          opponent_selection: opponentSel.trim(),
          odds_format: oddsFormat,
          odds_num: oddsFormat === 'custom' ? parseFloat(oddsNum) : undefined,
          odds_den: oddsFormat === 'custom' ? parseFloat(oddsDen) : undefined,
          description: market === 'Custom Prop' ? customProp : undefined,
          home_team: selectedGame.home_team.full_name,
          visitor_team: selectedGame.visitor_team.full_name,
          game_date: selectedGame.date,
        },
        stake: stakeNum,
        creator_payout: creatorPayout,
        opponent_payout: creatorPayout, // winner takes the pot
        status: 'pending',
      });
      if (error) throw error;
      toast.success('Challenge sent! 🎯');
      onClose();
    } catch (err: any) {
      console.error('handleSubmit error:', err);
      toast.error(err.message ?? 'Failed to send challenge.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  const stakeNum = parseFloat(stake) || 0;
  const creatorPayout = calcCreatorPayout(stakeNum, oddsFormat, oddsNum, oddsDen, americanOdds, decimalOdds);

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-[#0d0d0f] w-full max-w-[430px] rounded-t-2xl border border-white/10 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button onClick={() => setStep((s) => (s - 1) as Step)} className="text-[#8b8b9a]">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className="text-base font-bold">Challenge a Friend</h2>
              <p className="text-[10px] text-[#8b8b9a]">Step {step} of 4</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#8b8b9a] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex gap-1 px-5 pt-3">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-[#00ff87]' : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        <div className="px-5 py-4">
          {/* ── STEP 1: Pick Game ── */}
          {step === 1 && (
            <div>
              <p className="text-sm text-[#8b8b9a] mb-4">Select the game you want to bet on:</p>
              {gamesLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-white/5 animate-pulse rounded-xl" />
                  ))}
                </div>
              ) : games.length === 0 ? (
                <p className="text-center text-[#8b8b9a] text-sm py-8">No games available today.</p>
              ) : (
                <div className="space-y-2">
                  {games.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => handleSelectGame(g)}
                      className="w-full bg-[#1a1a1f] rounded-xl p-3 text-left border border-white/5 hover:border-[#00ff87]/30 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">
                            {g.visitor_team.abbreviation} @ {g.home_team.abbreviation}
                          </p>
                          <p className="text-[10px] text-[#8b8b9a] mt-0.5">
                            {g.visitor_team.full_name} vs {g.home_team.full_name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {isGameLive(g.status) && (
                            <span className="text-[10px] font-bold text-[#ff3b5c]">LIVE</span>
                          )}
                          {isGameFinal(g.status) && (
                            <span className="text-[10px] text-[#8b8b9a]">Final</span>
                          )}
                          <span className="text-xs text-[#8b8b9a]">{g.status}</span>
                          <ChevronRight className="w-4 h-4 text-[#8b8b9a]" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: Pick Market ── */}
          {step === 2 && selectedGame && (
            <div>
              <div className="bg-[#1a1a1f] rounded-xl p-3 mb-4 border border-white/5">
                <p className="text-xs text-[#8b8b9a]">Selected game</p>
                <p className="text-sm font-medium mt-0.5">
                  {selectedGame.visitor_team.full_name} @ {selectedGame.home_team.full_name}
                </p>
              </div>
              <p className="text-sm text-[#8b8b9a] mb-3">What are you betting on?</p>
              <div className="space-y-2">
                {MARKETS.map((m) => (
                  <button
                    key={m}
                    onClick={() => handleSelectMarket(m)}
                    className="w-full bg-[#1a1a1f] rounded-xl p-4 text-left border border-white/5 hover:border-[#00ff87]/30 transition-colors flex items-center justify-between"
                  >
                    <span className="text-sm font-medium">{m}</span>
                    <ChevronRight className="w-4 h-4 text-[#8b8b9a]" />
                  </button>
                ))}
              </div>
              {market === 'Custom Prop' && (
                <input
                  type="text"
                  value={customProp}
                  onChange={(e) => setCustomProp(e.target.value)}
                  placeholder="Describe the prop bet…"
                  className="mt-3 w-full bg-[#1a1a1f] border border-white/10 rounded-xl px-4 py-3 text-sm placeholder-[#8b8b9a] focus:outline-none focus:border-[#00ff87]/50"
                />
              )}
            </div>
          )}

          {/* ── STEP 3: Set Terms ── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-[#1a1a1f] rounded-xl p-3 border border-white/5">
                <p className="text-xs text-[#8b8b9a]">Market</p>
                <p className="text-sm font-medium mt-0.5">{market}{customProp ? ` — ${customProp}` : ''}</p>
              </div>

              {/* Selections */}
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-[#8b8b9a] mb-1 block">Your Selection</label>
                  <input
                    type="text"
                    value={creatorSel}
                    onChange={(e) => setCreatorSel(e.target.value)}
                    placeholder="e.g. Lakers to win"
                    className="w-full bg-[#1a1a1f] border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder-[#8b8b9a] focus:outline-none focus:border-[#00ff87]/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#8b8b9a] mb-1 block">Opponent's Selection</label>
                  <input
                    type="text"
                    value={opponentSel}
                    onChange={(e) => setOpponentSel(e.target.value)}
                    placeholder="e.g. Warriors to win"
                    className="w-full bg-[#1a1a1f] border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder-[#8b8b9a] focus:outline-none focus:border-[#00ff87]/50"
                  />
                </div>
              </div>

              {/* Odds format toggle */}
              <div>
                <label className="text-xs text-[#8b8b9a] mb-2 block">Odds Format</label>
                <div className="flex gap-1 bg-black/30 rounded-lg p-0.5">
                  {(['custom', 'american', 'decimal'] as OddsFormat[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => setOddsFormat(f)}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                        oddsFormat === f ? 'bg-[#00ff87] text-black' : 'text-[#8b8b9a] hover:text-white'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Odds input */}
              {oddsFormat === 'custom' ? (
                <div>
                  <label className="text-xs text-[#8b8b9a] mb-2 block">Custom Odds</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number" min="1" value={oddsNum}
                      onChange={(e) => setOddsNum(e.target.value)}
                      className="flex-1 bg-[#1a1a1f] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-center focus:outline-none focus:border-[#00ff87]/50"
                    />
                    <span className="text-[#8b8b9a] font-bold text-xl">:</span>
                    <input
                      type="number" min="1" value={oddsDen}
                      onChange={(e) => setOddsDen(e.target.value)}
                      className="flex-1 bg-[#1a1a1f] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-center focus:outline-none focus:border-[#00ff87]/50"
                    />
                  </div>
                </div>
              ) : oddsFormat === 'american' ? (
                <div>
                  <label className="text-xs text-[#8b8b9a] mb-2 block">American Odds</label>
                  <input
                    type="text" value={americanOdds} onChange={(e) => setAmericanOdds(e.target.value)}
                    placeholder="-110"
                    className="w-full bg-[#1a1a1f] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#00ff87]/50"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-xs text-[#8b8b9a] mb-2 block">Decimal Odds</label>
                  <input
                    type="number" step="0.01" min="1" value={decimalOdds}
                    onChange={(e) => setDecimalOdds(e.target.value)}
                    placeholder="1.91"
                    className="w-full bg-[#1a1a1f] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#00ff87]/50"
                  />
                </div>
              )}

              {/* Stake */}
              <div>
                <label className="text-xs text-[#8b8b9a] mb-2 block">Your Stake</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8b8b9a]">₹</span>
                  <input
                    type="number" min="0" value={stake}
                    onChange={(e) => setStake(e.target.value)}
                    className="w-full bg-[#1a1a1f] border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#00ff87]/50"
                  />
                </div>
              </div>

              {/* Payout preview */}
              {stakeNum > 0 && (
                <div className="bg-[#00ff87]/5 border border-[#00ff87]/20 rounded-xl p-3 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#8b8b9a]">If you win</span>
                    <span className="text-[#00ff87] font-bold">+₹{(creatorPayout - stakeNum).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#8b8b9a]">If opponent wins</span>
                    <span className="text-[#ff3b5c] font-bold">-₹{stakeNum.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}

              <button
                onClick={() => setStep(4)}
                disabled={!creatorSel.trim() || stakeNum <= 0}
                className="w-full bg-[#00ff87] text-black font-bold py-3 rounded-xl text-sm disabled:opacity-40"
              >
                Next — Pick Opponent
              </button>
            </div>
          )}

          {/* ── STEP 4: Confirm & Send ── */}
          {step === 4 && (
            <div className="space-y-4">
              <p className="text-sm text-[#8b8b9a]">Choose who to challenge:</p>

              {friends.length === 0 ? (
                <p className="text-center text-[#8b8b9a] text-sm py-4">
                  No friends yet. Add friends first!
                </p>
              ) : (
                <div className="space-y-2 mb-4">
                  {friends.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFriendId(f.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                        selectedFriendId === f.id
                          ? 'border-[#00ff87] bg-[#00ff87]/10'
                          : 'border-white/10 bg-[#1a1a1f] hover:border-white/30'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-[#00ff87]/10 border border-[#00ff87]/20 flex items-center justify-center text-xs font-bold text-[#00ff87]">
                        {f.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <span className="text-sm font-medium flex-1 text-left">{f.full_name}</span>
                      {selectedFriendId === f.id && <Check className="w-4 h-4 text-[#00ff87]" />}
                    </button>
                  ))}
                </div>
              )}

              {/* Summary */}
              <div className="bg-[#1a1a1f] rounded-xl p-4 border border-white/5 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#8b8b9a]">Game</span>
                  <span className="font-medium">
                    {selectedGame?.visitor_team.abbreviation} @ {selectedGame?.home_team.abbreviation}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b8b9a]">Market</span>
                  <span className="font-medium">{market}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b8b9a]">Your pick</span>
                  <span className="font-medium text-[#00ff87]">{creatorSel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b8b9a]">Stake</span>
                  <span className="font-medium">₹{stakeNum.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b8b9a]">Potential win</span>
                  <span className="font-medium text-[#00ff87]">+₹{(creatorPayout - stakeNum).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || !selectedFriendId}
                className="w-full bg-[#00ff87] text-black font-bold py-3.5 rounded-xl text-sm disabled:opacity-40"
              >
                {submitting ? 'Sending…' : '🎯 Send Challenge'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
