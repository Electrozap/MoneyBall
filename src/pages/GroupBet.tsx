import { useEffect, useState } from 'react';
import { Plus, Users, Trophy, ChevronDown, ChevronUp, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { GroupBet as GroupBetType, GroupBetParticipant, Profile, NBAGame } from '@/types';
import { fetchTodayGames } from '@/lib/nbaApi';

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-white/5 animate-pulse rounded-xl ${className}`} />;
}

function Avatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  const s = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-xs';
  return (
    <div className={`${s} rounded-full bg-[#00ff87]/10 border border-[#00ff87]/20 flex items-center justify-center font-bold text-[#00ff87] shrink-0`}>
      {initials}
    </div>
  );
}

export default function GroupBet() {
  const { user, profile } = useAuth();
  const [groupBets, setGroupBets] = useState<GroupBetType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadGroupBets();
  }, [user]);

  async function loadGroupBets() {
    if (!user) return;
    setLoading(true);
    try {
      // Bets created by user OR where user is a participant
      const { data: participating, error: e1 } = await supabase
        .from('group_bet_participants')
        .select('group_bet_id')
        .eq('user_id', user.id);
      if (e1) throw e1;

      const ids = [
        ...new Set([...(participating ?? []).map((p: any) => p.group_bet_id)]),
      ];

      const query = ids.length > 0
        ? supabase.from('group_bets').select(`
            *,
            creator:profiles!group_bets_created_by_fkey(*),
            participants:group_bet_participants(*, user:profiles(*))
          `).or(`created_by.eq.${user.id},id.in.(${ids.join(',')})`)
        : supabase.from('group_bets').select(`
            *,
            creator:profiles!group_bets_created_by_fkey(*),
            participants:group_bet_participants(*, user:profiles(*))
          `).eq('created_by', user.id);

      const { data, error: e2 } = await query.order('created_at', { ascending: false });
      if (e2) throw e2;
      setGroupBets(data ?? []);
    } catch (err) {
      console.error('loadGroupBets error:', err);
      toast.error('Failed to load group bets.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-4 pt-5 pb-4">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold">Group Bets</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 bg-[#00ff87] text-black font-bold px-3 py-2 rounded-xl text-xs"
        >
          <Plus className="w-3.5 h-3.5" /> New
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : groupBets.length === 0 ? (
        <div className="bg-[#1a1a1f] rounded-xl p-8 text-center border border-white/5">
          <Users className="w-10 h-10 text-[#8b8b9a] mx-auto mb-3" />
          <p className="text-white font-medium mb-1">No group bets yet</p>
          <p className="text-[#8b8b9a] text-sm mb-4">Create a bet and invite your friends.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-[#00ff87] text-black font-bold px-5 py-2 rounded-xl text-sm"
          >
            Create Group Bet
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {groupBets.map((gb) => (
            <GroupBetCard key={gb.id} bet={gb} currentUserId={user!.id} onJoined={loadGroupBets} />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateGroupBetSheet onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); loadGroupBets(); }} />
      )}
    </div>
  );
}

/* ── GroupBetCard ── */
function GroupBetCard({ bet, currentUserId, onJoined }: { bet: GroupBetType; currentUserId: string; onJoined: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [joining, setJoining] = useState(false);
  const [mySelection, setMySelection] = useState('');
  const [myStake, setMyStake] = useState('1000');

  const totalPot = (bet.participants ?? []).reduce((acc: number, p: GroupBetParticipant) => acc + p.stake, 0);
  const isParticipant = (bet.participants ?? []).some((p: GroupBetParticipant) => p.user_id === currentUserId);
  const isCreator = bet.created_by === currentUserId;

  const statusStyles: Record<string, string> = {
    open: 'bg-[#00ff87]/10 text-[#00ff87]',
    locked: 'bg-yellow-500/10 text-yellow-400',
    settled: 'bg-white/5 text-[#8b8b9a]',
  };

  async function handleJoin() {
    const stakeNum = parseFloat(myStake);
    if (!mySelection.trim()) { toast.error('Enter your selection.'); return; }
    if (!stakeNum || stakeNum <= 0) { toast.error('Enter a valid stake.'); return; }
    setJoining(true);
    try {
      const { error } = await supabase.from('group_bet_participants').insert({
        group_bet_id: bet.id,
        user_id: currentUserId,
        stake: stakeNum,
        selection: mySelection.trim(),
        custom_odds_num: 1,
        custom_odds_den: 1,
        payout: null,
      });
      if (error) throw error;
      toast.success('Joined group bet!');
      onJoined();
    } catch (err: any) {
      console.error('handleJoin error:', err);
      toast.error(err.message ?? 'Failed to join.');
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="bg-[#1a1a1f] rounded-xl border border-white/5 overflow-hidden">
      <button className="w-full p-4 text-left" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${statusStyles[bet.status]}`}>
                {bet.status}
              </span>
              {bet.bet_details.game_date && (
                <span className="text-[10px] text-[#8b8b9a]">
                  {bet.bet_details.visitor_team} @ {bet.bet_details.home_team}
                </span>
              )}
            </div>
            <p className="text-sm font-semibold truncate">{bet.bet_details.description}</p>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-[#8b8b9a]">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {(bet.participants ?? []).length} players
              </span>
              <span>
                Pot: <span className="text-white font-medium">₹{totalPot.toLocaleString('en-IN')}</span>
              </span>
              {isCreator && <span className="text-[#00ff87] text-[10px]">Creator</span>}
            </div>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-[#8b8b9a] shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-[#8b8b9a] shrink-0 mt-1" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-white/5 p-4 space-y-3">
          {/* Participants */}
          {(bet.participants ?? []).length > 0 && (
            <div>
              <p className="text-xs text-[#8b8b9a] mb-2">Participants</p>
              <div className="space-y-2">
                {(bet.participants ?? []).map((p: GroupBetParticipant) => (
                  <div key={p.id} className="flex items-center gap-2 text-xs">
                    <Avatar name={p.user?.full_name ?? '?'} />
                    <span className="flex-1 font-medium truncate">{p.user?.full_name ?? 'Unknown'}</span>
                    <span className="text-[#8b8b9a]">{p.selection}</span>
                    <span className="text-white font-medium">₹{p.stake.toLocaleString('en-IN')}</span>
                    {p.user_id === bet.winner_id && <Trophy className="w-3.5 h-3.5 text-yellow-400" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Join form */}
          {!isParticipant && bet.status === 'open' && (
            <div className="border-t border-white/5 pt-3 space-y-2">
              <p className="text-xs font-medium">Join this bet</p>
              <input
                type="text"
                value={mySelection}
                onChange={(e) => setMySelection(e.target.value)}
                placeholder="Your selection…"
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm placeholder-[#8b8b9a] focus:outline-none focus:border-[#00ff87]/50"
              />
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b8b9a] text-sm">₹</span>
                  <input
                    type="number" min="0" value={myStake}
                    onChange={(e) => setMyStake(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:border-[#00ff87]/50"
                  />
                </div>
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="bg-[#00ff87] text-black font-bold px-4 py-2 rounded-lg text-sm disabled:opacity-50"
                >
                  {joining ? '…' : 'Join'}
                </button>
              </div>
            </div>
          )}

          {isParticipant && (
            <p className="text-xs text-[#00ff87] text-center">✓ You're in this bet</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Create Group Bet Sheet ── */
function CreateGroupBetSheet({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { user } = useAuth();
  const [games, setGames] = useState<NBAGame[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [friends, setFriends] = useState<Profile[]>([]);
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTodayGames().then(setGames).catch(console.error);
    if (user) loadFriends();
  }, [user]);

  async function loadFriends() {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('friends')
        .select('requester:profiles!friends_requester_id_fkey(*), addressee:profiles!friends_addressee_id_fkey(*), requester_id')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
      setFriends(
        (data ?? []).map((row: any) => row.requester_id === user.id ? row.addressee : row.requester)
      );
    } catch (err) {
      console.error('loadFriends error:', err);
    }
  }

  function toggleInvite(id: string) {
    setInvitedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleCreate() {
    if (!user) return;
    if (!description.trim()) { toast.error('Enter a bet description.'); return; }

    const game = games.find((g) => g.id === selectedGameId);
    setSubmitting(true);
    try {
      const { data: gb, error: e1 } = await supabase
        .from('group_bets')
        .insert({
          created_by: user.id,
          match_id: selectedGameId ? String(selectedGameId) : null,
          bet_details: {
            description: description.trim(),
            home_team: game?.home_team.full_name,
            visitor_team: game?.visitor_team.full_name,
            game_date: game?.date,
          },
          status: 'open',
          winner_id: null,
        })
        .select()
        .single();
      if (e1) throw e1;

      // Add creator as first participant (placeholder, no selection/stake yet)
      // Invited friends will join themselves via the card UI

      toast.success('Group bet created!');
      onCreated();
    } catch (err: any) {
      console.error('handleCreate error:', err);
      toast.error(err.message ?? 'Failed to create.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-[#0d0d0f] w-full max-w-[430px] rounded-t-2xl border border-white/10 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/5">
          <h2 className="text-base font-bold">Create Group Bet</h2>
          <button onClick={onClose} className="text-[#8b8b9a]"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Game picker */}
          <div>
            <label className="text-xs text-[#8b8b9a] mb-2 block">Select Game (optional)</label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {games.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGameId(g.id === selectedGameId ? null : g.id)}
                  className={`w-full p-3 rounded-xl border text-left text-sm transition-colors ${
                    selectedGameId === g.id
                      ? 'border-[#00ff87] bg-[#00ff87]/10'
                      : 'border-white/10 bg-[#1a1a1f] hover:border-white/30'
                  }`}
                >
                  {g.visitor_team.abbreviation} @ {g.home_team.abbreviation} — {g.status}
                </button>
              ))}
              {games.length === 0 && (
                <p className="text-xs text-[#8b8b9a] text-center py-2">No games available.</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-[#8b8b9a] mb-2 block">Bet Description *</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Who wins the 3rd quarter?"
              className="w-full bg-[#1a1a1f] border border-white/10 rounded-xl px-4 py-3 text-sm placeholder-[#8b8b9a] focus:outline-none focus:border-[#00ff87]/50"
            />
          </div>

          {/* Friends to invite */}
          {friends.length > 0 && (
            <div>
              <label className="text-xs text-[#8b8b9a] mb-2 block">Invite Friends</label>
              <div className="space-y-2">
                {friends.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => toggleInvite(f.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                      invitedIds.has(f.id)
                        ? 'border-[#00ff87] bg-[#00ff87]/10'
                        : 'border-white/10 bg-[#1a1a1f] hover:border-white/30'
                    }`}
                  >
                    <Avatar name={f.full_name} />
                    <span className="text-sm font-medium flex-1 text-left">{f.full_name}</span>
                    {invitedIds.has(f.id) && <span className="text-[#00ff87] text-xs">Invited</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleCreate}
            disabled={submitting || !description.trim()}
            className="w-full bg-[#00ff87] text-black font-bold py-3.5 rounded-xl text-sm disabled:opacity-40"
          >
            {submitting ? 'Creating…' : 'Create Group Bet'}
          </button>
        </div>
      </div>
    </div>
  );
}
