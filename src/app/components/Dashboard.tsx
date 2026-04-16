import { TrendingUp, TrendingDown, Flame, Plus, FileText, UserPlus } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const kpiData = [
  { label: "Total Profit/Loss", value: "₹24,580", trend: "+12.5%", positive: true },
  { label: "ROI", value: "18.2%", trend: "+3.1%", positive: true },
  { label: "Win Rate", value: "64%", trend: "+5%", positive: true },
  { label: "Active Bets", value: "8", trend: "", positive: null },
  { label: "Total Wagered", value: "₹1,35,000", trend: "", positive: null },
  { label: "Current Streak", value: "5 Wins", icon: "🔥", positive: true },
];

const performanceData = [
  { date: "Mon", profit: 2400 },
  { date: "Tue", profit: 3200 },
  { date: "Wed", profit: 2800 },
  { date: "Thu", profit: 4100 },
  { date: "Fri", profit: 3800 },
  { date: "Sat", profit: 5200 },
  { date: "Sun", profit: 4800 },
];

const recentActivity = [
  { 
    match: "Lakers vs Warriors", 
    betType: "Moneyline", 
    odds: "1:1.8", 
    stake: "₹2,000", 
    result: "Won", 
    profit: "+₹3,600",
    positive: true 
  },
  { 
    match: "Celtics vs Heat", 
    betType: "Spread (-5.5)", 
    odds: "1:2.1", 
    stake: "₹1,500", 
    result: "Won", 
    profit: "+₹3,150",
    positive: true 
  },
  { 
    match: "Bucks vs Nets", 
    betType: "Over 215.5", 
    odds: "1:1.9", 
    stake: "₹2,500", 
    result: "Lost", 
    profit: "-₹2,500",
    positive: false 
  },
  { 
    match: "Mavs vs Suns", 
    betType: "Player Props (Luka 30+ pts)", 
    odds: "1:2.5", 
    stake: "₹1,000", 
    result: "Won", 
    profit: "+₹2,500",
    positive: true 
  },
];

export function Dashboard() {
  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl mb-1">Dashboard</h1>
        <p className="text-gray-400">Your competitive overview</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {kpiData.map((kpi, index) => (
          <div 
            key={index} 
            className="bg-[#141414] p-4 lg:p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all"
          >
            <div className="text-gray-400 text-sm mb-2">{kpi.label}</div>
            <div className="flex items-end justify-between">
              <div className="flex items-baseline gap-2">
                <div className="text-xl lg:text-2xl font-bold">{kpi.value}</div>
                {kpi.icon && <span className="text-2xl">{kpi.icon}</span>}
              </div>
              {kpi.trend && (
                <div className={`flex items-center gap-1 text-sm ${kpi.positive ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
                  {kpi.positive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {kpi.trend}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Performance Graph */}
      <div className="bg-[#141414] p-6 rounded-2xl border border-white/5 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl">Performance Graph</h2>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-xl bg-[#F9571E] text-white text-sm">Weekly</button>
            <button className="px-4 py-2 rounded-xl bg-[#1A1A1A] text-gray-400 text-sm hover:bg-[#252525] transition-all">Monthly</button>
            <button className="px-4 py-2 rounded-xl bg-[#1A1A1A] text-gray-400 text-sm hover:bg-[#252525] transition-all">All Time</button>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={performanceData}>
              <XAxis 
                dataKey="date" 
                stroke="#888888" 
                tick={{ fill: '#888888' }}
                axisLine={{ stroke: '#333333' }}
              />
              <YAxis 
                stroke="#888888" 
                tick={{ fill: '#888888' }}
                axisLine={{ stroke: '#333333' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1A1A1A', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: '#FFFFFF'
                }}
                labelStyle={{ color: '#888888' }}
              />
              <Line 
                type="monotone" 
                dataKey="profit" 
                stroke="#F9571E" 
                strokeWidth={3}
                dot={{ fill: '#F9571E', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Activity Table */}
        <div className="lg:col-span-2 bg-[#141414] p-6 rounded-2xl border border-white/5">
          <h2 className="text-xl mb-6">Recent Activity</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-3 px-2 text-gray-400 text-sm font-medium">Match</th>
                  <th className="text-left py-3 px-2 text-gray-400 text-sm font-medium">Bet Type</th>
                  <th className="text-left py-3 px-2 text-gray-400 text-sm font-medium">Odds</th>
                  <th className="text-left py-3 px-2 text-gray-400 text-sm font-medium">Stake</th>
                  <th className="text-left py-3 px-2 text-gray-400 text-sm font-medium">Result</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((activity, index) => (
                  <tr key={index} className="border-b border-white/5 hover:bg-[#1A1A1A] transition-all">
                    <td className="py-4 px-2">{activity.match}</td>
                    <td className="py-4 px-2 text-gray-400">{activity.betType}</td>
                    <td className="py-4 px-2 text-gray-400">{activity.odds}</td>
                    <td className="py-4 px-2 text-gray-400">{activity.stake}</td>
                    <td className="py-4 px-2">
                      <span className={`px-3 py-1 rounded-lg text-sm ${
                        activity.positive 
                          ? "bg-[#22C55E]/10 text-[#22C55E]" 
                          : "bg-[#EF4444]/10 text-[#EF4444]"
                      }`}>
                        {activity.profit}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-[#141414] p-6 rounded-2xl border border-white/5">
          <h2 className="text-xl mb-6">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full bg-gradient-to-r from-[#F9571E] to-[#FF8A5B] text-white py-4 px-6 rounded-2xl flex items-center justify-between hover:shadow-lg hover:shadow-[#F9571E]/30 transition-all group">
              <span>Create Bet</span>
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            </button>
            <button className="w-full bg-[#1A1A1A] text-white py-4 px-6 rounded-2xl flex items-center justify-between hover:bg-[#252525] transition-all">
              <span>View Ledger</span>
              <FileText className="w-5 h-5" />
            </button>
            <button className="w-full bg-[#1A1A1A] text-white py-4 px-6 rounded-2xl flex items-center justify-between hover:bg-[#252525] transition-all">
              <span>Invite Friend</span>
              <UserPlus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
