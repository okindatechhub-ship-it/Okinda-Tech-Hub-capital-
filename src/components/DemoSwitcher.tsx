import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ShieldCheck, UserCheck, LogOut, KeyRound } from 'lucide-react';

interface DemoSwitcherProps {
  onOpenAuth?: (mode: 'login' | 'register') => void;
}

export const DemoSwitcher: React.FC<DemoSwitcherProps> = ({ onOpenAuth }) => {
  const { user, login, logout } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async () => {
    try {
      setLoading(true);
      await login('okindatechhub@gmail.com', 'Okinda3078');
      toast.success('Logged in as Administrator (okindatechhub@gmail.com)');
    } catch (err: any) {
      toast.error(err.message || 'Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0C2033] text-slate-200 text-xs py-1.5 px-3 border-b border-[#1b3d5e] flex items-center justify-between z-40 select-none">
      <div className="flex items-center gap-2 truncate">
        <span className="w-2 h-2 rounded-full bg-[#D9A441] shrink-0" />
        <span className="font-semibold text-white truncate text-[11px] sm:text-xs">
          {user ? (
            user.role === 'admin' ? (
              <span className="text-[#D9A441] font-bold">Admin: okindatechhub@gmail.com</span>
            ) : (
              <span>{user.full_name} · Room: {user.resident_room_number || 'Resident'}</span>
            )
          ) : (
            <span className="text-slate-300">Sign up or Log in to access the residence app</span>
          )}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {user?.role !== 'admin' && (
          <button
            onClick={handleAdminLogin}
            disabled={loading}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#102A43] hover:bg-[#1b3d5e] text-[#D9A441] border border-[#D9A441]/30 transition text-[11px] font-semibold"
          >
            <ShieldCheck className="w-3 h-3 text-[#D9A441]" />
            <span>{loading ? 'Logging in...' : 'Admin Login (Okinda)'}</span>
          </button>
        )}

        {user ? (
          <button
            onClick={() => {
              logout();
              toast.info('Logged out. Please sign up or log in.');
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 text-[11px] transition"
            title="Log out"
          >
            <LogOut className="w-3 h-3" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        ) : (
          onOpenAuth && (
            <button
              onClick={() => onOpenAuth('register')}
              className="px-2.5 py-1 rounded-lg bg-[#D9A441] text-[#102A43] font-bold text-[11px] hover:bg-[#c99532] transition"
            >
              Sign Up / Log In
            </button>
          )
        )}
      </div>
    </div>
  );
};
