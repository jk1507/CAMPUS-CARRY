import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  RefreshCw, 
  Flame, 
  Clock, 
  Inbox, 
  MapPin,
  Bike
} from 'lucide-react';
import useRequestStore from '../store/requestStore.js';
import useAuthStore from '../store/authStore.js';
import RequestCard from './RequestCard.jsx';
import RequestDetailModal from './RequestDetailModal.jsx';
import toast from 'react-hot-toast';

export default function Feed() {
  const { feed, fetchFeed, acceptRequest, isLoading } = useRequestStore();
  const { user, activeRole } = useAuthStore();
  const [selected, setSelected] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all' | 'high_reward' | 'urgent'

  useEffect(() => {
    fetchFeed();
  }, []);

  const handleAccept = async (id) => {
    const r = await acceptRequest(id);
    if (r.success) {
      toast.success('🎉 Delivery Accepted! Check "Missions" tab to navigate and chat.');
    } else {
      toast.error(r.error || 'Failed to accept request');
    }
  };

  const filteredFeed = feed.filter((req) => {
    const matchesSearch =
      req.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      req.pickup_location.toLowerCase().includes(searchFilter.toLowerCase()) ||
      req.dropoff_location.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (req.campus && req.campus.toLowerCase().includes(searchFilter.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedFilter === 'high_reward') {
      return Number(req.reward) >= 50;
    }
    if (selectedFilter === 'urgent') {
      return req.deadline !== null;
    }
    return true;
  });

  return (
    <div className="space-y-4 pb-12">
      {/* Top Campus Radar Strip */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-600/15">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-bold uppercase tracking-wider text-blue-100">
              Live Dispatch Radar
            </span>
          </div>
          <button
            onClick={() => fetchFeed()}
            disabled={isLoading}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
            title="Refresh feed"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <h2 className="text-lg sm:text-xl font-extrabold mt-2">
          Available Deliveries
        </h2>
        <p className="text-blue-100 text-xs mt-0.5">
          Pick up errands along your route and earn cash tips.
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          placeholder="Search items, canteen, blocks..."
          className="w-full bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-sm"
        />
      </div>

      {/* Horizontal Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
        {[
          { id: 'all', label: `All (${feed.length})` },
          { id: 'high_reward', label: 'High Bounty (₹50+)', icon: Flame },
          { id: 'urgent', label: 'Has Deadline', icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                selectedFilter === tab.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Feed List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse"
            />
          ))}
        </div>
      ) : filteredFeed.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Inbox className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            No open deliveries right now
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            {feed.length === 0
              ? 'Check back between lectures when students order food and printouts.'
              : 'Try clearing your search query or switching filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFeed.map((req) => (
            <RequestCard
              key={req.id}
              request={req}
              showAccept={activeRole === 'carrier'}
              onAccept={handleAccept}
              onView={setSelected}
            />
          ))}
        </div>
      )}

      {/* Detailed Modal Bottom Sheet */}
      <AnimatePresence>
        {selected && (
          <RequestDetailModal
            request={selected}
            onClose={() => setSelected(null)}
            onRefresh={() => fetchFeed(user?.campus)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
