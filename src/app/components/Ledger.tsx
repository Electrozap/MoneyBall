import { useState } from "react";
import { AlertCircle, CheckCircle, Send, X } from "lucide-react";

interface LedgerItem {
  id: number;
  name: string;
  amount: number;
  avatar: string;
}

const youOwe: LedgerItem[] = [
  { id: 1, name: "Alex Rodriguez", amount: 3500, avatar: "A" },
  { id: 2, name: "Sarah Chen", amount: 1800, avatar: "S" },
  { id: 3, name: "Mike Johnson", amount: 2200, avatar: "M" },
];

const youAreOwed: LedgerItem[] = [
  { id: 4, name: "Emily Davis", amount: 4200, avatar: "E" },
  { id: 5, name: "Chris Martinez", amount: 2900, avatar: "C" },
  { id: 6, name: "Jessica Lee", amount: 1500, avatar: "J" },
  { id: 7, name: "David Park", amount: 3100, avatar: "D" },
];

export function Ledger() {
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [settleType, setSettleType] = useState<"owe" | "owed" | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<LedgerItem | null>(null);
  const [settleAmount, setSettleAmount] = useState("");

  const totalOwe = youOwe.reduce((sum, item) => sum + item.amount, 0);
  const totalOwed = youAreOwed.reduce((sum, item) => sum + item.amount, 0);
  const netBalance = totalOwed - totalOwe;

  const handleSettle = (person: LedgerItem, type: "owe" | "owed") => {
    setSelectedPerson(person);
    setSettleType(type);
    setSettleAmount(person.amount.toString());
    setShowSettleModal(true);
  };

  const handleRequest = (person: LedgerItem) => {
    // Handle payment request
    console.log("Request payment from", person.name);
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl mb-1">Ledger</h1>
        <p className="text-gray-400">Manage your payments and settlements</p>
      </div>

      {/* Net Balance Card */}
      <div className="bg-gradient-to-br from-[#1A1A1A] to-[#141414] p-8 rounded-2xl border border-white/10 mb-8">
        <div className="text-center">
          <div className="text-gray-400 mb-2">Net Balance</div>
          <div
            className={`text-4xl font-bold mb-2 ${
              netBalance >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"
            }`}
          >
            {netBalance >= 0 ? "+" : ""}₹{netBalance.toLocaleString()}
          </div>
          <div className="text-sm text-gray-400">
            {netBalance >= 0 ? "You are owed more than you owe" : "You owe more than you are owed"}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* You Owe Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-[#EF4444]" />
            <h2 className="text-xl">You Owe</h2>
            <span className="ml-auto text-[#EF4444] font-bold">
              ₹{totalOwe.toLocaleString()}
            </span>
          </div>
          <div className="space-y-3">
            {youOwe.length === 0 ? (
              <div className="bg-[#141414] p-8 rounded-2xl border border-white/5 text-center">
                <CheckCircle className="w-10 h-10 text-[#22C55E] mx-auto mb-3" />
                <p className="text-gray-400">All settled up!</p>
              </div>
            ) : (
              youOwe.map((person) => (
                <div
                  key={person.id}
                  className="bg-[#141414] p-5 rounded-2xl border border-[#EF4444]/20 hover:border-[#EF4444]/40 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#EF4444]/20 to-[#EF4444]/10 flex items-center justify-center text-lg">
                        {person.avatar}
                      </div>
                      <div>
                        <div className="font-medium">{person.name}</div>
                        <div className="text-[#EF4444] font-bold">
                          ₹{person.amount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSettle(person, "owe")}
                      className="px-5 py-2.5 bg-[#EF4444] text-white rounded-xl hover:bg-[#EF4444]/90 transition-all"
                    >
                      Settle
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* You Are Owed Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-[#22C55E]" />
            <h2 className="text-xl">You Are Owed</h2>
            <span className="ml-auto text-[#22C55E] font-bold">
              ₹{totalOwed.toLocaleString()}
            </span>
          </div>
          <div className="space-y-3">
            {youAreOwed.length === 0 ? (
              <div className="bg-[#141414] p-8 rounded-2xl border border-white/5 text-center">
                <AlertCircle className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No pending payments</p>
              </div>
            ) : (
              youAreOwed.map((person) => (
                <div
                  key={person.id}
                  className="bg-[#141414] p-5 rounded-2xl border border-[#22C55E]/20 hover:border-[#22C55E]/40 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#22C55E]/20 to-[#22C55E]/10 flex items-center justify-center text-lg">
                        {person.avatar}
                      </div>
                      <div>
                        <div className="font-medium">{person.name}</div>
                        <div className="text-[#22C55E] font-bold">
                          ₹{person.amount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRequest(person)}
                      className="px-5 py-2.5 bg-[#22C55E] text-white rounded-xl hover:bg-[#22C55E]/90 transition-all flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Request
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Settlement Modal */}
      {showSettleModal && selectedPerson && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#141414] w-full max-w-md rounded-3xl overflow-hidden">
            <div className="bg-[#1A1A1A] p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl">Settle Payment</h2>
              <button
                onClick={() => setShowSettleModal(false)}
                className="w-10 h-10 rounded-full bg-[#0A0A0A] flex items-center justify-center hover:bg-[#252525] transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#F9571E]/20 to-[#FF8A5B]/20 flex items-center justify-center text-2xl mx-auto mb-3">
                  {selectedPerson.avatar}
                </div>
                <div className="font-medium mb-1">{selectedPerson.name}</div>
                <div
                  className={`text-2xl font-bold ${
                    settleType === "owe" ? "text-[#EF4444]" : "text-[#22C55E]"
                  }`}
                >
                  ₹{selectedPerson.amount.toLocaleString()}
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-2">Settlement Amount (₹)</label>
                <input
                  type="number"
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#F9571E]/50"
                  placeholder="Enter amount"
                />
              </div>

              <div className="bg-[#1A1A1A] p-4 rounded-xl">
                <div className="text-sm text-gray-400 mb-2">Payment Method</div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#F9571E]/20 rounded-lg flex items-center justify-center">
                    💳
                  </div>
                  <div>
                    <div className="font-medium">UPI / Bank Transfer</div>
                    <div className="text-sm text-gray-400">Direct settlement</div>
                  </div>
                </div>
              </div>

              <button className="w-full bg-gradient-to-r from-[#F9571E] to-[#FF8A5B] text-white py-4 rounded-2xl hover:shadow-lg hover:shadow-[#F9571E]/30 transition-all">
                Confirm Settlement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
