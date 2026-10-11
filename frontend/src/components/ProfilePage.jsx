import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Camera,
  School,
  FileText,
  Star,
  CheckCircle2,
  Sparkles,
  Shield,
  Moon,
  Sun,
  LogOut,
  Save,
  MessageSquare
} from 'lucide-react';
import useAuthStore from '../store/authStore.js';
import client from '../api/client.js';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, fetchMe, logout, theme, setTheme } = useAuthStore();
  const [feedback, setFeedback]         = useState([]);
  const [form, setForm]                 = useState({ name: '', bio: '', campus: '' });
  const [saving, setSaving]             = useState(false);
  const [uploadingAvatar, setUploading] = useState(false);
  const [avatarPreview, setPreview]     = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    fetchMe();
  }, []);

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || '', bio: user.bio || '', campus: user.campus || '' });
      setPreview(user.avatar_url || null);
      if (user.id) {
        client.get(`/feedback/user/${user.id}`).then((r) => setFeedback(r.data.data)).catch(() => {});
      }
    }
  }, [user?.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await client.patch('/users/me', form);
      toast.success('Profile updated successfully!');
      fetchMe();
    } catch {
      toast.error('Update failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast.error('Image must be under 2MB');
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        await client.patch('/users/me', { avatar_url: ev.target.result });
        setPreview(ev.target.result);
        fetchMe();
        toast.success('Profile photo updated! ✨');
      } catch {
        toast.error('Failed to upload photo');
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const avg = user?.rating ? Number(user.rating).toFixed(1) : null;

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-zipp-ink-900 tracking-tight">Profile & Preferences</h1>
        <p className="text-sm text-zipp-ink-500 mt-1">Manage your campus identity, photo and settings</p>
      </div>

      {/* Main Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6 space-y-6"
      >
        {/* Avatar & Key Info */}
        <div className="flex items-center gap-5 pb-6 border-b border-zipp-ink-100">
          <div
            className="relative group cursor-pointer shrink-0"
            onClick={() => fileRef.current?.click()}
          >
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-zipp-primary/10 border-2 border-zipp-primary/25 flex items-center justify-center shadow-soft">
              {avatarPreview ? (
                <img src={avatarPreview} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                <span className="text-2xl font-black text-zipp-primary font-heading">
                  {user?.name?.[0]?.toUpperCase()}
                </span>
              )}
            </div>

            {/* Camera Overlay */}
            <div className="absolute inset-0 rounded-2xl bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
              <Camera size={18} />
              <span className="text-[10px] font-semibold mt-0.5">Change</span>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatar}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-zipp-ink-900 truncate">{user?.name}</h2>
              <span className="badge-pill bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                <Shield size={11} className="mr-1 inline" /> Verified Student
              </span>
            </div>
            <p className="text-xs text-zipp-ink-500 mt-1 capitalize font-medium">
              Role: <span className="font-semibold text-zipp-ink-800">{user?.role}</span> · {user?.campus || 'Campus'}
            </p>

            {avg && (
              <div className="flex items-center gap-1.5 mt-2">
                <div className="flex items-center text-amber-500">
                  <Star size={14} className="fill-amber-400 text-amber-400" />
                  <span className="text-xs font-bold text-zipp-ink-900 ml-1">{avg}</span>
                </div>
                <span className="text-xs text-zipp-ink-400">· {feedback.length} deliveries rated</span>
              </div>
            )}
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-zipp-ink-700 uppercase tracking-wider mb-1.5 block">
              Full Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Your full name"
                className="input-field pl-10"
              />
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zipp-ink-400" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-zipp-ink-700 uppercase tracking-wider mb-1.5 block">
              Campus / College
            </label>
            <div className="relative">
              <input
                type="text"
                value={form.campus}
                onChange={(e) => setForm((f) => ({ ...f, campus: e.target.value }))}
                placeholder="e.g. GITAM University, IIT Delhi"
                className="input-field pl-10"
              />
              <School size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zipp-ink-400" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-zipp-ink-700 uppercase tracking-wider mb-1.5 block">
              Bio / Hostel details
            </label>
            <div className="relative">
              <textarea
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                placeholder="Tell peers what hostel block you're in or regular errand routes..."
                rows={3}
                className="input-field pl-10 py-2.5 resize-none"
              />
              <FileText size={16} className="absolute left-3.5 top-4 text-zipp-ink-400" />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2"
          >
            <Save size={16} />
            {saving ? 'Saving Changes...' : 'Save Profile Changes'}
          </button>
        </div>
      </motion.div>

      {/* App Preferences & Theme */}
      <div className="card p-5 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zipp-ink-500">App Preferences</h3>

        <div className="flex items-center justify-between py-2 border-b border-zipp-ink-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zipp-ink-100 flex items-center justify-center text-zipp-ink-700">
              {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
            </div>
            <div>
              <p className="text-sm font-bold text-zipp-ink-900">Theme Mode</p>
              <p className="text-xs text-zipp-ink-500">Toggle between warm light and dark mode</p>
            </div>
          </div>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="px-3.5 py-1.5 rounded-xl border border-zipp-ink-200 bg-zipp-ink-50 text-xs font-bold text-zipp-ink-800 hover:bg-zipp-ink-100 transition-colors"
          >
            {theme === 'dark' ? 'Dark Mode 🌙' : 'Light Mode ☀️'}
          </button>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <LogOut size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-rose-600">Sign Out</p>
              <p className="text-xs text-zipp-ink-500">Log out from this device</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="px-4 py-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-xs font-bold text-rose-600 hover:bg-rose-500/20 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Peer Reviews / Feedback */}
      {feedback.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-zipp-ink-800 flex items-center gap-2">
              <MessageSquare size={16} className="text-zipp-primary" />
              Peer Reviews & Ratings
            </h3>
            <span className="badge-pill bg-zipp-primary/10 text-zipp-primary border-zipp-primary/20 text-xs font-bold">
              {feedback.length} Total
            </span>
          </div>

          <div className="space-y-2.5">
            {feedback.map((f) => (
              <div key={f.id} className="card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-zipp-primary/10 flex items-center justify-center overflow-hidden border border-zipp-primary/20">
                      {f.avatar_url ? (
                        <img src={f.avatar_url} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <span className="text-[11px] font-bold text-zipp-primary font-heading">
                          {f.from_name?.[0]?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-zipp-ink-900">{f.from_name}</span>
                  </div>

                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={12}
                        className={
                          s <= f.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-zipp-ink-200 text-zipp-ink-200'
                        }
                      />
                    ))}
                  </div>
                </div>

                {f.comment && <p className="text-xs text-zipp-ink-600 leading-relaxed pl-9">{f.comment}</p>}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
