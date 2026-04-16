import { useState } from "react";
import { TrendingUp, TrendingDown, Flame, Crown, Medal, Award } from "lucide-react";

type SortBy = "profit" | "roi" | "winrate";

interface Player {
  rank: number;
  name: string;
  profit: number;
  roi: number;
  winRate: number;
  streak: number;
  trend: "up" | "down" | "stable";
}

const players: Player[] = [
  { rank: 1, name: "Alex Rodriguez", profit: 45800, roi: 28.5, winRate: 72, streak: 8, trend: "up" },
  { rank: 2, name: "Sarah Chen", profit: 38200, roi: 24.2, winRate: 68, streak: 5, trend: "up" },
  { rank: 3, name: "Mike Johnson", profit: 32500, roi: 22.8, winRate: 65, streak: 6, trend: "up" },
  { rank: 4, name: "You", profit: 24580, roi: 18.2, winRate: 64, streak: 5, trend: "up" },
  { rank: 5, name: "Emily Davis", profit: 21300, roi: 19.5, winRate: 62, streak: 3, trend: "stable" },
  { rank: 6, name: "Chris Martinez", profit: 18900, roi: 17.8, winRate: 61, streak: 4, trend: "up" },
  { rank: 7, name: "Jessica Lee", profit: 16200, roi: 16.5, winRate: 59, streak: 2, trend: "down" },
  { rank: 8, name: "David Park", profit: 14800, roi: 15.2, winRate: 58, streak: 3, trend: "stable" },
  { rank: 9, name: "Amanda White", profit: 12500, roi: 14.8, winRate: 56, streak: 1, trend: "down" },
  { rank: 10, name: "Ryan Kumar", profit: 11200, roi: 13.5, winRate: 55, streak: 2, trend: "stable" },
];

