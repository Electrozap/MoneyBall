import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

type Mode = 'login' | 'signup';

export default function Auth() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/');
      } else {
        if (!fullName.trim()) throw new Error('Please enter your name.');
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
          // Create profile row
          const { error: profileError } = await supabase.from('profiles').insert({
            id: data.user.id,
            full_name: fullName.trim(),
            email: data.user.email ?? email,
            avatar_url: null,
          });
          if (profileError) console.error('profile insert error:', profileError);
        }
        toast.success('Account created! Check your email to confirm.');
        setMode('login');
      }
    } catch (err: any) {
      console.error('auth error:', err);
      toast.error(err.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center px-4">
      <div className="w-full max-w-[380px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">MoneyBall 🏀</h1>
          <p className="text-[#8b8b9a] text-sm mt-1">Bet with friends. Track everything.</p>
        </div>

        {/* Card */}
        <div className="bg-[#1a1a1f] rounded-2xl p-6 border border-white/5">
          {/* Mode toggle */}
          <div className="flex gap-1 bg-black/30 rounded-xl p-1 mb-6">
            {(['login', 'signup'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors capitalize ${
                  mode === m ? 'bg-[#00ff87] text-black' : 'text-[#8b8b9a] hover:text-white'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="text-xs text-[#8b8b9a] mb-1 block">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="Manan Mehta"
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder-[#8b8b9a] focus:outline-none focus:border-[#00ff87]/50"
                />
              </div>
            )}

            <div>
              <label className="text-xs text-[#8b8b9a] mb-1 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder-[#8b8b9a] focus:outline-none focus:border-[#00ff87]/50"
              />
            </div>

            <div>
              <label className="text-xs text-[#8b8b9a] mb-1 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder-[#8b8b9a] focus:outline-none focus:border-[#00ff87]/50"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00ff87] text-black font-bold py-3 rounded-xl text-sm mt-2 disabled:opacity-50 transition-opacity"
            >
              {loading ? '…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
