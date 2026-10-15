import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Trophy, 
  CreditCard, 
  User, 
  HelpCircle, 
  LogOut, 
  Sun, 
  Moon, 
  X,
  ArrowRightLeft,
  Compass
} from 'lucide-react';
import Sidebar from '../components/Sidebar.jsx';
import BottomNav from '../components/BottomNav.jsx';
import Feed from '../components/Feed.jsx';
import MyRequests from '../components/MyRequests.jsx';
import Carrying from '../components/Carrying.jsx';
import RequestWizard from '../components/RequestWizard.jsx';
import ProfilePage from '../components/ProfilePage.jsx';
import Earnings from '../components/Earnings.jsx';
import RequesterDashboard from '../components/RequesterDashboard.jsx';
import HelpPage from '../components/HelpPage.jsx';
import WithdrawalPage from '../components/WithdrawalPage.jsx';
import CampusRadarMap from '../components/map/CampusRadarMap.jsx';
import LeaderboardPage from '../components/LeaderboardPage.jsx';
import RequestDetailModal from '../components/RequestDetailModal.jsx';
import Logo from '../components/common/Logo.jsx';
import useAuthStore from '../store/authStore.js';
import useRequestStore from '../store/requestStore.js';
import { getSocket } from '../socket/socket.js';
import client from '../api/client.js';
import toast from 'react-hot-toast';
import useFCM from '../hooks/useFCM.jsx';

import ThemeToggle from '../components/common/ThemeToggle.jsx';

