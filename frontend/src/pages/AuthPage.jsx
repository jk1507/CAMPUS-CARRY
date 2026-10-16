import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  Bike, 
  Eye, 
  EyeOff, 
  ArrowRight,
  School,
  Mail,
  Lock,
  User,
  Phone
} from 'lucide-react';
import useAuthStore from '../store/authStore.js';
import toast from 'react-hot-toast';
import Logo from '../components/common/Logo.jsx';
import ThemeToggle from '../components/common/ThemeToggle.jsx';

export default function AuthPage() {
  const navigate = useNavigate();
  const { login, register, isLoading } = useAuthStore();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [chosenRole, setChosenRole] = useState('requester'); // 'requester' | 'carrier'
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', campus: '', phone: '' });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Strict email regex
  const STRICT_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  // Password requirement tests
  const passwordChecks = {
    length: form.password.length >= 8,
    upper: /[A-Z]/.test(form.password),
    lower: /[a-z]/.test(form.password),
    number: /[0-9]/.test(form.password),
    special: /[^A-Za-z0-9]/.test(form.password),
  };
  const isPasswordSecure = Object.values(passwordChecks).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = (form.email || '').trim().toLowerCase();
    const cleanPassword = form.password || '';

    if (!cleanEmail || !cleanPassword) return toast.error('Email and password required');

    // Strict email check
    if (!STRICT_EMAIL_REGEX.test(cleanEmail)) {
      return toast.error('Please enter a valid email address (e.g. name@campus.edu or name@gmail.com)');
    }

    if (mode === 'register') {
      if (!form.name.trim()) return toast.error('Name is required');
      if (!form.campus.trim()) return toast.error('Campus name is required');
      if (chosenRole === 'carrier' && !form.phone.trim()) {
        return toast.error('Phone number required for carriers');
      }

      // Strong password validation check
      if (!isPasswordSecure) {
        if (!passwordChecks.length) return toast.error('Password must be at least 8 characters long');
        if (!passwordChecks.upper) return toast.error('Password must include an uppercase letter (A-Z)');
        if (!passwordChecks.lower) return toast.error('Password must include a lowercase letter (a-z)');
        if (!passwordChecks.number) return toast.error('Password must include a number (0-9)');
        if (!passwordChecks.special) return toast.error('Password must include a special character (!@#$%^&*...)');
      }
    }

    const result =
      mode === 'login'
        ? await login(cleanEmail, cleanPassword, chosenRole)
        : await register({ ...form, email: cleanEmail, role: chosenRole });

    if (result.success) {
      toast.success(mode === 'login' ? 'Welcome back! ⚡' : 'Welcome to Zipp! 🚀');
      navigate('/app');
    } else {
      toast.error(result.error || 'Authentication failed');
    }
  };

  return (
    <div className="min-h-full bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col justify-center px-4 py-8 sm:px-6 relative">
      {/* Top Corner Floating Toggle & Back */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md mx-auto">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Logo className="h-8 justify-center mb-3" />
          <h1 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white">
            {mode === 'login' ? 'Sign in to Zipp' : 'Join your campus network'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {mode === 'login'
              ? 'Access your orders, live deliveries, and campus radar'
              : 'Deliver errands or post tasks for fellow students'}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
          {/* Segmented Mode Switcher */}
          <div className="p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex mb-6">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                mode === 'login'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                mode === 'register'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          {/* Role Cards (Interactive selection) */}
          <div className="mb-5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Primary Goal
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setChosenRole('requester')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  chosenRole === 'requester'
                    ? 'border-blue-600 dark:border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center mb-1.5 shadow-sm">
                  <Package className="w-4 h-4" />
                </div>
                <p className="text-xs font-bold">Requester</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  Need food or parcels
                </p>
              </button>

              <button
                type="button"
                onClick={() => setChosenRole('carrier')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  chosenRole === 'carrier'
                    ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center mb-1.5 shadow-sm">
                  <Bike className="w-4 h-4" />
                </div>
                <p className="text-xs font-bold">Carrier</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  Deliver & earn tips
                </p>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="Aditya Sharma"
                    autoComplete="name"
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                College Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="student@campus.edu"
                  autoComplete="email"
                  inputMode="email"
                  className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Campus / University
                </label>
                <div className="relative">
                  <School className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={form.campus}
                    onChange={(e) => set('campus', e.target.value)}
                    placeholder="e.g. IIT Delhi, VIT, SRM, BITS"
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>
            )}

            {mode === 'register' && chosenRole === 'carrier' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Phone (for Delivery WhatsApp/Call)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => set('phone', e.target.value)}
                    placeholder="9876543210"
                    autoComplete="tel"
                    inputMode="tel"
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                {mode === 'register' && form.password && (
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${isPasswordSecure ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    {isPasswordSecure ? '✓ Strong' : 'Requires security criteria'}
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  placeholder={mode === 'register' ? 'Min. 8 chars (A-Z, a-z, 0-9, special)' : 'Enter password'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Requirements Checklist (Registration only) */}
              {mode === 'register' && (
                <div className="mt-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 text-[11px] space-y-1">
                  <div className="font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Secure Password Requirements:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
                    <div className={`flex items-center gap-1.5 ${passwordChecks.length ? 'text-emerald-500 font-medium' : 'text-slate-400'}`}>
                      <span>{passwordChecks.length ? '✓' : '○'}</span>
                      <span>At least 8 characters</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${passwordChecks.upper ? 'text-emerald-500 font-medium' : 'text-slate-400'}`}>
                      <span>{passwordChecks.upper ? '✓' : '○'}</span>
                      <span>One uppercase (A-Z)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${passwordChecks.lower ? 'text-emerald-500 font-medium' : 'text-slate-400'}`}>
                      <span>{passwordChecks.lower ? '✓' : '○'}</span>
                      <span>One lowercase (a-z)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${passwordChecks.number ? 'text-emerald-500 font-medium' : 'text-slate-400'}`}>
                      <span>{passwordChecks.number ? '✓' : '○'}</span>
                      <span>One number (0-9)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 sm:col-span-2 ${passwordChecks.special ? 'text-emerald-500 font-medium' : 'text-slate-400'}`}>
                      <span>{passwordChecks.special ? '✓' : '○'}</span>
                      <span>One symbol (!@#$%^&*...)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-lg shadow-blue-600/30 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Continue' : 'Create Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
