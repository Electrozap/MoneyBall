import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BetSlipProvider } from '@/lib/BetSlipContext';
import BottomNav from '@/components/BottomNav';
import Dashboard from '@/pages/Dashboard';
import Games from '@/pages/Games';
import BetSlip from '@/pages/BetSlip';
import Ledger from '@/pages/Ledger';

export default function App() {
  return (
    <BetSlipProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[#0d0d0f] text-white font-sans">
          {/* Mobile-first: centered max-width container */}
          <div className="mx-auto max-w-[430px] min-h-screen relative pb-20">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/games" element={<Games />} />
              <Route path="/bet-slip" element={<BetSlip />} />
              <Route path="/ledger" element={<Ledger />} />
            </Routes>
            <BottomNav />
          </div>
        </div>
      </BrowserRouter>
    </BetSlipProvider>
  );
}
