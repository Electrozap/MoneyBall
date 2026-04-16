import { useState } from "react";
import { Check, X, Trophy } from "lucide-react";

type BetStatus = "active" | "pending" | "completed";

interface Bet {
  id: number;
  match: string;
  betType: string;
  odds: string;
  stake: string;
  opponent: string;
  status: BetStatus;
  result?: "won" | "lost";
  profit?: string;
}

const bets: Bet[] = [
  {
    id: 1,
    match: "Lakers vs Warriors",
    betType: "Moneyline - Lakers",
    odds: "1:1.8",
    stake: "₹2,000",
    opponent: "Alex Rodriguez",
    status: "active",
  },
  {
    id: 2,
    match: "Celtics vs Heat",
    betType: "Spread -5.5",
    odds: "1:2.1",
    stake: "₹1,500",
    opponent: "Sarah Chen",
    status: "active",
  },
  {
    id: 3,
    match: "Mavericks vs Suns",
    betType: "Player Props (Luka 30+ pts)",
    odds: "1:2.5",
    stake: "₹3,000",
    opponent: "Mike Johnson",
    status: "pending",
  },
  {
    id: 4,
    match: "Nuggets vs Clippers",
    betType: "Over 215.5",
    odds: "1:1.9",
    stake: "₹2,500",
    opponent: "Emily Davis",
    status: "pending",
  },
  {
    id: 5,
    match: "Bucks vs Nets",
    betType: "Moneyline - Bucks",
    odds: "1:1.7",
    stake: "₹2,000",
    opponent: "Chris Martinez",
    status: "completed",
    result: "won",
    profit: "+₹3,400",
  },
  {
    id: 6,
    match: "76ers vs Knicks",
    betType: "Spread +3.5",
    odds: "1:1.8",
    stake: "₹1,800",
    opponent: "Alex Rodriguez",
    status: "completed",
    result: "lost",
    profit: "-₹1,800",
  },
  {
    id: 7,
    match: "Heat vs Raptors",
    betType: "Over 208.5",
    odds: "1:2.0",
    stake: "₹2,200",
    opponent: "Sarah Chen",
    status: "completed",
    result: "won",
    profit: "+₹4,400",
  },
];

export function MyBets() {
  const [activeTab, setActiveTab] = useState<BetStatus>("active");

  const filteredBets = bets.filter((bet) => bet.status === activeTab);

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl mb-1">My Bets</h1>
        <p className="text-gray-400">Manage your betting activity</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab("active")}
          className={`px-6 py-3 rounded-2xl whitespace-nowrap transition-all ${
            activeTab === "active"
              ? "bg-[#F9571E] text-white"
              : "bg-[#141414] text-gray-400 hover:bg-[#1A1A1A]"
          }`}
        >
          Active ({bets.filter((b) => b.status === "active").length})
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-6 py-3 rounded-2xl whitespace-nowrap transition-all ${
            activeTab === "pending"
              ? "bg-[#F9571E] text-white"
              : "bg-[#141414] text-gray-400 hover:bg-[#1A1A1A]"
          }`}
        >
          Pending ({bets.filter((b) => b.status === "pending").length})
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={`px-6 py-3 rounded-2xl whitespace-nowrap transition-all ${
            activeTab === "completed"
              ? "bg-[#F9571E] text-white"
              : "bg-[#141414] text-gray-400 hover:bg-[#1A1A1A]"
          }`}
        >
          Completed ({bets.filter((b) => b.status === "completed").length})
        </button>
      </div>

      {/* Bet Cards */}
      <div className="grid gap-4">
        {filteredBets.length === 0 ? (
          <div className="bg-[#141414] p-12 rounded-2xl border border-white/5 text-center">
            <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No {activeTab} bets</p>
          </div>
        ) : (
          filteredBets.map((bet) => (
            <div
              key={bet.id}
              className="bg-[#141414] p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-lg">{bet.match}</h3>
                    {bet.status === "completed" && bet.result && (
                      <span
                        className={`px-3 py-1 rounded-lg text-sm ${
                          bet.result === "won"
                            ? "bg-[#22C55E]/10 text-[#22C55E]"
                            : "bg-[#EF4444]/10 text-[#EF4444]"
                        }`}
                      >
                        {bet.profit}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 mb-3">{bet.betType}</p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Odds:</span>{" "}
                      <span className="text-white">{bet.odds}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Stake:</span>{" "}
                      <span className="text-white">{bet.stake}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Opponent:</span>{" "}
                      <span className="text-white">{bet.opponent}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {bet.status === "pending" && (
                    <>
                      <button className="px-6 py-3 bg-[#22C55E] text-white rounded-xl hover:bg-[#22C55E]/90 transition-all flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        Accept
                      </button>
                      <button className="px-6 py-3 bg-[#EF4444] text-white rounded-xl hover:bg-[#EF4444]/90 transition-all flex items-center gap-2">
                        <X className="w-4 h-4" />
                        Reject
                      </button>
                    </>
                  )}
                  {bet.status === "active" && (
                    <button className="px-6 py-3 bg-[#F9571E] text-white rounded-xl hover:bg-[#F9571E]/90 transition-all">
                      Resolve Outcome
                    </button>
                  )}
                  {bet.status === "completed" && (
                    <div className="flex items-center gap-2 text-gray-400">
                      {bet.result === "won" ? (
                        <>
                          <Check className="w-5 h-5 text-[#22C55E]" />
                          <span>Won</span>
                        </>
                      ) : (
                        <>
                          <X className="w-5 h-5 text-[#EF4444]" />
                          <span>Lost</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
