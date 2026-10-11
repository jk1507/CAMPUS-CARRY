import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, TrendingUp, DollarSign, Award } from 'lucide-react';
import client from '../api/client.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function StatCard({ label, value, sub, colorClass = 'text-blue-600 dark:text-blue-400' }) {
  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
        {label}
      </p>
      <p className={`text-2xl font-black font-mono ${colorClass}`}>{value}</p>
      {sub && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function BarChart({ data, valueKey, labelKey, colorClass = 'bg-emerald-600', prefix = '₹' }) {
  const max = Math.max(...data.map((d) => Number(d[valueKey]) || 0), 1);
  return (
    <div className="flex items-end gap-1.5 h-28 pt-4">
      {data.map((d, i) => {
        const h = Math.max(8, ((Number(d[valueKey]) || 0) / max) * 100);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
            <div
              className={`w-full rounded-t-lg ${colorClass} transition-all`}
              style={{ height: `${h}%` }}
              title={`${d[labelKey]}: ${prefix}${d[valueKey]}`}
            />
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate w-full text-center">
              {d[labelKey]?.slice(0, 3)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function Earnings() {
  const [data, setData] = useState(null);

  useEffect(() => {
    client
      .get('/dashboard/carrier')
      .then((r) => setData(r.data.data))
      .catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <span className="inline-block w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const breakdown = (data.monthlyBreakdown || []).map((m) => ({
    ...m,
    label: MONTHS[parseInt(m.month?.split('-')[1]) - 1] || m.month,
  }));
  const avg = Number(data.avgRating || 0).toFixed(1);

  return (
    <div className="space-y-4 pb-12">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white">
          Earnings & Reviews
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Your delivery income, trip milestones, and campus rating.
        </p>
      </div>

      {/* Hero Rating Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 shadow-sm flex items-center gap-4">
        <div className="text-4xl sm:text-5xl font-black text-amber-500 font-mono">
          {avg}
        </div>
        <div>
          <div className="flex items-center gap-1 mb-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-4 h-4 ${
                  s <= Math.round(Number(avg))
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-slate-300 dark:text-slate-700'
                }`}
              />
            ))}
          </div>
          <p className="text-xs font-bold text-slate-900 dark:text-white">Overall Carrier Rating</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Based on student delivery feedback
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="This Week"
          value={`₹${data.weekly?.earned || 0}`}
          sub={`${data.weekly?.count || 0} deliveries`}
          colorClass="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          label="This Month"
          value={`₹${data.monthly?.earned || 0}`}
          sub={`${data.monthly?.count || 0} deliveries`}
          colorClass="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          label="All Time"
          value={`₹${data.yearly?.earned || 0}`}
          sub={`${data.yearly?.count || 0} deliveries`}
          colorClass="text-purple-600 dark:text-purple-400"
        />
        <StatCard
          label="Available"
          value={`₹${data.availableBalance || data.yearly?.earned || 0}`}
          sub="Ready to withdraw"
          colorClass="text-amber-600 dark:text-amber-400"
        />
      </div>

      {/* Monthly Chart Card */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            Monthly Payout History
          </span>
          <span className="text-[11px] text-slate-400">Year to Date</span>
        </div>

        {breakdown.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-400">
            No delivery payout history recorded yet.
          </div>
        ) : (
          <BarChart data={breakdown} valueKey="earned" labelKey="label" colorClass="bg-emerald-600" />
        )}
      </div>
    </div>
  );
}
