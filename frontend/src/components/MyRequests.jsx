import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import useRequestStore from '../store/requestStore.js';
import RequestCard from './RequestCard.jsx';
import RequestDetailModal from './RequestDetailModal.jsx';

export default function MyRequests() {
  const { myRequests, fetchMine } = useRequestStore();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchMine();
  }, []);

  const filteredRequests = myRequests.filter((req) => {
    if (statusFilter === 'all') return true;
    return req.status === statusFilter;
  });

  const activeCount = myRequests.filter((r) => ['open', 'accepted', 'in_progress'].includes(r.status)).length;
  const totalSpent = myRequests
    .filter((r) => r.status === 'delivered')
    .reduce((sum, r) => sum + Number(r.reward || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Total Created</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-white font-['Syne']">{myRequests.length}</span>
            <span className="text-xs text-purple-400 font-medium">Orders</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Active Deliveries</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-400 font-['Syne']">{activeCount}</span>
            <span className="text-xs text-emerald-500/80 font-medium">In Transit / Open</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Bounties Paid</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-purple-300 font-['Syne']">₹{totalSpent}</span>
            <span className="text-xs text-purple-400/80 font-medium">Completed</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white font-['Syne'] tracking-tight">
            My Delivery Orders
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track current deliveries, chat with carriers, and check status updates.
          </p>
        </div>

        <button
          onClick={() => navigate('/app/new')}
          className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 flex items-center gap-2 self-start transition-all"
        >
          <span>＋</span> New Request
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All Orders' },
          { id: 'open', label: '⏳ Waiting for Carrier' },
          { id: 'in_progress', label: '🛵 On the Way' },
          { id: 'delivered', label: '✅ Delivered' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setStatusFilter(f.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === f.id
                ? 'bg-purple-600/20 text-purple-400 border border-purple-500/40'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20 px-4 bg-slate-900/30 border border-dashed border-slate-800 rounded-3xl"
        >
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-purple-900/20 text-purple-400 border border-purple-500/20 flex items-center justify-center text-3xl shadow-lg">
            📦
          </div>
          <h3 className="text-base font-bold text-white mb-1">No orders found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">
            Need lunch, groceries, or notes delivered across campus? Post an errand in seconds.
          </p>
          <button
            onClick={() => navigate('/app/new')}
            className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/30 transition-all"
          >
            Post Your First Request
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredRequests.map((req, i) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <RequestCard request={req} onView={setSelected} />
              {req.carrier_name && req.status !== 'cancelled' && (
                <div className="mt-1 mx-2 p-3 rounded-xl bg-slate-900/90 border border-blue-500/20 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">🛵</span>
                    <span className="font-semibold text-slate-200">{req.carrier_name}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold uppercase">
                      Carrier Assigned
                    </span>
                  </div>
                  <button
                    onClick={() => setSelected(req)}
                    className="text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 transition-all"
                  >
                    Open Live Track & Chat →
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selected && (
          <RequestDetailModal
            request={selected}
            onClose={() => setSelected(null)}
            onRefresh={fetchMine}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
