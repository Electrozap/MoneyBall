import { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { BetSlipProvider } from '@/lib/BetSlipContext';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import BottomNav from '@/components/BottomNav';
import Dashboard from '@/pages/Dashboard';
import Games from '@/pages/Games';
import BetSlip from '@/pages/BetSlip';
import Ledger from '@/pages/Ledger';
import Friends from '@/pages/Friends';
import GroupBet from '@/pages/GroupBet';
import Auth from '@/pages/Auth';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#00ff87] border-t-transparent animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function AppShell() {
  return (
    <div className="min-h-screen bg-[#0d0d0f] text-white font-sans">
      <div className="mx-auto max-w-[430px] min-h-screen relative pb-20">
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/games" element={<ProtectedRoute><Games /></ProtectedRoute>} />
          <Route path="/bet-slip" element={<ProtectedRoute><BetSlip /></ProtectedRoute>} />
          <Route path="/ledger" element={<ProtectedRoute><Ledger /></ProtectedRoute>} />
          <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
          <Route path="/group-bet" element={<ProtectedRoute><GroupBet /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ProtectedBottomNav />
      </div>
    </div>
  );
}

/** Only render BottomNav when the user is authenticated. */
function ProtectedBottomNav() {
  const { user } = useAuth();
  if (!user) return null;
  return <BottomNav />;
}

export default function App() {
  return (
    <AuthProvider>
      <BetSlipProvider>
        <BrowserRouter>
          <AppShell />
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: '#1a1a1f',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
              },
            }}
          />
        </BrowserRouter>
      </BetSlipProvider>
    </AuthProvider>
  );
}