export function Leaderboard() {
  const [sortBy, setSortBy] = useState<SortBy>("profit");

  const topThree = players.slice(0, 3);
  const restOfPlayers = players.slice(3);

  const getRankColor = (rank: number) => {
    if (rank === 1) return "text-[#FACC15]";
    if (rank === 2) return "text-gray-300";
    if (rank === 3) return "text-[#CD7F32]";
    return "text-gray-400";
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-8 h-8 text-[#FACC15]" />;
    if (rank === 2) return <Medal className="w-8 h-8 text-gray-300" />;
    if (rank === 3) return <Award className="w-8 h-8 text-[#CD7F32]" />;
    return null;
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl mb-1">Leaderboard</h1>
        <p className="text-gray-400">Top bettors in your network</p>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-8 overflow-x-auto">
        <button
          onClick={() => setSortBy("profit")}
          className={`px-6 py-3 rounded-2xl whitespace-nowrap transition-all ${
            sortBy === "profit"
              ? "bg-[#F9571E] text-white"
              : "bg-[#141414] text-gray-400 hover:bg-[#1A1A1A]"
          }`}
        >
          By Profit
        </button>
        <button
          onClick={() => setSortBy("roi")}
          className={`px-6 py-3 rounded-2xl whitespace-nowrap transition-all ${
            sortBy === "roi"
              ? "bg-[#F9571E] text-white"
              : "bg-[#141414] text-gray-400 hover:bg-[#1A1A1A]"
          }`}
        >
          By ROI
        </button>
        <button
          onClick={() => setSortBy("winrate")}
          className={`px-6 py-3 rounded-2xl whitespace-nowrap transition-all ${
            sortBy === "winrate"
              ? "bg-[#F9571E] text-white"
              : "bg-[#141414] text-gray-400 hover:bg-[#1A1A1A]"
          }`}
        >
          By Win Rate
        </button>
      </div>

      {/* Top 3 Podium */}
      <div className="mb-12">
        <h2 className="text-xl mb-6">Top Performers</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {/* Rank 2 */}
          <div className="md:order-1 order-2">
            <div className="bg-gradient-to-br from-[#141414] to-[#1A1A1A] p-6 rounded-2xl border border-gray-300/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gray-300/5 rounded-full -mr-16 -mt-16" />
              <div className="flex flex-col items-center relative z-10">
                <div className="mb-4">{getRankIcon(2)}</div>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center mb-3 text-2xl">
                  {topThree[1].name.charAt(0)}
                </div>
                <h3 className="font-medium text-lg mb-1">{topThree[1].name}</h3>
                <div className="text-2xl font-bold text-[#22C55E] mb-2">
                  ₹{topThree[1].profit.toLocaleString()}
                </div>
                <div className="flex gap-4 text-sm text-gray-400">
                  <div>
                    <div className="text-white font-medium">{topThree[1].winRate}%</div>
                    <div className="text-xs">Win Rate</div>
                  </div>
                  <div>
                    <div className="text-white font-medium">{topThree[1].roi}%</div>
                    <div className="text-xs">ROI</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rank 1 */}
          <div className="md:order-2 order-1">
            <div className="bg-gradient-to-br from-[#FACC15]/10 to-[#F9571E]/10 p-8 rounded-2xl border-2 border-[#FACC15]/30 relative overflow-hidden transform md:scale-110">
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#FACC15]/10 rounded-full -mr-20 -mt-20" />
              <div className="flex flex-col items-center relative z-10">
                <div className="mb-4">{getRankIcon(1)}</div>
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FACC15] to-[#F9571E] flex items-center justify-center mb-3 text-3xl shadow-lg shadow-[#FACC15]/50">
                  {topThree[0].name.charAt(0)}
                </div>
                <h3 className="font-medium text-xl mb-1">{topThree[0].name}</h3>
                <div className="text-3xl font-bold text-[#22C55E] mb-2">
                  ₹{topThree[0].profit.toLocaleString()}
                </div>
                <div className="flex gap-4 text-sm text-gray-400">
                  <div>
                    <div className="text-white font-medium">{topThree[0].winRate}%</div>
                    <div className="text-xs">Win Rate</div>
                  </div>
                  <div>
                    <div className="text-white font-medium">{topThree[0].roi}%</div>
                    <div className="text-xs">ROI</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-3 text-[#FACC15]">
                  <Flame className="w-4 h-4" />
                  <span className="text-sm">{topThree[0].streak} win streak</span>
                </div>
              </div>
            </div>
          </div>

          {/* Rank 3 */}
          <div className="md:order-3 order-3">
            <div className="bg-gradient-to-br from-[#141414] to-[#1A1A1A] p-6 rounded-2xl border border-[#CD7F32]/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#CD7F32]/5 rounded-full -mr-16 -mt-16" />
              <div className="flex flex-col items-center relative z-10">
                <div className="mb-4">{getRankIcon(3)}</div>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#CD7F32] to-[#A0522D] flex items-center justify-center mb-3 text-2xl">
                  {topThree[2].name.charAt(0)}
                </div>
                <h3 className="font-medium text-lg mb-1">{topThree[2].name}</h3>
                <div className="text-2xl font-bold text-[#22C55E] mb-2">
                  ₹{topThree[2].profit.toLocaleString()}
                </div>
                <div className="flex gap-4 text-sm text-gray-400">
                  <div>
                    <div className="text-white font-medium">{topThree[2].winRate}%</div>
                    <div className="text-xs">Win Rate</div>
                  </div>
                  <div>
                    <div className="text-white font-medium">{topThree[2].roi}%</div>
                    <div className="text-xs">ROI</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ranked List */}
      <div className="bg-[#141414] rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1A1A1A]">
              <tr>
                <th className="text-left py-4 px-6 text-gray-400 text-sm font-medium">Rank</th>
                <th className="text-left py-4 px-6 text-gray-400 text-sm font-medium">Player</th>
                <th className="text-left py-4 px-6 text-gray-400 text-sm font-medium">Profit</th>
                <th className="text-left py-4 px-6 text-gray-400 text-sm font-medium">ROI</th>
                <th className="text-left py-4 px-6 text-gray-400 text-sm font-medium">Win Rate</th>
                <th className="text-left py-4 px-6 text-gray-400 text-sm font-medium">Streak</th>
                <th className="text-left py-4 px-6 text-gray-400 text-sm font-medium">Trend</th>
              </tr>
            </thead>
            <tbody>
              {restOfPlayers.map((player, index) => (
                <tr
                  key={player.rank}
                  className={`border-t border-white/5 hover:bg-[#1A1A1A] transition-all ${
                    player.name === "You" ? "bg-[#F9571E]/5" : ""
                  } ${index < 7 ? "bg-gradient-to-r from-[#F9571E]/5 to-transparent" : ""}`}
                >
                  <td className="py-4 px-6">
                    <div className={`font-bold ${getRankColor(player.rank)}`}>
                      #{player.rank}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F9571E]/20 to-[#FF8A5B]/20 flex items-center justify-center">
                        {player.name.charAt(0)}
                      </div>
                      <span className={player.name === "You" ? "font-bold" : ""}>{player.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-[#22C55E] font-medium">
                      ₹{player.profit.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-medium">{player.roi}%</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-medium">{player.winRate}%</span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-1">
                      <Flame className="w-4 h-4 text-[#F9571E]" />
                      <span>{player.streak}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {player.trend === "up" && <TrendingUp className="w-5 h-5 text-[#22C55E]" />}
                    {player.trend === "down" && <TrendingDown className="w-5 h-5 text-[#EF4444]" />}
                    {player.trend === "stable" && <div className="w-5 h-0.5 bg-gray-400" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
