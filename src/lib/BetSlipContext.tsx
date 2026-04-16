import { createContext, useContext, useState, ReactNode } from 'react';
import { BetSelection } from '@/types';

interface BetSlipContextType {
  selections: BetSelection[];
  addSelection: (selection: BetSelection) => void;
  removeSelection: (id: string) => void;
  updateSelection: (id: string, updates: Partial<BetSelection>) => void;
  clearSlip: () => void;
}

const BetSlipContext = createContext<BetSlipContextType | null>(null);

export function BetSlipProvider({ children }: { children: ReactNode }) {
  const [selections, setSelections] = useState<BetSelection[]>([]);

  const addSelection = (selection: BetSelection) => {
    setSelections((prev) => {
      // Replace if same game_id + market already in slip
      const exists = prev.find(
        (s) => s.game_id === selection.game_id && s.market === selection.market
      );
      if (exists) {
        return prev.map((s) =>
          s.game_id === selection.game_id && s.market === selection.market
            ? selection
            : s
        );
      }
      return [...prev, selection];
    });
  };

  const removeSelection = (id: string) => {
    setSelections((prev) => prev.filter((s) => s.id !== id));
  };

  const updateSelection = (id: string, updates: Partial<BetSelection>) => {
    setSelections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const clearSlip = () => setSelections([]);

  return (
    <BetSlipContext.Provider
      value={{ selections, addSelection, removeSelection, updateSelection, clearSlip }}
    >
      {children}
    </BetSlipContext.Provider>
  );
}

export function useBetSlip() {
  const ctx = useContext(BetSlipContext);
  if (!ctx) throw new Error('useBetSlip must be used inside BetSlipProvider');
  return ctx;
}
