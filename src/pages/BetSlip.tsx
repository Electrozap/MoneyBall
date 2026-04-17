import { useEffect, useState } from 'react';
import { Trash2, X, Swords, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useBetSlip } from '@/lib/BetSlipContext';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { BetSelection, Profile } from '@/types';

/* ── Helpers ── */

function calcCreatorPayout(stake: number, num: number, den: number): number {
  // Creator bets stake at N:D odds → wins den/num * stake net
  return stake + stake * (den / num);
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div className="w-8 h-8 rounded-full bg-[#00ff87]/10 border border-[#00ff87]/20 flex items-center justify-center text-xs font-bold text-[#00ff87] shrink-0">
      {initials}
    </div>
  );
}

/* ── Main page ── */

export default function BetSlip() {
  const { user } = useAuth();
  const { selections, removeSelection, clearSlip } = useBetSlip();
  const navigate = useNavigate();

  // Per-selection config: stake + custom N:M odds
  const [configs, setConfigs] = useState<Record<string, { stake: string; num: string; den: string }>>({});
  const [friends, setFriends] = useState<Profile[]>([]);
  const [selectedFriendId, setSelectedFriendId] = useState<string>('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (user) loadFriends();
  }, [user]);

  // Seed default config for any new selection
  useEffect(() => {
    setConfigs((prev) => {
      const next = { ...prev };
      selections.forEach((s) => {
        if (!next[s.id]) next[s.id] = { stake: '500', num: '1', den: '1' };
      });
      return next;
    });
  }, [selections]);

  async function loadFriends() {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('friends')
        .select('*, friend_profile:profiles!friends_addressee_id_fkey(id, full_name, email, avatar_url), requester_profile:profiles!friends_requester_id_fkey(id, full_name, email, avatar_url)')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
      if (error) throw error;
      const list: Profile[] = (data ?? []).map((row: any) =>
        row.requester_id === user.id ? row.friend_profile : row.requester_profile
      );
      setFriends(list);
      if (list.length > 0) setSelectedFriendId(list[0].id);
    } catch (err) {
      console.error('loadFriends error:', err);
    }
  }

  const getConfig = (id: string) =>
    configs[id] ?? { stake: '500', num: '1', den: '1' };

  const updateConfig = (id: string, patch: Partial<{ stake: string; num: string; den: string }>) => {
    setConfigs((prev) => ({ ...prev, [id]: { ...getConfig(id), ...patch } }));
  };

  const handleRemove = (id: string) => {
    removeSelection(id);
    setConfigs((prev) => { const n = { ...prev }; delete n[id]; return n; });
  };

  async function handleSendChallenges() {
    if (!user) return;
    if (!selectedFriendId) { toast.error('Pick a friend to challenge.'); return; }
    if (selections.length === 0) return;

    setSending(true);
    try {
      const rows = selections.map((s) => {
        const cfg = getConfig(s.id);
        const stake = parseFloat(cfg.stake) || 0;
        const num = parseInt(cfg.num) || 1;
        const den = parseInt(cfg.den) || 1;
        const payout = calcCreatorPayout(stake, num, den);
        return {
          creator_id: user.id,
          opponent_id: selectedFriendId,
          match_id: s.game_id,
          bet_type: s.market.toLowerCase().replace(/[\s/]+/g, '_'),
          bet_details: {
            creator_selection: s.selection_label,
            odds_format: 'custom',
            odds_num: num,
            odds_den: den,
          },
          stake,
          creator_payout: payout,
          status: 'pending',
          winner_id: null,
        };
      });

      const { error } = await supabase.from('bets').insert(rows);
      if (error) throw error;

      toast.success(`${rows.length} challenge${rows.length > 1 ? 's' : ''} sent!`);
      setSent(true);
      clearSlip();
    } catch (err: any) {
      console.error('sendChallenges error:', err);
      toast.error(err.message ?? 'Failed to send challenges.');
    } finally {
      setSending(false);
    }
  }

  /* ── Sent confirmation ── */
  if (sent) {
    return (
      <div className="px-4 pt-5 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-full bg-[#00ff87]/10 flex items-center justify-center mb-4">
          <Swords className="w-8 h-8 text-[#00ff87]" />
        </div>
        <h2 className="text-xl font-bold mb-2">Challenges Sent!</h2>
        <p className="text-[#8b8b9a] text-sm mb-6">
          Your friend will see them on their Dashboard.
        </p>
        <button
          onClick={() => { setSent(false); navigate('/'); }}
          className="bg-[#00ff87] text-black font-bold px-8 py-3 rounded-xl"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  /* ── Empty slip ── */
  if (selections.length === 0) {
    return (
      <div className="px-4 pt-5">
        <h1 className="text-xl font-bold mb-6">Challenge Builder</h1>
        <div className="bg-[#1a1a1f] rounded-xl p-8 text-center border border-white/5">
          <Swords className="w-10 h-10 text-[#8b8b9a] mx-auto mb-3" />
          <p className="text-white font-medium mb-1">No selections yet</p>
          <p className="text-[#8b8b9a] text-sm mb-5">
            Tap the odds on any game to add it here, then challenge a friend.
          </p>
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

  const selectedFriend = friends.find((f) => f.id === selectedFriendId);

  return (
    <div className="px-4 pt-5 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold">Challenge Builder</h1>
        <button onClick={clearSlip} className="text-xs text-[#ff3b5c] flex items-center gap-1">
          <X className="w-3.5 h-3.5" /> Clear All
        </button>
      </div>

      {/* Selections */}
      <div className="space-y-3 mb-5">
        {selections.map((sel) => (
          <SelectionCard
            key={sel.id}
            selection={sel}
            config={getConfig(sel.id)}
            onUpdate={(patch) => updateConfig(sel.id, patch)}
            onRemove={() => handleRemove(sel.id)}
          />
        ))}
      </div>

      {/* Friend picker */}
      <div className="bg-[#1a1a1f] rounded-xl p-4 border border-white/5 mb-4">
        <p className="text-xs text-[#8b8b9a] mb-3 font-medium uppercase tracking-wide">Challenge</p>
        {friends.length === 0 ? (
          <p className="text-sm text-[#8b8b9a]">
            No friends yet.{' '}
            <button onClick={() => navigate('/friends')} className="text-[#00ff87] underline">
              Add some
            </button>{' '}
            first.
          </p>
        ) : (
          <div className="relative">
            <select
              value={selectedFriendId}
              onChange={(e) => setSelectedFriendId(e.target.value)}
              className="w-full appearance-none bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00ff87]/50 pr-10"
            >
              {friends.map((f) => (
                <option key={f.id} value={f.id}>{f.full_name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b8b9a] pointer-events-none" />
          </div>
        )}

        {selectedFriend && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
            <Avatar name={selectedFriend.full_name} />
            <div>
              <p className="text-sm font-medium">{selectedFriend.full_name}</p>
              <p className="text-xs text-[#8b8b9a]">{selections.length} challenge{selections.length > 1 ? 's' : ''} will be sent</p>
            </div>
          </div>
        )}
      </div>

      {/* Send button */}
      <button
        onClick={handleSendChallenges}
        disabled={sending || friends.length === 0}
        className="w-full bg-[#00ff87] text-black font-bold py-4 rounded-xl text-base disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <Swords className="w-5 h-5" />
        {sending ? 'Sending…' : `Send Challenge${selections.length > 1 ? 's' : ''}`}
      </button>
    </div>
  );
}

/* ── SelectionCard ── */

function SelectionCard({
  selection,
  config,
  onUpdate,
  onRemove,
}: {
  selection: BetSelection;
  config: { stake: string; num: string; den: string };
  onUpdate: (patch: Partial<{ stake: string; num: string; den: string }>) => void;
  onRemove: () => void;
}) {
  const stake = parseFloat(config.stake) || 0;
  const num = parseInt(config.num) || 1;
  const den = parseInt(config.den) || 1;
  const payout = stake > 0 ? calcCreatorPayout(stake, num, den) : 0;
  const profit = payout - stake;

  return (
    <div className="bg-[#1a1a1f] rounded-xl p-4 border border-white/5">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 mr-2">
          <p className="text-[10px] text-[#8b8b9a] mb-0.5">{selection.market}</p>
          <p className="text-sm font-semibold">{selection.selection_label}</p>
        </div>
        <button onClick={onRemove} className="text-[#8b8b9a] hover:text-[#ff3b5c] shrink-0 mt-0.5">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Odds N:M */}
      <div className="flex items-center gap-2 mb-3">
        <label className="text-xs text-[#8b8b9a] w-10 shrink-0">Odds</label>
        <input
          type="number" min="1" value={config.num}
          onChange={(e) => onUpdate({ num: e.target.value })}
          className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:border-[#00ff87]/50"
        />
        <span className="text-[#8b8b9a] font-bold text-lg shrink-0">:</span>
        <input
          type="number" min="1" value={config.den}
          onChange={(e) => onUpdate({ den: e.target.value })}
          className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:border-[#00ff87]/50"
        />
      </div>

      {/* Stake */}
      <div className="flex items-center gap-2 mb-3">
        <label className="text-xs text-[#8b8b9a] w-10 shrink-0">Stake</label>
        <div className="relative w-full">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b8b9a] text-sm">₹</span>
          <input
            type="number" min="0" value={config.stake}
            onChange={(e) => onUpdate({ stake: e.target.value })}
            className="w-full bg-black/30 border border-white/10 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:border-[#00ff87]/50"
          />
        </div>
      </div>

      {/* Payout preview */}
      {stake > 0 && (
        <div className="flex justify-between text-xs pt-2 border-t border-white/5">
          <span className="text-[#8b8b9a]">If you win</span>
          <span className="text-[#00ff87] font-semibold">
            +₹{profit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
        </div>
      )}
    </div>
  );
}
