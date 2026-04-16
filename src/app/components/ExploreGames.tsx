import { useState } from "react";
import { X, Search, Calendar, Clock } from "lucide-react";

const games = [
  { 
    id: 1,
    homeTeam: "Lakers", 
    awayTeam: "Warriors", 
    homeScore: null,
    awayScore: null,
    time: "7:00 PM", 
    date: "Today",
    isLive: true 
  },
  { 
    id: 2,
    homeTeam: "Celtics", 
    awayTeam: "Heat", 
    homeScore: null,
    awayScore: null,
    time: "8:30 PM", 
    date: "Today",
    isLive: false 
  },
  { 
    id: 3,
    homeTeam: "Bucks", 
    awayTeam: "Nets", 
    homeScore: null,
    awayScore: null,
    time: "9:00 PM", 
    date: "Today",
    isLive: false 
  },
  { 
    id: 4,
    homeTeam: "Mavericks", 
    awayTeam: "Suns", 
    homeScore: null,
    awayScore: null,
    time: "10:00 PM", 
    date: "Tomorrow",
    isLive: false 
  },
  { 
    id: 5,
    homeTeam: "Nuggets", 
    awayTeam: "Clippers", 
    homeScore: null,
    awayScore: null,
    time: "7:30 PM", 
    date: "Tomorrow",
    isLive: false 
  },
  { 
    id: 6,
    homeTeam: "76ers", 
    awayTeam: "Knicks", 
    homeScore: null,
    awayScore: null,
    time: "8:00 PM", 
    date: "Tomorrow",
    isLive: false 
  },
];

const betTypes = [
  { id: "moneyline", label: "Moneyline", category: "core" },
  { id: "spread", label: "Spread", category: "core" },
  { id: "overunder", label: "Over/Under", category: "core" },
  { id: "playerpoints", label: "Player Points", category: "player" },
  { id: "playerassists", label: "Player Assists", category: "player" },
  { id: "playerrebounds", label: "Player Rebounds", category: "player" },
  { id: "3ptmade", label: "3PT Made", category: "player" },
  { id: "firstbasket", label: "First Basket", category: "player" },
  { id: "doubledouble", label: "Double Double", category: "player" },
  { id: "winmargin", label: "Winning Margin", category: "game" },
  { id: "teamtotals", label: "Team Totals", category: "game" },
  { id: "quarterwinner", label: "Quarter Winner", category: "time" },
];

const friends = [
  { id: 1, name: "Alex Rodriguez" },
  { id: 2, name: "Sarah Chen" },
  { id: 3, name: "Mike Johnson" },
  { id: 4, name: "Emily Davis" },
  { id: 5, name: "Chris Martinez" },
];

