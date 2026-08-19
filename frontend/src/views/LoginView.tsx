import React, { useState } from 'react';
import { School, ArrowRight, Loader2 } from 'lucide-react';

interface LoginViewProps {
  onLogin: (token: string) => void;
}

export function LoginView({ onLogin }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Invalid credentials');
      }

      if (data.token) {
        onLogin(data.token);
      } else {
        throw new Error('No token received');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {/* Background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-full bg-brand-400/20 blur-3xl" />
        <div className="absolute -bottom-[40%] -right-[20%] w-[70%] h-[70%] rounded-full bg-blue-400/20 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
        <div className="glass-panel p-8 md:p-10 bg-white/90 shadow-2xl shadow-brand-500/10">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-tr from-brand-600 to-brand-400 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/30 mb-6">
              <School className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight text-center">
              Welcome back
            </h1>
            <p className="text-sm text-gray-500 mt-2 font-medium text-center">
              Sign in to your School account
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-xl border border-red-100 font-medium text-center">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all outline-none bg-white/50 focus:bg-white text-gray-900 font-medium"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all outline-none bg-white/50 focus:bg-white text-gray-900 font-medium"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3.5 flex items-center justify-center text-sm font-bold shadow-xl shadow-brand-500/20 hover:shadow-brand-500/30 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:hover:translate-y-0 disabled:shadow-none"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-8 font-medium">
          School Management Pilot
        </p>
      </div>
    </div>
  );
}
