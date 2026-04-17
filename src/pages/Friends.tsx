import { useEffect, useState } from 'react';
import { Search, UserPlus, Check, X, Swords } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Profile, FriendWithProfile, SupaBet } from '@/types';
import ChallengeModal from '@/components/ChallengeModal';

type Tab = 'Friends' | 'Requests' | 'Find';

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-white/5 animate-pulse rounded-xl ${className}`} />;
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  const s = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  return (
    <div className={`${s} rounded-full bg-[#00ff87]/10 border border-[#00ff87]/20 flex items-center justify-center font-bold text-[#00ff87] shrink-0`}>
      {initials}
    </div>
  );
}

/** Compute friend P&L from settled bets. */
async function getFriendPnl(userId: string, currentUserId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('bets')
      .select('creator_id, opponent_id, stake, creator_payout, winner_id, status')
      .or(`creator_id.eq.${userId},opponent_id.eq.${userId}`)
      .not('winner_id', 'is', null);
    if (error) throw error;

    return (data ?? []).reduce((acc: number, b: any) => {
      if (b.winner_id === userId) {
        const isCreator = b.creator_id === userId;
        return acc + (isCreator ? (b.creator_payout - b.stake) : b.stake);
      } else {
        const isCreator = b.creator_id === userId;
        return acc - (isCreator ? b.stake : Math.max(0, b.creator_payout - b.stake));
      }
    }, 0);
  } catch (err) {
    console.error('getFriendPnl error:', err);
    return 0;
  }
}

