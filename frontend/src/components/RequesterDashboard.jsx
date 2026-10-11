import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Calendar, CreditCard } from 'lucide-react';
import client from '../api/client.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function MetricCard({ label, value, sub, colorClass }) {
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

function BarChart({ data, valueKey, labelKey, colorClass = 'bg-blue-600', prefix = '₹' }) {
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

export default function RequesterDashboard() {
  const [data, setData] = useState(null);
  const [range, setRange] = useState('all'); // 'week' | 'month' | 'year' | 'all'

  useEffect(() => {
    client
      .get('/dashboard/requester')
      .then((r) => setData(r.data.data))
      .catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <span className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const breakdown = (data.monthlyBreakdown || []).map((m) => ({
    ...m,
    label: MONTHS[parseInt(m.month?.split('-')[1]) - 1] || m.month,
  }));

  return (
    <div className="space-y-4 pb-12">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white">
          Spending Analytics
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Review your campus errand expenditures and monthly trends.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="This Week"
          value={data.weekly?.count || 0}
          sub={`₹${data.weekly?.spent || 0} spent`}
          colorClass="text-blue-600 dark:text-blue-400"
        />
        <MetricCard
          label="This Month"
          value={data.monthly?.count || 0}
          sub={`₹${data.monthly?.spent || 0} spent`}
          colorClass="text-emerald-600 dark:text-emerald-400"
        />
        <MetricCard
          label="This Year"
          value={data.yearly?.count || 0}
          sub={`₹${data.yearly?.spent || 0} spent`}
          colorClass="text-indigo-600 dark:text-indigo-400"
        />
        <MetricCard
          label="Total Paid"
          value={`₹${data.yearly?.spent || 0}`}
          sub="Last 12 months"
          colorClass="text-amber-600 dark:text-amber-400"
        />
      </div>

      {/* Monthly Chart Card */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            Monthly Spending Breakdown
          </span>
          <span className="text-[11px] text-slate-400">Year to Date</span>
        </div>

        {breakdown.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-400">
            No spending records available yet.
          </div>
        ) : (
          <BarChart data={breakdown} valueKey="spent" labelKey="label" colorClass="bg-blue-600" />
        )}
      </div>
    </div>
  );
}