export function ExploreGames() {
  const [selectedGame, setSelectedGame] = useState<number | null>(null);
  const [selectedBetType, setSelectedBetType] = useState<string>("moneyline");
  const [selectedTeam, setSelectedTeam] = useState<string>("home");
  const [oddsMode, setOddsMode] = useState<"ratio" | "outcome">("ratio");
  const [yourOdds, setYourOdds] = useState("1.8");
  const [opponentOdds, setOpponentOdds] = useState("1.8");
  const [stake, setStake] = useState("1000");
  const [selectedFriend, setSelectedFriend] = useState<number | null>(null);

  const game = games.find(g => g.id === selectedGame);

  const calculatePayout = () => {
    const stakeNum = parseFloat(stake) || 0;
    const oddsNum = parseFloat(yourOdds) || 1;
    return (stakeNum * oddsNum).toFixed(0);
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl mb-1">Explore Games</h1>
        <p className="text-gray-400">Find and bet on NBA games</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search teams or games..."
          className="w-full bg-[#141414] border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#F9571E]/50"
        />
      </div>

      {/* Games Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {games.map((game) => (
          <div
            key={game.id}
            onClick={() => setSelectedGame(game.id)}
            className="bg-[#141414] p-6 rounded-2xl border border-white/5 hover:border-[#F9571E]/50 transition-all cursor-pointer group"
          >
            {game.isLive && (
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-[#EF4444] rounded-full animate-pulse" />
                <span className="text-[#EF4444] text-sm">LIVE</span>
              </div>
            )}
            
            <div className="flex items-center justify-between mb-6">
              <div className="flex-1 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-[#F9571E]/20 to-[#FF8A5B]/20 rounded-full mx-auto mb-2 flex items-center justify-center text-xl">
                  {game.homeTeam.charAt(0)}
                </div>
                <div className="font-medium">{game.homeTeam}</div>
              </div>
              
              <div className="text-gray-400 text-sm px-4">VS</div>
              
              <div className="flex-1 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full mx-auto mb-2 flex items-center justify-center text-xl">
                  {game.awayTeam.charAt(0)}
                </div>
                <div className="font-medium">{game.awayTeam}</div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {game.date}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {game.time}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bet Builder Panel */}
      {selectedGame && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end lg:items-center justify-center p-0 lg:p-4 animate-in fade-in">
          <div className="bg-[#0A0A0A] w-full lg:max-w-4xl lg:rounded-3xl overflow-hidden max-h-[90vh] overflow-y-auto rounded-t-3xl">
            {/* Header */}
            <div className="sticky top-0 bg-[#141414] p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-xl mb-1">Create Bet</h2>
                <p className="text-gray-400 text-sm">
                  {game?.homeTeam} vs {game?.awayTeam}
                </p>
              </div>
              <button
                onClick={() => setSelectedGame(null)}
                className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center hover:bg-[#252525] transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Bet Type Selector */}
              <div>
                <label className="block mb-3 text-gray-400">Bet Type</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {betTypes.slice(0, 6).map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedBetType(type.id)}
                      className={`p-4 rounded-xl border transition-all ${
                        selectedBetType === type.id
                          ? "bg-[#F9571E] border-[#F9571E] text-white"
                          : "bg-[#141414] border-white/10 text-gray-400 hover:border-white/20"
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selection */}
              {selectedBetType === "moneyline" && (
                <div>
                  <label className="block mb-3 text-gray-400">Select Team</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setSelectedTeam("home")}
                      className={`p-4 rounded-xl border transition-all ${
                        selectedTeam === "home"
                          ? "bg-[#F9571E] border-[#F9571E] text-white"
                          : "bg-[#141414] border-white/10 text-gray-400 hover:border-white/20"
                      }`}
                    >
                      {game?.homeTeam}
                    </button>
                    <button
                      onClick={() => setSelectedTeam("away")}
                      className={`p-4 rounded-xl border transition-all ${
                        selectedTeam === "away"
                          ? "bg-[#F9571E] border-[#F9571E] text-white"
                          : "bg-[#141414] border-white/10 text-gray-400 hover:border-white/20"
                      }`}
                    >
                      {game?.awayTeam}
                    </button>
                  </div>
                </div>
              )}

              {/* Custom Odds Engine */}
              <div>
                <label className="block mb-3 text-gray-400">Custom Odds</label>
                <div className="flex gap-3 mb-4">
                  <button
                    onClick={() => setOddsMode("ratio")}
                    className={`flex-1 py-2 px-4 rounded-xl border transition-all ${
                      oddsMode === "ratio"
                        ? "bg-[#F9571E] border-[#F9571E] text-white"
                        : "bg-[#141414] border-white/10 text-gray-400"
                    }`}
                  >
                    Ratio Input
                  </button>
                  <button
                    onClick={() => setOddsMode("outcome")}
                    className={`flex-1 py-2 px-4 rounded-xl border transition-all ${
                      oddsMode === "outcome"
                        ? "bg-[#F9571E] border-[#F9571E] text-white"
                        : "bg-[#141414] border-white/10 text-gray-400"
                    }`}
                  >
                    Outcome Based
                  </button>
                </div>

                {oddsMode === "ratio" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Your Odds (1 : X)</label>
                      <input
                        type="number"
                        value={yourOdds}
                        onChange={(e) => setYourOdds(e.target.value)}
                        className="w-full bg-[#141414] border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#F9571E]/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Opponent Odds (1 : X)</label>
                      <input
                        type="number"
                        value={opponentOdds}
                        onChange={(e) => setOpponentOdds(e.target.value)}
                        className="w-full bg-[#141414] border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#F9571E]/50"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Stake & Friend Selection */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-3 text-gray-400">Stake Amount (₹)</label>
                  <input
                    type="number"
                    value={stake}
                    onChange={(e) => setStake(e.target.value)}
                    className="w-full bg-[#141414] border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#F9571E]/50"
                  />
                </div>
                <div>
                  <label className="block mb-3 text-gray-400">Select Friend</label>
                  <select
                    value={selectedFriend || ""}
                    onChange={(e) => setSelectedFriend(Number(e.target.value))}
                    className="w-full bg-[#141414] border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#F9571E]/50"
                  >
                    <option value="">Choose a friend</option>
                    {friends.map((friend) => (
                      <option key={friend.id} value={friend.id}>
                        {friend.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bet Preview */}
              <div className="bg-[#1A1A1A] p-6 rounded-2xl border border-white/10">
                <div className="text-center">
                  <div className="text-gray-400 text-sm mb-2">Potential Payout</div>
                  <div className="text-3xl font-bold text-[#22C55E] mb-4">
                    ₹{calculatePayout()}
                  </div>
                  <div className="text-sm text-gray-400">
                    Risk ₹{stake} to win ₹{calculatePayout()}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button className="w-full bg-gradient-to-r from-[#F9571E] to-[#FF8A5B] text-white py-4 px-6 rounded-2xl hover:shadow-lg hover:shadow-[#F9571E]/30 transition-all">
                Send Bet Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