export default function Friends() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('Friends');
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [requests, setRequests] = useState<FriendWithProfile[]>([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [challengeFriendId, setChallengeFriendId] = useState<string | null>(null);
  const [friendPnls, setFriendPnls] = useState<Record<string, number>>({});
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    loadFriends();
  }, [user]);

  async function loadFriends() {
    if (!user) return;
    setLoading(true);
    try {
      // Accepted friends (requester OR addressee = current user)
      const { data: accepted, error: e1 } = await supabase
        .from('friends')
        .select('*, requester:profiles!friends_requester_id_fkey(*), addressee:profiles!friends_addressee_id_fkey(*)')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
      if (e1) throw e1;

      const friendList: FriendWithProfile[] = (accepted ?? []).map((row: any) => ({
        ...row,
        friend: row.requester_id === user.id ? row.addressee : row.requester,
      }));
      setFriends(friendList);

      // Load P&L for each friend
      const pnls: Record<string, number> = {};
      await Promise.all(
        friendList.map(async (f) => {
          pnls[f.friend.id] = await getFriendPnl(f.friend.id, user.id);
        })
      );
      setFriendPnls(pnls);

      // Incoming pending requests
      const { data: pending, error: e2 } = await supabase
        .from('friends')
        .select('*, requester:profiles!friends_requester_id_fkey(*), addressee:profiles!friends_addressee_id_fkey(*)')
        .eq('addressee_id', user.id)
        .eq('status', 'pending');
      if (e2) throw e2;

      setRequests(
        (pending ?? []).map((row: any) => ({
          ...row,
          friend: row.requester,
        }))
      );
    } catch (err) {
      console.error('loadFriends error:', err);
      toast.error('Failed to load friends.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch() {
    if (!search.trim() || !user) return;
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('full_name', `%${search.trim()}%`)
        .neq('id', user.id)
        .limit(10);
      if (error) throw error;
      setSearchResults(data ?? []);
    } catch (err) {
      console.error('search error:', err);
      toast.error('Search failed.');
    } finally {
      setSearching(false);
    }
  }

  async function sendRequest(addresseeId: string) {
    if (!user) return;
    try {
      const { error } = await supabase.from('friends').insert({
        requester_id: user.id,
        addressee_id: addresseeId,
        status: 'pending',
      });
      if (error) throw error;
      setSentRequests((prev) => new Set(prev).add(addresseeId));
      toast.success('Friend request sent!');
    } catch (err: any) {
      console.error('sendRequest error:', err);
      toast.error(err.message ?? 'Failed to send request.');
    }
  }

  async function respondToRequest(requestId: string, accept: boolean) {
    try {
      const { error } = await supabase
        .from('friends')
        .update({ status: accept ? 'accepted' : 'declined' })
        .eq('id', requestId);
      if (error) throw error;
      toast.success(accept ? 'Friend accepted!' : 'Request declined.');
      loadFriends();
    } catch (err) {
      console.error('respondToRequest error:', err);
      toast.error('Failed to respond.');
    }
  }

  const alreadyFriendIds = new Set([
    ...friends.map((f) => f.friend.id),
    ...requests.map((r) => r.requester_id),
  ]);

  return (
    <div className="px-4 pt-5 pb-4">
      <h1 className="text-xl font-bold mb-4">Friends</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-[#1a1a1f] rounded-xl p-1">
        {(['Friends', 'Requests', 'Find'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors relative ${
              tab === t ? 'bg-[#00ff87] text-black' : 'text-[#8b8b9a] hover:text-white'
            }`}
          >
            {t}
            {t === 'Requests' && requests.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#ff3b5c] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {requests.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Friends tab */}
      {tab === 'Friends' && (
        <div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : friends.length === 0 ? (
            <EmptyState message="No friends yet. Use Find People to add some!" />
          ) : (
            <div className="space-y-2">
              {friends.map((f) => (
                <FriendCard
                  key={f.id}
                  profile={f.friend}
                  pnl={friendPnls[f.friend.id]}
                  onChallenge={() => setChallengeFriendId(f.friend.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Requests tab */}
      {tab === 'Requests' && (
        <div>
          {requests.length === 0 ? (
            <EmptyState message="No pending friend requests." />
          ) : (
            <div className="space-y-2">
              {requests.map((r) => (
                <div key={r.id} className="bg-[#1a1a1f] rounded-xl p-4 flex items-center gap-3 border border-white/5">
                  <Avatar name={r.friend.full_name} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.friend.full_name}</p>
                    <p className="text-xs text-[#8b8b9a]">wants to be friends</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => respondToRequest(r.id, true)}
                      className="w-8 h-8 rounded-full bg-[#00ff87]/10 border border-[#00ff87]/30 flex items-center justify-center"
                    >
                      <Check className="w-4 h-4 text-[#00ff87]" />
                    </button>
                    <button
                      onClick={() => respondToRequest(r.id, false)}
                      className="w-8 h-8 rounded-full bg-[#ff3b5c]/10 border border-[#ff3b5c]/30 flex items-center justify-center"
                    >
                      <X className="w-4 h-4 text-[#ff3b5c]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Find People tab */}
      {tab === 'Find' && (
        <div>
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b8b9a]" />
              <input
                type="text"
                placeholder="Search by name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full bg-[#1a1a1f] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm placeholder-[#8b8b9a] focus:outline-none focus:border-[#00ff87]/50"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searching}
              className="bg-[#00ff87] text-black font-bold px-4 rounded-xl text-sm disabled:opacity-50"
            >
              {searching ? '…' : 'Go'}
            </button>
          </div>

          {searchResults.length === 0 ? (
            <EmptyState message="Search for people to add as friends." />
          ) : (
            <div className="space-y-2">
              {searchResults.map((p) => {
                const isFriend = alreadyFriendIds.has(p.id);
                const sent = sentRequests.has(p.id);
                return (
                  <div key={p.id} className="bg-[#1a1a1f] rounded-xl p-4 flex items-center gap-3 border border-white/5">
                    <Avatar name={p.full_name} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.full_name}</p>
                    </div>
                    {isFriend ? (
                      <span className="text-xs text-[#8b8b9a]">Already friends</span>
                    ) : sent ? (
                      <span className="text-xs text-[#8b8b9a]">Sent ✓</span>
                    ) : (
                      <button
                        onClick={() => sendRequest(p.id)}
                        className="flex items-center gap-1.5 bg-[#00ff87]/10 border border-[#00ff87]/30 text-[#00ff87] text-xs font-medium px-3 py-1.5 rounded-lg"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> Add
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Challenge modal */}
      {challengeFriendId && (
        <ChallengeModal
          isOpen={!!challengeFriendId}
          onClose={() => setChallengeFriendId(null)}
          preselectedFriendId={challengeFriendId}
        />
      )}
    </div>
  );
}

function FriendCard({
  profile,
  pnl,
  onChallenge,
}: {
  profile: Profile;
  pnl: number | undefined;
  onChallenge: () => void;
}) {
  const pnlDefined = pnl !== undefined;
  const positive = (pnl ?? 0) >= 0;

  return (
    <div className="bg-[#1a1a1f] rounded-xl p-4 flex items-center gap-3 border border-white/5">
      <Avatar name={profile.full_name} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{profile.full_name}</p>
        {pnlDefined && (
          <p className={`text-xs font-semibold ${positive ? 'text-[#00ff87]' : 'text-[#ff3b5c]'}`}>
            {positive ? '+' : ''}₹{Math.abs(pnl!).toLocaleString('en-IN')}
          </p>
        )}
      </div>
      <button
        onClick={onChallenge}
        className="flex items-center gap-1.5 bg-[#00ff87]/10 border border-[#00ff87]/30 text-[#00ff87] text-xs font-medium px-3 py-1.5 rounded-lg shrink-0"
      >
        <Swords className="w-3.5 h-3.5" /> Challenge
      </button>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-[#1a1a1f] rounded-xl p-8 text-center border border-white/5">
      <p className="text-[#8b8b9a] text-sm">{message}</p>
    </div>
  );
}
