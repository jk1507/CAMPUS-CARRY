import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, 
  Clock, 
  ShieldCheck, 
  ArrowRight, 
  Bike, 
  Package, 
  MapPin, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import Logo from '../components/common/Logo.jsx';
import ThemeToggle from '../components/common/ThemeToggle.jsx';

export default function LandingPage() {
  const navigate = useNavigate();

  const steps = [
    {
      num: '01',
      icon: Package,
      title: 'Post what you need',
      desc: 'Canteen food, lab kit, printouts, or hostel parcel. Set a fair tip.',
    },
    {
      num: '02',
      icon: Bike,
      title: 'A peer grabs it',
      desc: 'Students walking the same route accept the job in seconds.',
    },
    {
      num: '03',
      icon: MapPin,
      title: 'Follow live on map',
      desc: 'See turn-by-turn progress across campus in real-time.',
    },
    {
      num: '04',
      icon: ShieldCheck,
      title: 'OTP Handover',
      desc: 'Verify the 4-digit code and done. Zero hassle, instant delivery.',
    },
  ];

  return (
    <div className="min-h-full bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <nav className="w-full px-5 py-4 max-w-4xl mx-auto flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => navigate('/auth')}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/auth')}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/25 active:scale-95 transition-all"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 max-w-4xl mx-auto px-5 pt-8 pb-16 flex flex-col items-center text-center">
        {/* Campus Live Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold mb-6 animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Made for Indian University Campuses</span>
        </div>

        {/* Hero Headline */}
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-950 dark:text-white max-w-2xl leading-[1.15]">
          Campus errands, moved in <span className="text-blue-600 dark:text-blue-400 underline decoration-blue-500/30 decoration-wavy">minutes</span>.
        </h1>

        <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-xl font-normal leading-relaxed">
          Need canteen lunch, library books, or packages delivered between classes? Tap peers on your route to bring it right to your door.
        </p>

        {/* Action CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => navigate('/auth')}
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <span>Request an Errand</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/auth')}
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-750 flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <Bike className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Deliver & Earn Money</span>
          </button>
        </div>

        {/* Animated Delivery Visual Box */}
        <div className="mt-10 w-full max-w-md p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-left">
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-bold text-slate-900 dark:text-white">Live Route Demo</span>
            </div>
            <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 font-mono">₹40 Bounty</span>
          </div>
          
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="font-semibold text-slate-900 dark:text-white">Cafeteria Block A</span>
            </div>
            <div className="w-0.5 h-4 bg-slate-200 dark:bg-slate-700 ml-1" />
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
              <span className="font-semibold text-slate-900 dark:text-white">Hostel Block 3, Room 204</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span>⏱ ~8 min walking</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">Carrier Nearby (120m)</span>
          </div>
        </div>

        {/* Quick Stats Strip */}
        <div className="mt-12 grid grid-cols-3 gap-3 w-full max-w-xl">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <p className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">2 min</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Avg Match Time</p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">₹30-100</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Per Delivery</p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <p className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">100%</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Peer Verified</p>
          </div>
        </div>

        {/* How It Works Header */}
        <div className="mt-20 text-center w-full">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Simple 4-Step Flow
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white mt-1">
            How Zipp works on your campus
          </h2>
        </div>

        {/* How It Works - Swipeable Cards on mobile, 4-col on desktop */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full">
          {steps.map((st) => {
            const Icon = st.icon;
            return (
              <div
                key={st.num}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-left shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-black text-slate-400 dark:text-slate-600 font-mono">
                      {st.num}
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1.5">
                    {st.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                    {st.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Final CTA Banner */}
        <div className="mt-16 w-full p-8 rounded-3xl bg-blue-600 text-white text-center shadow-xl shadow-blue-600/20">
          <h2 className="text-2xl font-black">Ready to get items delivered?</h2>
          <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-md mx-auto">
            Join students from your campus saving time and earning pocket money between classes.
          </p>
          <button
            onClick={() => navigate('/auth')}
            className="mt-6 px-8 py-3.5 rounded-2xl bg-white text-blue-600 font-extrabold text-sm hover:bg-blue-50 active:scale-95 transition-all shadow-lg"
          >
            Create Your Account Now
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between px-6 max-w-4xl mx-auto gap-2">
        <p>© 2026 Zipp Campus Delivery. Built for college peer networks.</p>
        <button
          onClick={() => navigate('/admin')}
          className="text-[11px] font-semibold text-slate-400 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
        >
          Administrator Portal
        </button>
      </footer>
    </div>
  );
}
