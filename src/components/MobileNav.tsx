import React, { useState, useEffect } from 'react';
import { Home, DoorOpen, Store, MessageSquare, LayoutGrid } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';

interface MobileNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentTab, setCurrentTab }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    const checkUnread = async () => {
      try {
        const convs = await apiRequest('/conversations');
        if (Array.isArray(convs)) {
          const count = convs.reduce((acc, c) => acc + (c.unread_count || 0), 0);
          setUnreadCount(count);
        }
      } catch (e) {
        // silent
      }
    };
    checkUnread();
    const interval = setInterval(checkUnread, 4000);
    return () => clearInterval(interval);
  }, [user]);

  // Between Market and Chat in the bottom nav is Posts!
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'residence', label: 'Rooms', icon: DoorOpen },
    { id: 'marketplace', label: 'Market', icon: Store },
    { id: 'posts', label: 'Posts', icon: LayoutGrid },
    { id: 'messages', label: 'Chat', icon: MessageSquare, badge: unreadCount },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#FFFFFF] border-t border-[#E4E7EC] py-2 px-2 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id || (tab.id === 'posts' && currentTab === 'community');
          return (
            <button
              key={tab.id}
              onClick={() => {
                setCurrentTab(tab.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                isActive ? 'text-[#102A43] font-bold' : 'text-[#667085] hover:text-[#172B4D] font-medium'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'text-[#D9A441] stroke-[2.5] scale-110' : 'text-[#667085]'
                  }`}
                />
                {tab.badge ? tab.badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-[#D9A441] text-[#102A43] font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                    {tab.badge}
                  </span>
                ) : null}
              </div>
              <span className={`text-[10px] mt-1 tracking-tight ${isActive ? 'text-[#102A43] font-extrabold' : 'text-[#667085]'}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-[#D9A441] rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
