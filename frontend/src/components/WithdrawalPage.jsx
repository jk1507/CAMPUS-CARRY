import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, ArrowRight, Clock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import client from '../api/client.js';
import useAuthStore from '../store/authStore.js';
import toast from 'react-hot-toast';

export default function WithdrawalPage() {
  const { user } = useAuthStore();
  const [withdrawals, setWithdrawals] = useState([]);
  const [form, setForm] = useState({ amount: '', upi_id: '' });
  const [submitting, setSubmitting] = useState(false);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    setRefreshing(true);
    try {
      const res = await client.get('/withdrawals');
      const list = res.data.data || [];
      setWithdrawals(list);
      const pending = list
        .filter((w) => w.status === 'pending')
        .reduce((sum, w) => sum + Number(w.amount), 0);
      setPendingAmount(pending);
    } catch {
      toast.error('Failed to load withdrawals');
    } finally {
      setRefreshing(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) < 50) {
      return toast.error('Minimum withdrawal is ₹50');
    }
    if (!form.upi_id || !form.upi_id.includes('@')) {
      return toast.error('Please enter a valid UPI ID (e.g. name@upi)');
    }

    setSubmitting(true);
    try {
      const res = await client.post('/withdrawals', {
        amount: Number(form.amount),
        upi_id: form.upi_id.trim(),
      });
      if (res.data.success) {
        toast.success('Withdrawal request submitted! Payout processed in 2-4 hours.');
        setForm({ amount: '', upi_id: '' });
        fetchWithdrawals();
      } else {
        toast.error(res.data.error || 'Failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Withdrawal failed');
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (st) => {
    switch (st) {
      case 'processed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3" /> Processed
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
            <AlertCircle className="w-3 h-3" /> Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 pb-12 max-w-lg mx-auto">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white">
            Instant UPI Withdrawal
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Transfer delivery tips directly to Google Pay, PhonePe, or Paytm.
          </p>
        </div>

        <button
          onClick={fetchWithdrawals}
          disabled={refreshing}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Withdrawal Form Card */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm">
        <form onSubmit={handleWithdraw} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Amount to Withdraw (₹)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-slate-400 font-mono">
                ₹
              </span>
              <input
                type="number"
                min="50"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="100"
                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-base font-bold text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-600"
              />
            </div>

            {/* Quick Chips */}
            <div className="flex items-center gap-1.5 mt-2">
              {['100', '250', '500', '1000'].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setForm({ ...form, amount: amt })}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300 font-mono"
                >
                  ₹{amt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Your UPI ID (VPA)
            </label>
            <input
              type="text"
              value={form.upi_id}
              onChange={(e) => setForm({ ...form, upi_id: e.target.value })}
              placeholder="e.g. mobile@paytm or name@okaxis"
              className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {submitting ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                <span>Confirm Instant Payout</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* History Card */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Payout History ({withdrawals.length})
        </h3>

        {withdrawals.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No withdrawal transactions yet.
          </div>
        ) : (
          <div className="space-y-2">
            {withdrawals.map((w) => (
              <div
                key={w.id}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-black text-slate-900 dark:text-white font-mono text-sm">
                      ₹{w.amount}
                    </span>
                    {statusBadge(w.status)}
                  </div>
                  <span className="text-[11px] text-slate-400">UPI: {w.upi_id}</span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {new Date(w.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
