import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { DataService } from '../lib/supabaseClient';
import type { AppUser } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: AppUser) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!username.trim() || !password) return;

    setLoading(true);
    try {
      const res = await DataService.loginUser(username.trim(), password);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMessage(res.error || 'Invalid username or password. Please verify your credentials.');
      }
    } catch (err) {
      setErrorMessage('Login failed. Please check your credentials or Supabase database connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 select-none font-sans text-[#111827]">
      <div className="w-full max-w-[440px] space-y-6">
        {/* Top Logo & Product Title */}
        <div className="text-center space-y-3">
          {/* Venkateswara Logo Emblem */}
          <div className="inline-flex items-center justify-center">
            <img 
              src="/favicon.png" 
              alt="Venkateswara Logo" 
              className="w-12 h-12 object-contain rounded-full shadow-xs"
            />
          </div>

          <div>
            <h1 className="text-[28px] font-extrabold text-[#111827] tracking-tight">
              Sign in to <span className="text-[#16A34A]">WorkPulse</span>
            </h1>
            <p className="text-[14px] text-[#6B7280] font-medium mt-1">
              Welcome back! Please sign in to your account.
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.05)] space-y-5">
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-[#EF4444] text-[13px] font-medium p-3.5 rounded-[10px] flex items-center space-x-2.5 animate-fade-in">
              <AlertCircle className="w-4.5 h-4.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Field */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-[#111827] block">
                Username
              </label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2 shrink-0 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-[42px] bg-slate-50/70 border border-[#E5E7EB] rounded-[10px] pl-10 pr-4 text-[14px] font-medium text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-[#111827] block">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2 shrink-0 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-[42px] bg-slate-50/70 border border-[#E5E7EB] rounded-[10px] pl-10 pr-10 text-[14px] font-medium text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#111827] transition cursor-pointer p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Controls Row: Remember me & Disabled Forgot Password */}
            <div className="flex items-center justify-between text-[13px] pt-1">
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[#E5E7EB] text-[#16A34A] focus:ring-[#16A34A] cursor-pointer"
                />
                <span className="text-[#111827] font-medium">Remember me</span>
              </label>

              <button
                type="button"
                disabled
                className="text-slate-400 font-medium cursor-not-allowed opacity-60 select-none"
              >
                Forgot your password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !username.trim() || !password}
              className="w-full h-[42px] bg-[#16A34A] hover:bg-[#15803D] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-[14px] rounded-[10px] shadow-xs transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer active:scale-98 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Links & Axon9 Branding */}
        <div className="text-center space-y-4 pt-2">
          <p className="text-[13px] text-[#6B7280] font-medium">
            Don't have an account?{' '}
            <button
              onClick={() => alert('Please contact your administrator to add your user account in the Supabase users table.')}
              className="text-[#16A34A] font-semibold hover:underline cursor-pointer"
            >
              Get started
            </button>
          </p>

          <div className="flex flex-col items-center justify-center space-y-0.5 pt-2 border-t border-[#E5E7EB]/60">
            <div className="flex items-center justify-center space-x-1.5 text-xs text-[#6B7280] font-medium">
              <span>Powered by</span>
              <span className="font-bold text-[#16A34A]">Axon9</span>
            </div>
            <p className="text-[10px] text-[#6B7280]/70 font-medium italic tracking-wide">
              Minds wired to make things
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