function AppHeader({ onOpenMore }) {
  const { user, activeRole, switchRole } = useAuthStore();
  const navigate = useNavigate();
  const isCarrier = activeRole === 'carrier';
  const otherRole = isCarrier ? 'requester' : 'carrier';

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#111827]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 pt-safe-top">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        <div className="flex items-center gap-2.5">
          <Logo className="h-7" />
          <span className="hidden sm:inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {user?.campus}
          </span>
        </div>

        {/* Right Corner Controls: Theme Toggle & Segmented Mode Switcher */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="inline-flex p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => {
                if (isCarrier) {
                  switchRole('requester');
                  navigate('/app');
                }
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                !isCarrier
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Requester
            </button>
            <button
              type="button"
              onClick={() => {
                if (!isCarrier) {
                  switchRole('carrier');
                  navigate('/app');
                }
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                isCarrier
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Carrier
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

// Mobile "More" Sheet
function MoreBottomSheet({ isOpen, onClose }) {
  const { user, activeRole, switchRole, logout, theme, setTheme } = useAuthStore();
  const navigate = useNavigate();
  const otherRole = activeRole === 'carrier' ? 'requester' : 'carrier';

  if (!isOpen) return null;

  const navigateTo = (path) => {
    onClose();
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div 
        className="fixed inset-0"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 250 }}
        className="relative z-10 w-full max-w-lg bg-white dark:bg-[#111827] rounded-t-3xl border-t border-slate-200 dark:border-slate-800 p-5 pb-safe-bottom shadow-2xl max-h-[85vh] overflow-y-auto"
      >
        {/* Drag handle */}
        <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mb-4" />

        {/* User Card */}
        <div className="flex items-center justify-between pb-4 mb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-lg">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">{user?.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{user?.campus}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switch Card */}
        <button
          onClick={() => {
            switchRole(otherRole);
            navigateTo('/app');
          }}
          className="w-full flex items-center justify-between p-3.5 mb-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Switch to {otherRole === 'carrier' ? 'Carrier Mode' : 'Requester Mode'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {otherRole === 'carrier' ? 'Earn money delivering on campus' : 'Request fast delivery on campus'}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Switch →</span>
        </button>

        {/* Links Grid */}
        <div className="space-y-1 mb-4">
          <button
            onClick={() => navigateTo('/app/feed')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold transition-colors"
          >
            <Compass className="w-5 h-5 text-blue-500" />
            <span>Campus Feed (All Posts)</span>
          </button>

          <button
            onClick={() => navigateTo('/app/leaderboard')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold transition-colors"
          >
            <Trophy className="w-5 h-5 text-amber-500" />
            <span>Leaderboard & Badges</span>
          </button>

          {activeRole === 'carrier' && (
            <button
              onClick={() => navigateTo('/app/withdraw')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold transition-colors"
            >
              <CreditCard className="w-5 h-5 text-emerald-500" />
              <span>Withdraw to UPI</span>
            </button>
          )}

          <button
            onClick={() => navigateTo('/app/profile')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold transition-colors"
          >
            <User className="w-5 h-5 text-blue-500" />
            <span>Profile & Ratings</span>
          </button>

          <button
            onClick={() => navigateTo('/app/help')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold transition-colors"
          >
            <HelpCircle className="w-5 h-5 text-purple-500" />
            <span>Help & Report Issue</span>
          </button>
        </div>

        {/* Theme & Logout */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={() => setTheme(document.documentElement.classList.contains('dark') ? 'light' : 'dark')}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <Sun className="w-4 h-4 dark:hidden" />
            <Moon className="w-4 h-4 hidden dark:inline-block" />
            <span>Toggle Theme</span>
          </button>

          <button
            onClick={() => {
              onClose();
              logout();
              navigate('/');
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function AppShell() {
  const { user, fetchMe, activeRole } = useAuthStore();
  const { 
    prependToFeed, 
    removeFromFeed, 
    updateMyRequest, 
    updateCarrying, 
    updateCarrierBroadcast,
    fetchMine,
    fetchCarrying
  } = useRequestStore();
  const [focusedRequest, setFocusedRequest] = useState(null);
  const [focusedAutoTab, setFocusedAutoTab] = useState('details');
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const { isReady: fcmReady } = useFCM({
    onNotification: (notif) => {
      toast(`${notif.title}: ${notif.body}`, { duration: 5000 });
    },
  });

  useEffect(() => {
    fetchMe();
    const socket = getSocket();

    const joinRooms = () => {
      if (user?.campus) socket.emit('join:campus', user.campus);
      if (user?.id) socket.emit('join:user', user.id);
    };

    if (socket.connected) {
      joinRooms();
    }
    socket.on('connect', joinRooms);

    socket.on('request:new', (req) => {
      prependToFeed(req);
      if (req.requester_id !== user?.id) {
        toast(`📦 New errand posted: "${req.title}" (₹${req.reward})`, { duration: 3500 });
      }
    });

    socket.on('request:removeFromFeed', ({ requestId }) => removeFromFeed(requestId));

    socket.on('request:accepted', async ({ requestId, carrierName, carrierId }) => {
      updateMyRequest(requestId, { status: 'accepted' });
      // Only pop up if the current user is NOT the carrier who just accepted
      if (carrierId && user?.id === carrierId) {
        return;
      }
      try {
        const res = await client.get(`/requests/${requestId}`);
        if (res.data.data?.requester_id === user?.id) {
          toast.success(`🛵 ${carrierName} accepted your request!`, { duration: 5000 });
          setFocusedAutoTab('details');
          setFocusedRequest(res.data.data);
        }
      } catch {
        // quiet ignore
      }
    });

    socket.on('chat:notify', ({ fromName, message }) => {
      toast(`💬 ${fromName}: ${message.slice(0, 40)}`, { duration: 4000 });
    });

    socket.on('request:statusUpdate', async ({ status, requestId, reward }) => {
      updateMyRequest(requestId, { status });
      updateCarrying(requestId, { status });

      if (status === 'delivered') {
        fetchMine();
        fetchCarrying();
        if (activeRole === 'requester') {
          try {
            const res = await client.get(`/requests/${requestId}`);
            if (res.data.data?.requester_id === user?.id) {
              setFocusedAutoTab('feedback');
              setFocusedRequest(res.data.data);
              toast.success('🎉 Order delivered! Rate your carrier.', { duration: 5000 });
            }
          } catch {}
        } else if (activeRole === 'carrier') {
          toast.success(`🎉 Delivery confirmed! ₹${reward || ''} added to earnings.`, { duration: 5000 });
        }
      }
    });

    socket.on('carrier:locationBroadcast', ({ requestId, address, lat, lng, carrierName, updatedAt }) => {
      updateCarrierBroadcast(requestId, {
        carrier_address: address,
        carrier_lat: lat,
        carrier_lng: lng,
        carrier_updated_at: updatedAt,
      });

      if (activeRole === 'requester') {
        toast(`📍 Carrier ${carrierName || ''} broadcasted location: "${address || 'Live GPS'}"`, {
          icon: '🛵',
          duration: 5000,
        });
      }
    });

    return () => {
      socket.off('connect', joinRooms);
      socket.off('request:new');
      socket.off('request:removeFromFeed');
      socket.off('request:accepted');
      socket.off('chat:notify');
      socket.off('request:statusUpdate');
      socket.off('carrier:locationBroadcast');
    };
  }, [user?.campus, user?.id, activeRole]);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#090d16] overflow-hidden text-slate-900 dark:text-slate-100">
      <AppHeader onOpenMore={() => setIsMoreOpen(true)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto pb-24 md:pb-8 px-4 sm:px-6 py-4 md:py-6 w-full max-w-full">
          <div className="max-w-3xl mx-auto w-full">
            <Routes>
              <Route path="/" element={activeRole === 'carrier' ? <Feed /> : <MyRequests />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/mine" element={<MyRequests />} />
              <Route path="/carrying" element={<Carrying />} />
              <Route path="/new" element={<RequestWizard />} />
              <Route path="/map" element={<CampusRadarMap />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/earnings" element={<Earnings />} />
              <Route path="/withdraw" element={<WithdrawalPage />} />
              <Route path="/spending" element={<RequesterDashboard />} />
              <Route path="/help" element={<HelpPage />} />
            </Routes>
          </div>
        </main>

        <BottomNav onOpenMore={() => setIsMoreOpen(true)} />
      </div>

      {/* More Bottom Sheet */}
      <AnimatePresence>
        {isMoreOpen && <MoreBottomSheet isOpen={isMoreOpen} onClose={() => setIsMoreOpen(false)} />}
      </AnimatePresence>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {focusedRequest && (
          <RequestDetailModal
            request={focusedRequest}
            onClose={() => {
              setFocusedRequest(null);
              setFocusedAutoTab('details');
            }}
            onRefresh={() => {}}
            autoTab={focusedAutoTab}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
