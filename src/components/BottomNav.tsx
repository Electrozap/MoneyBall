import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Ticket, BookOpen, Users } from 'lucide-react';
import { useBetSlip } from '@/lib/BetSlipContext';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';

function BasketballIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M4.93 4.93C7.24 7.24 8 10 8 12s-.76 4.76-3.07 7.07" />
      <path d="M19.07 4.93C16.76 7.24 16 10 16 12s.76 4.76 3.07 7.07" />
      <line x1="2" y1="12" x2="22" y2="12" />
    </svg>
  );
}

function useNotifications() {
  const { user } = useAuth();
  const [challengeCount, setChallengeCount] = useState(0);
  const [friendRequestCount, setFriendRequestCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    async function fetchCounts() {
      try {
        const [{ count: cc }, { count: fc }] = await Promise.all([
          supabase
            .from('bets')
            .select('id', { count: 'exact', head: true })
            .eq('opponent_id', user!.id)
            .eq('status', 'pending'),
          supabase
            .from('friends')
            .select('id', { count: 'exact', head: true })
            .eq('addressee_id', user!.id)
            .eq('status', 'pending'),
        ]);
        setChallengeCount(cc ?? 0);
        setFriendRequestCount(fc ?? 0);
      } catch (err) {
        console.error('fetchCounts error:', err);
      }
    }

    fetchCounts();

    // Realtime: new incoming challenge bets
    const betChannel = supabase
      .channel('incoming-bets')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bets', filter: `opponent_id=eq.${user.id}` },
        () => setChallengeCount((c) => c + 1)
      )
      .subscribe();

    // Realtime: new friend requests
    const friendChannel = supabase
      .channel('incoming-friends')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'friends', filter: `addressee_id=eq.${user.id}` },
        () => setFriendRequestCount((c) => c + 1)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(betChannel);
      supabase.removeChannel(friendChannel);
    };
  }, [user]);

  return { challengeCount, friendRequestCount };
}

export default function BottomNav() {
  const location = useLocation();
  const { selections } = useBetSlip();
  const { challengeCount, friendRequestCount } = useNotifications();

  const NAV_ITEMS = [
    { path: '/', label: 'Home', icon: Home, badge: challengeCount },
    { path: '/games', label: 'Games', icon: BasketballIcon, badge: 0 },
    { path: '/bet-slip', label: 'Builder', icon: Ticket, badge: selections.length },
    { path: '/friends', label: 'Friends', icon: Users, badge: friendRequestCount },
    { path: '/ledger', label: 'Ledger', icon: BookOpen, badge: 0 },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-[#1a1a1f] border-t border-white/10 z-50">
      <div className="grid grid-cols-5 h-16">
        {NAV_ITEMS.map(({ path, label, icon: Icon, badge }) => {
          const isActive = location.pathname === path;

          return (
            <NavLink
              key={path}
              to={path}
              className="flex flex-col items-center justify-center gap-0.5 relative"
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive ? 'text-[#00ff87]' : 'text-[#8b8b9a]'
                  }`}
                />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#ff3b5c] text-white text-[9px] font-bold min-w-[14px] h-[14px] rounded-full flex items-center justify-center px-0.5 leading-none">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[9px] font-medium transition-colors ${
                  isActive ? 'text-[#00ff87]' : 'text-[#8b8b9a]'
                }`}
              >
                {label}
              </span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#00ff87] rounded-full" />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
