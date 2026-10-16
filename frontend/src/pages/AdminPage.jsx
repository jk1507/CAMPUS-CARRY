import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  Users,
  Package,
  AlertTriangle,
  CreditCard,
  Bell,
  Search,
  Trash2,
  Ban,
  CheckCircle,
  XCircle,
  LogOut,
  RefreshCw,
  Send,
  Eye,
  Lock,
  ChevronRight,
  TrendingUp,
  Clock,
  MapPin,
  Filter
} from 'lucide-react';
import client from '../api/client.js';
import toast from 'react-hot-toast';
import ThemeToggle from '../components/common/ThemeToggle.jsx';

export default function AdminPage() {
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('cc_admin_token') || '');
  const [adminUser, setAdminUser] = useState(() => localStorage.getItem('cc_admin_user') || '');

  // Login form state
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Active admin tab
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'complaints' | 'errands' | 'withdrawals' | 'notifications'

  // Data states
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [errands, setErrands] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Search & filter states
  const [userSearch, setUserSearch] = useState('');
  const [errandFilter, setErrandFilter] = useState('');
  const [reportFilter, setReportFilter] = useState('');

  // Notification modal state
  const [notifTargetUser, setNotifTargetUser] = useState(null); // null means broadcast / custom
  const [notifForm, setNotifForm] = useState({ title: '', body: '', campus: 'all', userId: '' });
  const [isSendingNotif, setIsSendingNotif] = useState(false);

  // Helper for admin request config
  const getAdminConfig = () => ({
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  // Handle Admin Login
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginForm.username || !loginForm.password) {
      return toast.error('Please enter Administrator credentials');
    }
    setIsLoggingIn(true);
    try {
      const res = await client.post('/admin/login', loginForm);
      if (res.data.success) {
        const { token, username } = res.data.data;
        setAdminToken(token);
        setAdminUser(username);
        localStorage.setItem('cc_admin_token', token);
        localStorage.setItem('cc_admin_user', username);
        toast.success('Administrator Access Granted 🛡️');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid Administrator credentials');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setAdminToken('');
    setAdminUser('');
    localStorage.removeItem('cc_admin_token');
    localStorage.removeItem('cc_admin_user');
    toast.success('Logged out from Admin Console');
  };

  // Fetch Dashboard Stats
  const fetchStats = async () => {
    try {
      const res = await client.get('/admin/stats', getAdminConfig());
      if (res.data.success) setStats(res.data.data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) handleLogout();
    }
  };

  // Fetch Users
  const fetchUsers = async () => {
    setIsLoadingData(true);
    try {
      const res = await client.get(`/admin/users?search=${encodeURIComponent(userSearch)}`, getAdminConfig());
      if (res.data.success) setUsers(res.data.data);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setIsLoadingData(false);
    }
  };

  // Fetch Reports / Complaints
  const fetchReports = async () => {
    setIsLoadingData(true);
    try {
      const res = await client.get('/admin/reports', getAdminConfig());
      if (res.data.success) setReports(res.data.data);
    } catch (err) {
      toast.error('Failed to load complaints');
    } finally {
      setIsLoadingData(false);
    }
  };

  // Fetch Errands
  const fetchErrands = async () => {
    setIsLoadingData(true);
    try {
      const res = await client.get(`/admin/errands?status=${encodeURIComponent(errandFilter)}`, getAdminConfig());
      if (res.data.success) setErrands(res.data.data);
    } catch (err) {
      toast.error('Failed to load errands');
    } finally {
      setIsLoadingData(false);
    }
  };

  // Fetch Withdrawals
  const fetchWithdrawals = async () => {
    setIsLoadingData(true);
    try {
      const res = await client.get('/admin/withdrawals', getAdminConfig());
      if (res.data.success) setWithdrawals(res.data.data);
    } catch (err) {
      toast.error('Failed to load withdrawals');
    } finally {
      setIsLoadingData(false);
    }
  };

  // Initial and reactive data loader
  useEffect(() => {
    if (!adminToken) return;
    fetchStats();
    if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'complaints') fetchReports();
    else if (activeTab === 'errands') fetchErrands();
    else if (activeTab === 'withdrawals') fetchWithdrawals();
  }, [adminToken, activeTab]);

  // Ban / Unban user
  const handleToggleBan = async (user) => {
    const action = user.is_banned ? 'unban' : 'ban';
    if (!window.confirm(`Are you sure you want to ${action} ${user.name}?`)) return;
    try {
      const res = await client.patch(`/admin/users/${user.id}/ban`, { is_banned: !user.is_banned }, getAdminConfig());
      if (res.data.success) {
        toast.success(`User ${user.name} ${action}ned successfully`);
        setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, is_banned: !user.is_banned } : u)));
      }
    } catch {
      toast.error('Failed to update ban status');
    }
  };

  // Delete user
  const handleDeleteUser = async (user) => {
    if (!window.confirm(`⚠️ PERMANENT ACTION: Delete user ${user.name} and all related activity?`)) return;
    try {
      const res = await client.delete(`/admin/users/${user.id}`, getAdminConfig());
      if (res.data.success) {
        toast.success(`User ${user.name} removed from database`);
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
        fetchStats();
      }
    } catch {
      toast.error('Failed to delete user');
    }
  };

  // Update Report Status
  const handleUpdateReportStatus = async (reportId, status) => {
    try {
      const res = await client.patch(`/admin/reports/${reportId}`, { status }, getAdminConfig());
      if (res.data.success) {
        toast.success(`Complaint status set to ${status}`);
        setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status } : r)));
        fetchStats();
      }
    } catch {
      toast.error('Failed to update complaint status');
    }
  };

  // Force cancel / complete errand
  const handleUpdateErrandStatus = async (errandId, status) => {
    if (!window.confirm(`Are you sure you want to set errand #${errandId} status to "${status}"?`)) return;
    try {
      const res = await client.patch(`/admin/errands/${errandId}/status`, { status }, getAdminConfig());
      if (res.data.success) {
        toast.success(`Errand #${errandId} updated to ${status}`);
        setErrands((prev) => prev.map((e) => (e.id === errandId ? { ...e, status } : e)));
        fetchStats();
      }
    } catch {
      toast.error('Failed to update errand');
    }
  };

  // Update Withdrawal status
  const handleUpdateWithdrawal = async (withdrawalId, status) => {
    try {
      const res = await client.patch(`/admin/withdrawals/${withdrawalId}`, { status }, getAdminConfig());
      if (res.data.success) {
        toast.success(`Payout #${withdrawalId} marked as ${status}`);
        setWithdrawals((prev) => prev.map((w) => (w.id === withdrawalId ? { ...w, status } : w)));
        fetchStats();
      }
    } catch {
      toast.error('Failed to update withdrawal status');
    }
  };

  // Send Notification Submit
  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!notifForm.title.trim() || !notifForm.body.trim()) {
      return toast.error('Notification title and message body required');
    }
    setIsSendingNotif(true);
    try {
      const payload = {
        title: notifForm.title.trim(),
        body: notifForm.body.trim(),
        user_id: notifForm.userId || (notifTargetUser ? notifTargetUser.id : null),
        campus: notifForm.campus === 'all' ? null : notifForm.campus
      };
      const res = await client.post('/admin/notify', payload, getAdminConfig());
      if (res.data.success) {
        toast.success('Notification delivered successfully 🚀');
        setNotifForm({ title: '', body: '', campus: 'all', userId: '' });
        setNotifTargetUser(null);
      }
    } catch {
      toast.error('Failed to dispatch notification');
    } finally {
      setIsSendingNotif(false);
    }
  };

  // ----------------------------------------------------
  // VIEW: Admin Login Screen
  // ----------------------------------------------------
  if (!adminToken) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative selection:bg-rose-600 selection:text-white">
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-rose-950/20"
        >
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-rose-600/30 mb-4">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">Central Control Console</h1>
            <p className="text-xs text-slate-400 mt-1.5 font-medium">
              Restricted Area • Master Administrator Access
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Administrator ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="adminstrator"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Master Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white transition-colors"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 mt-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-rose-600/30 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              {isLoggingIn ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Verify Administrator</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <a
              href="/"
              className="text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors"
            >
              ← Return to CampusCarry App
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  // ----------------------------------------------------
  // VIEW: Admin Main Dashboard
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-600/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-base tracking-tight text-white">CampusCarry Admin</span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                MASTER ROOT
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Authenticated as: <span className="text-white font-semibold">{adminUser}</span></p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => {
              fetchStats();
              if (activeTab === 'users') fetchUsers();
              if (activeTab === 'complaints') fetchReports();
              if (activeTab === 'errands') fetchErrands();
              if (activeTab === 'withdrawals') fetchWithdrawals();
              toast.success('Synced latest records');
            }}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/10 text-rose-400 border border-rose-600/20 hover:bg-rose-600 hover:text-white transition-all text-xs font-bold"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit Admin</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto p-4 sm:p-6 gap-6">
        {/* Left Navigation Sidebar */}
        <aside className="w-64 shrink-0 hidden md:flex flex-col gap-1.5">
          {[
            { id: 'overview', label: 'Overview & Stats', icon: TrendingUp },
            { id: 'users', label: 'User Directory', icon: Users, badge: stats?.total_users },
            { id: 'complaints', label: 'Complaints & Reports', icon: AlertTriangle, badge: stats?.pending_reports, badgeColor: 'bg-rose-500 text-white' },
            { id: 'errands', label: 'Live Errands', icon: Package, badge: stats?.active_errands },
            { id: 'withdrawals', label: 'Payout Requests', icon: CreditCard, badge: stats?.pending_withdrawals, badgeColor: 'bg-amber-500 text-white' },
            { id: 'notifications', label: 'Notify & Alert', icon: Bell }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      item.badgeColor || (isActive ? 'bg-rose-800 text-rose-100' : 'bg-slate-800 text-slate-300')
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">
          {/* Mobile Tab Switcher */}
          <div className="flex md:hidden overflow-x-auto gap-2 pb-3 mb-3 border-b border-slate-800">
            {['overview', 'users', 'complaints', 'errands', 'withdrawals', 'notifications'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 capitalize ${
                  activeTab === tab ? 'bg-rose-600 text-white' : 'bg-slate-900 text-slate-400'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* ------------------------------------------- */}
          {/* TAB 1: OVERVIEW & STATS */}
          {/* ------------------------------------------- */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-white">System Health & Metrics</h2>
                <p className="text-xs text-slate-400">Real-time telemetry across registered campuses</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Total Users', val: stats?.total_users || 0, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                  { label: 'Total Errands', val: stats?.total_requests || 0, icon: Package, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                  { label: 'Active Errands', val: stats?.active_errands || 0, icon: Clock, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                  { label: 'Deliveries Finished', val: stats?.completed_errands || 0, icon: CheckCircle, color: 'text-teal-400', bg: 'bg-teal-500/10' },
                  { label: 'Pending Complaints', val: stats?.pending_reports || 0, icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/10' },
                  { label: 'Pending Payouts', val: stats?.pending_withdrawals || 0, icon: CreditCard, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                ].map((s, idx) => {
                  const Icon = s.icon;
                  return (
                    <div key={idx} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl ${s.bg} ${s.color} flex items-center justify-center shrink-0`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-2xl font-black text-white">{s.val}</div>
                        <div className="text-xs font-semibold text-slate-400">{s.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Actions */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
                <h3 className="text-sm font-bold text-white mb-4">Master Quick Actions</h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setActiveTab('users')}
                    className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white flex items-center gap-2 transition-colors"
                  >
                    <Users className="w-4 h-4 text-blue-400" />
                    <span>Manage Inactive / Banned Users</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('complaints')}
                    className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white flex items-center gap-2 transition-colors"
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Review Unresolved Complaints</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('notifications')}
                    className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white flex items-center gap-2 transition-colors shadow-lg shadow-rose-600/25"
                  >
                    <Bell className="w-4 h-4" />
                    <span>Broadcast System Announcement</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------- */}
          {/* TAB 2: USER DIRECTORY & MANAGEMENT */}
          {/* ------------------------------------------- */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-white">Student & Carrier Management</h2>
                  <p className="text-xs text-slate-400">Search, notify, ban, or permanently purge users</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search name, email, phone..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                      className="pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 w-56"
                    />
                  </div>
                  <button
                    onClick={fetchUsers}
                    className="px-3 py-2 rounded-xl bg-slate-800 text-xs font-bold hover:bg-slate-700 text-slate-200"
                  >
                    Search
                  </button>
                </div>
              </div>

              {isLoadingData ? (
                <div className="p-12 text-center text-xs text-slate-400">Loading student directory...</div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-800/60 text-slate-400 font-bold uppercase tracking-wider">
                        <tr>
                          <th className="p-3.5 pl-5">User</th>
                          <th className="p-3.5">Campus</th>
                          <th className="p-3.5">Role</th>
                          <th className="p-3.5">Phone</th>
                          <th className="p-3.5">Stats</th>
                          <th className="p-3.5">Status</th>
                          <th className="p-3.5 text-right pr-5">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {users.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="p-3.5 pl-5">
                              <div className="font-bold text-white">{u.name}</div>
                              <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                            </td>
                            <td className="p-3.5 text-slate-300 font-medium">{u.campus}</td>
                            <td className="p-3.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  u.role === 'carrier'
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                }`}
                              >
                                {u.role}
                              </span>
                            </td>
                            <td className="p-3.5 text-slate-400">{u.phone || '—'}</td>
                            <td className="p-3.5 text-slate-300">
                              <div>Req: <span className="font-bold text-white">{u.request_count}</span></div>
                              <div>Delivered: <span className="font-bold text-white">{u.deliveries_count}</span></div>
                            </td>
                            <td className="p-3.5">
                              {u.is_banned ? (
                                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-bold text-[10px] border border-rose-500/30">
                                  BANNED
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-[10px]">
                                  Active
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 text-right pr-5">
                              <div className="inline-flex items-center gap-1.5">
                                {/* Notify User Button */}
                                <button
                                  onClick={() => {
                                    setNotifTargetUser(u);
                                    setNotifForm((prev) => ({ ...prev, userId: u.id, title: `Notice for ${u.name}` }));
                                    setActiveTab('notifications');
                                  }}
                                  className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500 hover:text-white text-blue-400 transition-colors"
                                  title="Send Direct Notification"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                </button>

                                {/* Ban / Unban Button */}
                                <button
                                  onClick={() => handleToggleBan(u)}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    u.is_banned
                                      ? 'bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-400'
                                      : 'bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-400'
                                  }`}
                                  title={u.is_banned ? 'Unban User' : 'Ban User'}
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                </button>

                                {/* Permanent Delete Button */}
                                <button
                                  onClick={() => handleDeleteUser(u)}
                                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-400 transition-colors"
                                  title="Purge / Remove Inactive User"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {users.length === 0 && (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-slate-500">
                              No users found matching query.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ------------------------------------------- */}
          {/* TAB 3: COMPLAINTS & REPORTS */}
          {/* ------------------------------------------- */}
          {activeTab === 'complaints' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-black text-white">Student Complaints & Reports</h2>
                <p className="text-xs text-slate-400">Resolve disputes between requesters and carriers</p>
              </div>

              {isLoadingData ? (
                <div className="p-12 text-center text-xs text-slate-400">Loading complaints...</div>
              ) : (
                <div className="space-y-3">
                  {reports.map((rep) => (
                    <div
                      key={rep.id}
                      className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              rep.status === 'pending'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : rep.status === 'reviewed'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {rep.status}
                          </span>
                          <span className="text-xs text-slate-500">
                            Report #{rep.id} • {new Date(rep.created_at).toLocaleString()}
                          </span>
                        </div>

                        <div className="text-sm font-bold text-white">
                          Reason: <span className="text-rose-300 font-medium">"{rep.reason}"</span>
                        </div>

                        <div className="text-xs text-slate-400 flex flex-wrap gap-4">
                          <div>
                            Reporter: <span className="text-white font-semibold">{rep.reporter_name}</span> ({rep.reporter_email})
                          </div>
                          <div>
                            Reported: <span className="text-rose-400 font-semibold">{rep.reported_name}</span> ({rep.reported_email})
                          </div>
                          {rep.request_title && (
                            <div>
                              Errand: <span className="text-white font-medium">{rep.request_title}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {rep.status !== 'reviewed' && (
                          <button
                            onClick={() => handleUpdateReportStatus(rep.id, 'reviewed')}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 hover:bg-emerald-600 hover:text-white text-xs font-bold transition-all"
                          >
                            Resolve & Dismiss
                          </button>
                        )}
                        {rep.status !== 'dismissed' && (
                          <button
                            onClick={() => handleUpdateReportStatus(rep.id, 'dismissed')}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700 text-xs font-bold transition-all"
                          >
                            Ignore
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setNotifForm({
                              title: 'CampusCarry Dispute Notice',
                              body: `Regarding complaint #${rep.id}: Please adhere to community guidelines.`,
                              userId: rep.reported_user_id,
                              campus: 'all'
                            });
                            setActiveTab('notifications');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-600/30 hover:bg-rose-600 hover:text-white text-xs font-bold transition-all"
                        >
                          Warn User
                        </button>
                      </div>
                    </div>
                  ))}
                  {reports.length === 0 && (
                    <div className="p-12 text-center text-slate-500 rounded-3xl bg-slate-900 border border-slate-800 text-xs">
                      No complaints currently filed.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ------------------------------------------- */}
          {/* TAB 4: LIVE ERRANDS CONTROL */}
          {/* ------------------------------------------- */}
          {activeTab === 'errands' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-white">Live Errands & Status Override</h2>
                  <p className="text-xs text-slate-400">Cancel stuck errands or force mark deliveries</p>
                </div>
                <select
                  value={errandFilter}
                  onChange={(e) => {
                    setErrandFilter(e.target.value);
                  }}
                  className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="accepted">Accepted</option>
                  <option value="in_progress">In Progress</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {isLoadingData ? (
                <div className="p-12 text-center text-xs text-slate-400">Loading errands...</div>
              ) : (
                <div className="space-y-3">
                  {errands.map((errand) => (
                    <div
                      key={errand.id}
                      className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              errand.status === 'open'
                                ? 'bg-blue-500/20 text-blue-400'
                                : errand.status === 'delivered'
                                ? 'bg-teal-500/20 text-teal-400'
                                : errand.status === 'cancelled'
                                ? 'bg-slate-800 text-slate-500'
                                : 'bg-amber-500/20 text-amber-400'
                            }`}
                          >
                            {errand.status}
                          </span>
                          <span className="text-xs font-bold text-white">#{errand.id} • {errand.title}</span>
                          <span className="text-xs text-emerald-400 font-extrabold">₹{errand.reward}</span>
                        </div>

                        <div className="text-xs text-slate-400 flex flex-wrap gap-4">
                          <div>Campus: <span className="text-white font-medium">{errand.campus}</span></div>
                          <div>Requester: <span className="text-white font-medium">{errand.requester_name}</span></div>
                          <div>Carrier: <span className="text-white font-medium">{errand.carrier_name || 'None'}</span></div>
                          <div>Pickup: <span className="text-slate-300 font-medium">{errand.pickup_location}</span></div>
                          <div>Drop: <span className="text-slate-300 font-medium">{errand.dropoff_location}</span></div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {errand.status !== 'cancelled' && errand.status !== 'delivered' && (
                          <>
                            <button
                              onClick={() => handleUpdateErrandStatus(errand.id, 'delivered')}
                              className="px-3 py-1.5 rounded-xl bg-teal-600/20 text-teal-400 border border-teal-600/30 hover:bg-teal-600 hover:text-white text-xs font-bold transition-all"
                            >
                              Force Complete
                            </button>
                            <button
                              onClick={() => handleUpdateErrandStatus(errand.id, 'cancelled')}
                              className="px-3 py-1.5 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-600/30 hover:bg-rose-600 hover:text-white text-xs font-bold transition-all"
                            >
                              Cancel Errand
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  {errands.length === 0 && (
                    <div className="p-12 text-center text-slate-500 rounded-3xl bg-slate-900 border border-slate-800 text-xs">
                      No errands found.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ------------------------------------------- */}
          {/* TAB 5: PAYOUTS & WITHDRAWALS */}
          {/* ------------------------------------------- */}
          {activeTab === 'withdrawals' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-black text-white">Carrier Earnings Payouts</h2>
                <p className="text-xs text-slate-400">Approve or update carrier UPI withdrawals</p>
              </div>

              {isLoadingData ? (
                <div className="p-12 text-center text-xs text-slate-400">Loading payout records...</div>
              ) : (
                <div className="space-y-3">
                  {withdrawals.map((w) => (
                    <div
                      key={w.id}
                      className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              w.status === 'processed'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : w.status === 'failed'
                                ? 'bg-rose-500/20 text-rose-400'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {w.status}
                          </span>
                          <span className="text-base font-black text-emerald-400">₹{w.amount}</span>
                          <span className="text-xs text-slate-400">to UPI: <span className="font-mono text-white">{w.upi_id}</span></span>
                        </div>
                        <div className="text-xs text-slate-400">
                          Carrier: <span className="text-white font-semibold">{w.user_name}</span> ({w.user_email}) • {w.campus}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {w.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateWithdrawal(w.id, 'processed')}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
                            >
                              Mark Processed
                            </button>
                            <button
                              onClick={() => handleUpdateWithdrawal(w.id, 'failed')}
                              className="px-3 py-1.5 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-600/30 hover:bg-rose-600 hover:text-white text-xs font-bold transition-all"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  {withdrawals.length === 0 && (
                    <div className="p-12 text-center text-slate-500 rounded-3xl bg-slate-900 border border-slate-800 text-xs">
                      No withdrawal records.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ------------------------------------------- */}
          {/* TAB 6: NOTIFY & BROADCAST */}
          {/* ------------------------------------------- */}
          {activeTab === 'notifications' && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h2 className="text-xl font-black text-white">Broadcast Alerts & Direct Warnings</h2>
                <p className="text-xs text-slate-400">Dispatch live push announcements and in-app toasts</p>
              </div>

              {notifTargetUser && (
                <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
                  <div className="text-xs">
                    Targeting specific user: <span className="font-bold text-white">{notifTargetUser.name}</span> ({notifTargetUser.email})
                  </div>
                  <button
                    onClick={() => {
                      setNotifTargetUser(null);
                      setNotifForm((prev) => ({ ...prev, userId: '' }));
                    }}
                    className="text-xs font-bold text-blue-400 hover:text-white"
                  >
                    Clear Target
                  </button>
                </div>
              )}

              <form onSubmit={handleSendNotification} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Scope / Audience
                  </label>
                  <select
                    value={notifTargetUser ? 'custom' : notifForm.campus}
                    disabled={!!notifTargetUser}
                    onChange={(e) => setNotifForm({ ...notifForm, campus: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-2xl text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="all">Broadcast to All Students & Campuses</option>
                    <option value="custom" disabled={!notifTargetUser}>Specific Individual User</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Alert Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Campus Guidelines Notice / System Maintenance"
                    value={notifForm.title}
                    onChange={(e) => setNotifForm({ ...notifForm, title: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Message Body
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Write detailed instructions or alert message to be dispatched..."
                    value={notifForm.body}
                    onChange={(e) => setNotifForm({ ...notifForm, body: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSendingNotif}
                  className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-rose-600/30 active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  {isSendingNotif ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Dispatch Alert Now</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
