import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Package, 
  Compass, 
  Bike, 
  MapPin, 
  Trophy, 
  TrendingUp, 
  CreditCard, 
  User, 
  HelpCircle, 
  LogOut,
  ArrowRightLeft
} from 'lucide-react';
import useAuthStore from '../store/authStore.js';
import { disconnectSocket } from '../socket/socket.js';
import Logo from './common/Logo.jsx';

export default function Sidebar() {
  const { user, activeRole, switchRole, logout } = useAuthStore();
  const navigate = useNavigate();
  const isCarrier = activeRole === 'carrier';
  const otherRole = isCarrier ? 'requester' : 'carrier';

  const requesterLinks = [
    { to: '/app', label: 'My Orders', icon: Package, end: true },
    { to: '/app/feed', label: 'Campus Feed', icon: Compass },
    { to: '/app/new', label: 'Post Errand', icon: Package },
    { to: '/app/map', label: 'Campus Radar', icon: MapPin },
    { to: '/app/leaderboard', label: 'Leaderboard', icon: Trophy },
    { to: '/app/spending', label: 'Spending Analytics', icon: TrendingUp },
    { to: '/app/profile', label: 'My Profile', icon: User },
    { to: '/app/help', label: 'Help & Support', icon: HelpCircle },
  ];

  const carrierLinks = [
    { to: '/app', label: 'Dispatch Feed', icon: Compass, end: true },
    { to: '/app/carrying', label: 'My Deliveries', icon: Bike },
    { to: '/app/map', label: 'Campus Radar', icon: MapPin },
    { to: '/app/leaderboard', label: 'Leaderboard', icon: Trophy },
    { to: '/app/earnings', label: 'Earnings Dashboard', icon: TrendingUp },
    { to: '/app/withdraw', label: 'Instant Withdraw', icon: CreditCard },
    { to: '/app/profile', label: 'My Profile', icon: User },
    { to: '/app/help', label: 'Help & Support', icon: HelpCircle },
  ];

  const links = isCarrier ? carrierLinks : requesterLinks;

  const handleLogout = () => {
    disconnectSocket();
    logout();
    navigate('/');
  };

  return (
    <aside className="hidden md:flex flex-col w-64 h-full bg-white dark:bg-[#111827] border-r border-slate-200 dark:border-slate-800 p-4 shrink-0 overflow-y-auto">
      {/* Brand Header */}
      <div className="mb-6 px-2">
        <Logo className="h-8" />
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
          Campus Delivery Network
        </p>
      </div>

      {/* Role Toggle Card */}
      <div className="p-2 mb-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
        <div className="flex items-center justify-between px-2 py-1 mb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Current Mode
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            isCarrier 
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
              : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
          }`}>
            {activeRole}
          </span>
        </div>
        <button
          onClick={() => {
            switchRole(otherRole);
            navigate('/app');
          }}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-650 transition-all"
        >
          <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500" />
          Switch to {otherRole}
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 space-y-1">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Footer Profile */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 mt-4">
        <div className="flex items-center gap-3 px-2 py-1.5 mb-2">
          <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-sm shrink-0 border border-blue-200 dark:border-blue-800">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {user?.name}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {user?.campus}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
