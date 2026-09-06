import React, { useState } from 'react';
import { School, ArrowRight, Loader2, Eye, EyeOff, KeyRound, CheckCircle2, X } from 'lucide-react';

interface LoginViewProps {
  onLogin: (token: string) => void;
}

export function LoginView({ onLogin }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset Password Modal State
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetError, setResetError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetting(true);
    setResetError('');
    setResetSuccess('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail.trim(), newPassword: resetPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      setResetSuccess(data.message || 'Password reset successfully!');
      setEmail(resetEmail);
      setPassword('');
      setTimeout(() => {
        setIsResetOpen(false);
        setResetSuccess('');
      }, 2000);
    } catch (err: any) {
      setResetError(err.message || 'Error resetting password');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto relative">
      {/* Background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-full bg-brand-400/20 blur-3xl" />
        <div className="absolute -bottom-[40%] -right-[20%] w-[70%] h-[70%] rounded-full bg-blue-400/20 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out my-auto">
        <div className="glass-panel p-6 sm:p-10 bg-white/90 shadow-2xl shadow-brand-500/10 rounded-2xl sm:rounded-3xl">
          <div className="flex flex-col items-center mb-6 sm:mb-8">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-tr from-brand-600 to-brand-400 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/30 mb-4 sm:mb-6">
              <School className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight text-center">
              Welcome back
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1.5 sm:mt-2 font-medium text-center">
              Sign in to your School account
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-3 text-xs sm:text-sm text-red-600 bg-red-50 rounded-xl border border-red-100 font-medium text-center">
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all outline-none bg-white/50 focus:bg-white text-gray-900 font-medium text-sm"
                  placeholder="e.g. principal@namu.edu"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setIsResetOpen(true);
                      setResetError('');
                      setResetSuccess('');
                    }}
                    className="text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-4 pr-11 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all outline-none bg-white/50 focus:bg-white text-gray-900 font-medium text-sm"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700 transition-colors"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3.5 flex items-center justify-center text-sm font-bold shadow-xl shadow-brand-500/20 hover:shadow-brand-500/30 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:hover:translate-y-0 disabled:shadow-none min-h-[44px]"
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

          {/* Quick Role Credentials Helper */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest text-center mb-2.5">
              Quick Role Test Logins (Password: password123)
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {[
                { label: 'Principal', email: 'principal@namu.edu' },
                { label: 'Head Master', email: 'headmaster@namu.edu' },
                { label: 'Form Master', email: 'formmaster@namu.edu' },
                { label: 'Teacher', email: 'teacher@namu.edu' },
                { label: 'Student', email: 'student@namu.edu' },
                { label: 'Parent', email: 'parent@namu.edu' },
              ].map((role) => (
                <button
                  key={role.email}
                  type="button"
                  onClick={() => {
                    setEmail(role.email);
                    setPassword('password123');
                  }}
                  className="px-2.5 py-1 bg-gray-50 hover:bg-brand-50 text-gray-600 hover:text-brand-700 border border-gray-200 hover:border-brand-200 rounded-lg text-xs font-bold transition-all"
                >
                  {role.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs sm:text-sm text-gray-500 mt-6 font-medium">
          School Management Pilot System
        </p>
      </div>

      {/* Reset Password Modal */}
      {isResetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100 relative">
            <button
              onClick={() => setIsResetOpen(false)}
              className="absolute right-4 top-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900">Reset Password</h3>
                <p className="text-xs text-gray-500 font-medium">Set a new password for your account</p>
              </div>
            </div>

            {resetSuccess && (
              <div className="p-3 mb-4 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2 shrink-0" /> {resetSuccess}
              </div>
            )}

            {resetError && (
              <div className="p-3 mb-4 text-xs font-bold text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
                {resetError}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Account Email
                </label>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm font-semibold text-gray-900"
                  placeholder="Enter your registered email"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  New Password (Min. 6 chars)
                </label>
                <div className="relative">
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    className="w-full pl-4 pr-11 py-2.5 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm font-semibold text-gray-900"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResetOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="btn-primary px-5 py-2.5 text-xs font-bold flex items-center"
                >
                  {isResetting && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
