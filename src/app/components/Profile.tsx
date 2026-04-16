import { Flame, Trophy, TrendingUp, Target, Zap, Crown, Award, Lock } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";

const stats = [
  { label: "Total Bets", value: "156" },
  { label: "Wins", value: "98", positive: true },
  { label: "Losses", value: "58", positive: false },
  { label: "ROI", value: "18.2%" },
  { label: "Total Profit", value: "₹24,580" },
  { label: "Avg Odds Played", value: "1.85" },
  { label: "Biggest Win", value: "₹8,400" },
  { label: "Biggest Loss", value: "₹3,200" },
];

const badges = [
  {
    id: 1,
    name: "Underdog King",
    description: "Won 10 bets with odds > 2.5",
    icon: Trophy,
    unlocked: true,
    color: "#FACC15",
  },
  {
    id: 2,
    name: "Hot Streak",
    description: "5 consecutive wins",
    icon: Flame,
    unlocked: true,
    color: "#F9571E",
  },
  {
    id: 3,
    name: "Big Winner",
    description: "Single bet profit > ₹5,000",
    icon: Award,
    unlocked: true,
    color: "#22C55E",
  },
  {
    id: 4,
    name: "High Roller",
    description: "Place 100 bets",
    icon: Crown,
    unlocked: true,
    color: "#FACC15",
  },
  {
    id: 5,
    name: "Clutch Player",
    description: "Win 3 live bets in a row",
    icon: Zap,
    unlocked: true,
    color: "#F9571E",
  },
  {
    id: 6,
    name: "Sharp Shooter",
    description: "Maintain 70% win rate over 50 bets",
    icon: Target,
    unlocked: false,
    color: "#888888",
  },
  {
    id: 7,
    name: "Profit Master",
    description: "Reach ₹50,000 total profit",
    icon: TrendingUp,
    unlocked: false,
    color: "#888888",
  },
  {
    id: 8,
    name: "Century Maker",
    description: "Win 100 bets",
    icon: Trophy,
    unlocked: false,
    color: "#888888",
  },
];

const profitData = [
  { month: "Jan", profit: 5200 },
  { month: "Feb", profit: 8400 },
  { month: "Mar", profit: 6800 },
  { month: "Apr", profit: 11200 },
  { month: "May", profit: 9800 },
  { month: "Jun", profit: 12500 },
  { month: "Jul", profit: 14800 },
];

const winLossData = [
  { name: "Wins", value: 98, color: "#22C55E" },
  { name: "Losses", value: 58, color: "#EF4444" },
];

export function Profile() {
  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-[#1A1A1A] to-[#141414] p-8 rounded-2xl border border-white/10 mb-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#F9571E] to-[#FF8A5B] flex items-center justify-center text-4xl shadow-lg shadow-[#F9571E]/30">
            Y
          </div>
          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl mb-2">You</h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <div className="flex items-center gap-2 text-[#F9571E]">
                <Flame className="w-5 h-5" />
                <span className="font-medium">5 Win Streak</span>
              </div>
              <div className="px-3 py-1 bg-[#22C55E]/10 text-[#22C55E] rounded-lg text-sm">
                Rank #4
              </div>
              <div className="px-3 py-1 bg-[#FACC15]/10 text-[#FACC15] rounded-lg text-sm">
                5 Badges
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mb-8">
        <h2 className="text-xl mb-4">Performance Stats</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-[#141414] p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all"
            >
              <div className="text-gray-400 text-sm mb-2">{stat.label}</div>
              <div
                className={`text-2xl font-bold ${
                  stat.positive === true
                    ? "text-[#22C55E]"
                    : stat.positive === false
                    ? "text-[#EF4444]"
                    : "text-white"
                }`}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Badges & Achievements */}
      <div className="mb-8">
        <h2 className="text-xl mb-4">Badges & Achievements</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {badges.map((badge) => {
            const Icon = badge.icon;
            return (
              <div
                key={badge.id}
                className={`bg-[#141414] p-6 rounded-2xl border transition-all ${
                  badge.unlocked
                    ? "border-white/10 hover:border-white/20 cursor-pointer"
                    : "border-white/5 opacity-50"
                }`}
              >
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-3 mx-auto ${
                    badge.unlocked
                      ? "bg-gradient-to-br from-[#F9571E]/20 to-[#FF8A5B]/20"
                      : "bg-[#1A1A1A]"
                  }`}
                  style={
                    badge.unlocked
                      ? {
                          background: `linear-gradient(135deg, ${badge.color}20 0%, ${badge.color}10 100%)`,
                        }
                      : undefined
                  }
                >
                  {badge.unlocked ? (
                    <Icon className="w-8 h-8" style={{ color: badge.color }} />
                  ) : (
                    <Lock className="w-8 h-8 text-gray-600" />
                  )}
                </div>
                <h3 className="font-medium text-center mb-1 text-sm">{badge.name}</h3>
                <p className="text-xs text-gray-400 text-center">{badge.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Performance Visualization */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Profit Graph */}
        <div className="lg:col-span-2 bg-[#141414] p-6 rounded-2xl border border-white/5">
          <h2 className="text-xl mb-6">Profit Over Time</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={profitData}>
                <XAxis
                  dataKey="month"
                  stroke="#888888"
                  tick={{ fill: "#888888" }}
                  axisLine={{ stroke: "#333333" }}
                />
                <YAxis
                  stroke="#888888"
                  tick={{ fill: "#888888" }}
                  axisLine={{ stroke: "#333333" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1A1A1A",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    color: "#FFFFFF",
                  }}
                  labelStyle={{ color: "#888888" }}
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="#22C55E"
                  strokeWidth={3}
                  dot={{ fill: "#22C55E", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Win/Loss Pie Chart */}
        <div className="bg-[#141414] p-6 rounded-2xl border border-white/5">
          <h2 className="text-xl mb-6">Win/Loss Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={winLossData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {winLossData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1A1A1A",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    color: "#FFFFFF",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {winLossData.map((item, index) => (
              <div key={index} className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-gray-400 text-sm">{item.name}</span>
                </div>
                <div className="font-bold" style={{ color: item.color }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
