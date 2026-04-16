import { Outlet, NavLink, useLocation } from "react-router";
import { 
  LayoutDashboard, 
  Trophy, 
  ListChecks, 
  TrendingUp, 
  Wallet, 
  User,
  Plus
} from "lucide-react";
import { useState } from "react";

export function Layout() {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/explore", label: "Explore Games", icon: Trophy },
    { path: "/bets", label: "My Bets", icon: ListChecks },
    { path: "/leaderboard", label: "Leaderboard", icon: TrendingUp },
    { path: "/ledger", label: "Ledger", icon: Wallet },
    { path: "/profile", label: "Profile", icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Desktop Navigation */}
      <div className="hidden lg:flex h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-[#0A0A0A] border-r border-white/10 flex flex-col">
          <div className="p-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#F9571E] to-[#FF8A5B] flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold">MoneyBall</h1>
            </div>
          </div>

          <nav className="flex-1 px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl mb-2 transition-all ${
                    isActive
                      ? "bg-[#F9571E] text-white"
                      : "text-gray-400 hover:bg-[#141414] hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden min-h-screen pb-20">
        {/* Mobile Header */}
        <div className="bg-[#0A0A0A] border-b border-white/10 p-4 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#F9571E] to-[#FF8A5B] flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold">MoneyBall</h1>
          </div>
        </div>

        {/* Mobile Content */}
        <Outlet />

        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#141414] border-t border-white/10 z-20">
          <div className="grid grid-cols-5 gap-1 p-2">
            {navItems.slice(0, 5).map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all ${
                    isActive ? "text-[#F9571E]" : "text-gray-400"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px]">{item.label.split(' ')[0]}</span>
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Floating Action Button */}
        <button className="fixed bottom-24 right-4 w-14 h-14 bg-gradient-to-br from-[#F9571E] to-[#FF8A5B] rounded-full shadow-lg shadow-[#F9571E]/50 flex items-center justify-center lg:hidden">
          <Plus className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
}
