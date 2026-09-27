import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import {
  Building2,
  Home,
  Store,
  LayoutGrid,
  MessageSquare,
  Bell,
  Bookmark,
  ShoppingBag,
  Shield,
  LogOut,
  User,
  ChevronDown,
  KeyRound,
  DoorOpen,
  Menu,
  X
} from 'lucide-react';
import { apiRequest } from '../api/client';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  openAuthModal: (mode: 'login' | 'register') => void;
  onSelectRoom?: (roomId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, openAuthModal }) => {
  const { user, logout, residentRoom } = useAuth();
  const { totalItems, setIsCartOpen } = useCart();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Poll notifications & conversations for badge counts
  useEffect(() => {
    if (!user) {
      setUnreadMessages(0);
      setUnreadNotifs(0);
      return;
    }

    const checkBadges = async () => {
      try {
        const notifs = await apiRequest('/notifications');
        const unreadN = Array.isArray(notifs) ? notifs.filter(n => !n.read_at).length : 0;
        setUnreadNotifs(unreadN);

        const convs = await apiRequest('/conversations');
        const unreadM = Array.isArray(convs) ? convs.reduce((acc, c) => acc + (c.unread_count || 0), 0) : 0;
        setUnreadMessages(unreadM);
      } catch (e) {
        // silent fail
      }
    };

    checkBadges();
    const interval = setInterval(checkBadges, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'residence', label: 'Residence', icon: DoorOpen },
    { id: 'marketplace', label: 'Marketplace', icon: Store },
    { id: 'posts', label: 'Posts', icon: LayoutGrid },
    { id: 'messages', label: 'Messages', icon: MessageSquare, badge: unreadMessages },
  ];

  const handleNavClick = (tabId: string) => {
    setCurrentTab(tabId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 bg-[#102A43] text-white border-b border-[#1b3d5e] transition-all shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0a1b2d] to-[#1b3d5e] border border-[#D9A441]/40 text-[#D9A441] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white tracking-tight text-base sm:text-lg">
                  Capital Home
                </span>
                <span className="text-[#D9A441] font-extrabold text-base sm:text-lg">
                  Residence
                </span>
              </div>
              <p className="text-[10px] text-slate-300 font-semibold tracking-wider uppercase -mt-0.5">
                Live. Connect. Buy. Sell.
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id || (item.id === 'posts' && currentTab === 'community');
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-[#1b3d5e] text-[#D9A441] shadow-xs'
                      : 'text-slate-200 hover:text-white hover:bg-[#16334f]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#D9A441]' : 'text-slate-300'}`} />
                  <span>{item.label}</span>
                  {item.badge ? item.badge > 0 && (
                    <span className="ml-0.5 px-1.5 py-0.2 text-[10px] font-extrabold rounded-full bg-[#D9A441] text-[#102A43]">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          {/* Right Actions & Account */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 rounded-xl text-slate-200 hover:text-white hover:bg-[#1b3d5e] transition"
              title="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5 text-slate-200" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#D9A441] text-[#102A43] font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-[#102A43]">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Notifications Button */}
            {user && (
              <button
                onClick={() => handleNavClick('notifications')}
                className="relative p-2 rounded-xl text-slate-200 hover:text-white hover:bg-[#1b3d5e] transition"
                title="Notifications"
              >
                <Bell className="w-5 h-5 text-slate-200" />
                {unreadNotifs > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[#DC2626] text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-[#102A43]">
                    {unreadNotifs}
                  </span>
                )}
              </button>
            )}

            {/* User Account / Login */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-[#1b3d5e] hover:border-[#D9A441]/50 bg-[#16334f] hover:bg-[#1b3d5e] transition shadow-xs text-white"
                >
                  <img
                    src={user.profile_photo || `https://api.dicebear.com/7.x/initials/svg?seed=${user.full_name}`}
                    alt={user.full_name}
                    className="w-7 h-7 rounded-lg object-cover bg-slate-700 ring-1 ring-[#D9A441]/40"
                  />
                  <span className="hidden sm:inline text-xs font-semibold text-slate-100 max-w-[100px] truncate">
                    {user.full_name.split(' ')[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {userDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setUserDropdownOpen(false)} />
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-[#E4E7EC] p-2 z-40 text-[#172B4D] animate-in fade-in">
                      {/* User Header */}
                      <div className="p-3 rounded-xl bg-[#F7F8FA] border border-[#E4E7EC] mb-1.5">
                        <p className="text-xs font-bold text-[#102A43] truncate">{user.full_name}</p>
                        <p className="text-[11px] text-[#667085] truncate">{user.email}</p>
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            user.role === 'admin'
                              ? 'bg-rose-100 text-rose-800'
                              : user.role === 'resident'
                              ? 'bg-[#102A43] text-[#D9A441]'
                              : user.role === 'advertiser'
                              ? 'bg-[#D9A441]/20 text-[#102A43] font-bold'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {user.role === 'normal_user' ? 'Student' : user.role}
                          </span>
                          {residentRoom && (
                            <span className="text-[10px] text-[#102A43] font-bold bg-[#D9A441]/20 px-1.5 py-0.5 rounded border border-[#D9A441]/40">
                              {residentRoom.room_number}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Dropdown Items */}
                      <div className="space-y-0.5 text-xs font-medium">
                        <button
                          onClick={() => { setCurrentTab('account'); setUserDropdownOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#F1F3F5] text-[#172B4D] text-left transition"
                        >
                          <User className="w-4 h-4 text-[#667085]" />
                          <span>My Account</span>
                        </button>

                        <button
                          onClick={() => { setCurrentTab('account-residence'); setUserDropdownOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#F1F3F5] text-[#172B4D] text-left transition"
                        >
                          <KeyRound className="w-4 h-4 text-[#D9A441]" />
                          <span>My Room & Move-Out Notice</span>
                        </button>

                        <button
                          onClick={() => { setCurrentTab('account-selling'); setUserDropdownOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#F1F3F5] text-[#172B4D] text-left transition"
                        >
                          <Store className="w-4 h-4 text-[#102A43]" />
                          <span>Seller Hub & Payments</span>
                        </button>

                        <button
                          onClick={() => { setCurrentTab('saved'); setUserDropdownOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#F1F3F5] text-[#172B4D] text-left transition"
                        >
                          <Bookmark className="w-4 h-4 text-[#D9A441]" />
                          <span>Saved Items</span>
                        </button>

                        {user.role === 'admin' && (
                          <div className="pt-1 mt-1 border-t border-[#E4E7EC]">
                            <button
                              onClick={() => { setCurrentTab('admin'); setUserDropdownOpen(false); }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#102A43] text-[#D9A441] text-left transition font-semibold"
                            >
                              <Shield className="w-4 h-4 text-[#D9A441]" />
                              <span>Admin Dashboard (82 Rooms)</span>
                            </button>
                          </div>
                        )}

                        <div className="pt-1 mt-1 border-t border-[#E4E7EC]">
                          <button
                            onClick={() => { logout(); setUserDropdownOpen(false); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-rose-50 text-[#DC2626] text-left transition font-medium"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuthModal('login')}
                  className="px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-white hover:bg-[#1b3d5e] transition"
                >
                  Log In
                </button>
                <button
                  onClick={() => openAuthModal('register')}
                  className="px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-[#D9A441] hover:bg-[#c49132] text-[#102A43] shadow transition"
                >
                  Register
                </button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-200 hover:text-white hover:bg-[#1b3d5e]"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#1b3d5e] bg-[#0c2033] px-4 pt-2 pb-4 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id || (item.id === 'posts' && currentTab === 'community');
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium ${
                  isActive ? 'bg-[#1b3d5e] text-[#D9A441] font-bold' : 'text-slate-200 hover:bg-[#16334f]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-slate-400" />
                  <span>{item.label}</span>
                </div>
                {item.badge ? item.badge > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-[#D9A441] text-[#102A43]">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
          {user?.role === 'admin' && (
            <button
              onClick={() => handleNavClick('admin')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold bg-[#1b3d5e] text-[#D9A441]"
            >
              <Shield className="w-5 h-5 text-[#D9A441]" />
              <span>Admin Dashboard (82 Rooms)</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
};
