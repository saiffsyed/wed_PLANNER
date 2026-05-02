import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Crescent, GoldDivider, Bismillah } from './_nikahly';

export function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) await signIn(email, password);
      else await signUp(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-jali-on-indigo flex items-center justify-center p-4 relative overflow-hidden">
      {/* gold radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(201,168,76,0.18), transparent 60%)',
        }}
      />
      <div className="max-w-md w-full relative">
        <div className="bg-ivory-50 rounded-3xl shadow-indigo-soft p-10 border border-gold-300/40">
          <div className="text-center mb-6 flex flex-col items-center gap-3">
            <Crescent size={44} />
            <Bismillah className="!text-base" />
            <h1 className="text-4xl font-display font-semibold text-indigo-900">Nikahly</h1>
            <p className="text-indigo-900/60 italic font-display">Your wedding companion</p>
            <GoldDivider className="w-40 mt-2" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 mt-8">
            <div>
              <label htmlFor="email" className="nk-label">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="nk-input"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="nk-label">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="nk-input"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="bg-rose-100 border border-rose-300 text-rose-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="nk-btn-primary w-full">
              {loading ? 'Loading…' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-indigo-900/70 hover:text-gold-700 text-sm font-medium transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
