import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    fetchFeed(user?.campus);
  }, [user?.campus]);

  const handleAccept = async (id) => {
    const r = await acceptRequest(id);
    if (r.success) {
      toast.success('🎉 Delivery Accepted! Check "My Deliveries" tab to navigate and chat.');
    } else {
      toast.error(r.error || 'Failed to accept request');
    }
  };

  // Filtered requests
  const filteredFeed = feed.filter((req) => {
    const matchesSearch =
      req.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      req.pickup_location.toLowerCase().includes(searchFilter.toLowerCase()) ||
      req.dropoff_location.toLowerCase().includes(searchFilter.toLowerCase());

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
    <div className="space-y-6 pb-12">
      {/* Top Banner / Feed Header */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-900/40 via-purple-900/30 to-slate-900 border border-blue-500/20 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                Live Campus Radar
              </span>
              <span className="text-xs text-slate-400">🏫 {user?.campus || 'Your Campus'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Syne'] tracking-tight">
              Carrier Dispatch Feed
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              Accept requests along your route between classes, pick up items, and earn instant cash rewards!
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchFeed(user?.campus)}
              className="px-4 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-2 transition-all shadow-md"
            >
              <span>🔄</span> Refresh Feed
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-72">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search item, canteen, hostel..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Requests' },
            { id: 'high_reward', label: '🔥 High Reward (₹50+)' },
            { id: 'urgent', label: '⏰ Has Deadline' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedFilter === tab.id
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Feed List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 rounded-2xl bg-slate-900/40 border border-slate-800 animate-pulse"
            />
          ))}
        </div>
      ) : filteredFeed.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16 px-4 bg-slate-900/30 border border-dashed border-slate-800 rounded-3xl"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/60 flex items-center justify-center text-3xl shadow-inner">
            📭
          </div>
          <h3 className="text-base font-bold text-white mb-1">No matching open requests</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {feed.length === 0
              ? 'No one has posted any delivery tasks on your campus yet. Check back soon or tell your peers!'
              : 'Try clearing your search query or switching filters.'}
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredFeed.map((req, i) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <RequestCard
                request={req}
                showAccept={activeRole === 'carrier'}
                onAccept={handleAccept}
                onView={setSelected}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Detailed Modal */}
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
