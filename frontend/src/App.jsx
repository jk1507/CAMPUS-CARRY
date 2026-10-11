import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore.js';
import LandingPage from './pages/LandingPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import AppShell from './pages/AppShell.jsx';

const PrivateRoute = ({ children }) => {
  const token = useAuthStore(s => s.token);
  return token ? children : <Navigate to="/auth" replace />;
};

export default function App() {
  const theme = useAuthStore((s) => s.theme);

  useEffect(() => {
    if (
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid rgba(148,163,184,0.15)', fontFamily: 'DM Sans, sans-serif', fontSize: '14px', borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' },
        success: { iconTheme: { primary: '#a78bfa', secondary: '#1e293b' } },
      }}/>
      <Routes>
        <Route path="/"     element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/app/*" element={<PrivateRoute><AppShell /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
