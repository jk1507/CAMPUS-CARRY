import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Package, 
  Plus, 
  MapPin, 
  Compass, 
  TrendingUp, 
  Menu,
  Bike
} from 'lucide-react';
import useAuthStore from '../store/authStore.js';

export default function BottomNav({ onOpenMore }) {
  const { activeRole } = useAuthStore();
  const isCarrier = activeRole === 'carrier';

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 pb-safe-bottom"
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {/* Tab 1 */}
        <NavLink
          to="/app"
          end
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-semibold transition-colors ${
              isActive 
                ? 'text-blue-600 dark:text-blue-400 font-bold' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`
          }
        >
          {isCarrier ? <Compass className="w-5 h-5 mb-0.5" /> : <Package className="w-5 h-5 mb-0.5" />}
          <span>{isCarrier ? 'Feed' : 'Orders'}</span>
        </NavLink>

        {/* Tab 2 */}
        {isCarrier ? (
          <NavLink
            to="/app/carrying"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-semibold transition-colors ${
                isActive 
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`
            }
          >
            <Bike className="w-5 h-5 mb-0.5" />
            <span>Missions</span>
          </NavLink>
        ) : (
          <NavLink
            to="/app/map"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-semibold transition-colors ${
                isActive 
                  ? 'text-blue-600 dark:text-blue-400 font-bold' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`
            }
          >
            <MapPin className="w-5 h-5 mb-0.5" />
            <span>Radar</span>
          </NavLink>
        )}

        {/* Center Prominent Action (For Requester: Post New, For Carrier: Radar Map) */}
        {!isCarrier ? (
          <NavLink
            to="/app/new"
            aria-label="New Delivery Request"
            className="flex flex-col items-center justify-center px-3"
          >
            <div className="w-12 h-12 -mt-5 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/35 border-2 border-white dark:border-[#111827] active:scale-95 transition-transform">
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </div>
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-0.5">Post</span>
          </NavLink>
        ) : (
          <NavLink
            to="/app/map"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-semibold transition-colors ${
                isActive 
                  ? 'text-blue-600 dark:text-blue-400 font-bold' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`
            }
          >
            <MapPin className="w-5 h-5 mb-0.5" />
            <span>Radar</span>
          </NavLink>
        )}

        {/* Tab 4 */}
        <NavLink
          to={isCarrier ? "/app/earnings" : "/app/spending"}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-semibold transition-colors ${
              isActive 
                ? 'text-blue-600 dark:text-blue-400 font-bold' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`
          }
        >
          <TrendingUp className="w-5 h-5 mb-0.5" />
          <span>{isCarrier ? 'Earnings' : 'Stats'}</span>
        </NavLink>

        {/* Tab 5: More menu sheet trigger */}
        <button
          type="button"
          onClick={onOpenMore}
          aria-label="Open More Menu"
          className="flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span>More</span>
        </button>
      </div>
    </nav>
  );
}
