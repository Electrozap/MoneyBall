import { NavLink, useLocation } from 'react-router-dom';
import { Home, Ticket, BookOpen } from 'lucide-react';
import { useBetSlip } from '@/lib/BetSlipContext';

// Basketball icon (lucide doesn't have one, using a circle with lines)
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

const NAV_ITEMS = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/games', label: 'Games', icon: BasketballIcon },
  { path: '/bet-slip', label: 'Slip', icon: Ticket, showBadge: true },
  { path: '/ledger', label: 'Ledger', icon: BookOpen },
];

export default function BottomNav() {
  const location = useLocation();
  const { selections } = useBetSlip();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-[#1a1a1f] border-t border-white/10 z-50">
      <div className="grid grid-cols-4 h-16">
        {NAV_ITEMS.map(({ path, label, icon: Icon, showBadge }) => {
          const isActive = location.pathname === path;
          const badgeCount = showBadge ? selections.length : 0;

          return (
            <NavLink
              key={path}
              to={path}
              className="flex flex-col items-center justify-center gap-1 relative"
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive ? 'text-[#00ff87]' : 'text-[#8b8b9a]'
                  }`}
                />
                {badgeCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#00ff87] text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                    {badgeCount}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] font-medium transition-colors ${
                  isActive ? 'text-[#00ff87]' : 'text-[#8b8b9a]'
                }`}
              >
                {label}
              </span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#00ff87] rounded-full" />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
