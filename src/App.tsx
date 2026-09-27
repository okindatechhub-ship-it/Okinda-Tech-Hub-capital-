import React, { useState } from 'react';
import { Building2 } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { DemoSwitcher } from './components/DemoSwitcher';
import { Navbar } from './components/Navbar';
import { MobileNav } from './components/MobileNav';
import { Footer } from './components/Footer';
import { CartModal } from './components/CartModal';
import { AuthModal } from './components/AuthModal';
import { AndroidFrame } from './components/AndroidFrame';

import { HomePage } from './pages/HomePage';
import { ResidencePage } from './pages/ResidencePage';
import { RoomDetailPage } from './pages/RoomDetailPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CommunityPage } from './pages/CommunityPage';
import { MessagesPage } from './pages/MessagesPage';
import { AccountPage } from './pages/AccountPage';
import { AdminPage } from './pages/AdminPage';

function MainApp() {
  const { user, isLoading } = useAuth();

  const [currentTab, setCurrentTab] = useState<string>('home');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isAndroidFrameActive, setIsAndroidFrameActive] = useState<boolean>(false);

  // Chat parameters
  const [chatRecipientId, setChatRecipientId] = useState<string | null>(null);
  const [chatInitialMessage, setChatInitialMessage] = useState<string>('');
  const [chatProductRef, setChatProductRef] = useState<any>(null);
  const [chatRoomRef, setChatRoomRef] = useState<any>(null);

  // Auth Modal
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#102A43] flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#1b3d5e] border-2 border-[#D9A441] text-[#D9A441] flex items-center justify-center mb-4 shadow-xl animate-pulse">
          <Building2 className="w-9 h-9" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white">CAPITAL HOME RESIDENCE</h1>
        <p className="text-xs text-[#D9A441] font-bold tracking-widest uppercase mt-1">Live. Connect. Buy. Sell.</p>
        <p className="text-xs text-slate-400 mt-4">Loading residence portal...</p>
      </div>
    );
  }

  const handleSelectRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
    setCurrentTab('room-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProductId(productId);
    setCurrentTab('product-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenChatWithUser = (
    userId: string,
    initialMessage?: string,
    refObj?: any
  ) => {
    setChatRecipientId(userId);
    setChatInitialMessage(initialMessage || '');
    if (refObj?.price && refObj?.room_number) {
      setChatRoomRef(refObj);
      setChatProductRef(null);
    } else if (refObj?.price && refObj?.name) {
      setChatProductRef(refObj);
      setChatRoomRef(null);
    } else {
      setChatProductRef(null);
      setChatRoomRef(null);
    }
    setCurrentTab('messages');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderActiveView = () => {
    switch (currentTab) {
      case 'home':
        return (
          <HomePage
            setCurrentTab={setCurrentTab}
            onSelectRoom={handleSelectRoom}
            onSelectProduct={handleSelectProduct}
            openAuthModal={openAuthModal}
          />
        );

      case 'residence':
        return (
          <ResidencePage
            onSelectRoom={handleSelectRoom}
            openAuthModal={openAuthModal}
            onOpenChatWithUser={handleOpenChatWithUser}
          />
        );

      case 'room-detail':
        return selectedRoomId ? (
          <RoomDetailPage
            roomId={selectedRoomId}
            onBack={() => setCurrentTab('residence')}
            openAuthModal={openAuthModal}
            onOpenChatWithUser={handleOpenChatWithUser}
            setCurrentTab={setCurrentTab}
          />
        ) : (
          <ResidencePage
            onSelectRoom={handleSelectRoom}
            openAuthModal={openAuthModal}
            onOpenChatWithUser={handleOpenChatWithUser}
          />
        );

      case 'marketplace':
        return (
          <MarketplacePage
            onSelectProduct={handleSelectProduct}
            openAuthModal={openAuthModal}
            onOpenChatWithUser={handleOpenChatWithUser}
            setCurrentTab={setCurrentTab}
          />
        );

      case 'product-detail':
        return selectedProductId ? (
          <ProductDetailPage
            productId={selectedProductId}
            onBack={() => setCurrentTab('marketplace')}
            openAuthModal={openAuthModal}
            onOpenChatWithUser={handleOpenChatWithUser}
            onSelectProduct={handleSelectProduct}
            setCurrentTab={setCurrentTab}
          />
        ) : (
          <MarketplacePage
            onSelectProduct={handleSelectProduct}
            openAuthModal={openAuthModal}
            onOpenChatWithUser={handleOpenChatWithUser}
            setCurrentTab={setCurrentTab}
          />
        );

      case 'posts':
      case 'community':
        return (
          <CommunityPage
            openAuthModal={openAuthModal}
            onSelectProduct={handleSelectProduct}
            onSelectRoom={handleSelectRoom}
            onOpenChatWithUser={handleOpenChatWithUser}
          />
        );

      case 'messages':
        return (
          <MessagesPage
            initialRecipientId={chatRecipientId}
            initialMessageText={chatInitialMessage}
            initialProductRef={chatProductRef}
            initialRoomRef={chatRoomRef}
            onSelectProduct={handleSelectProduct}
            onSelectRoom={handleSelectRoom}
            openAuthModal={openAuthModal}
          />
        );

      case 'account':
      case 'account-residence':
      case 'account-selling':
      case 'saved':
      case 'notifications':
        return (
          <AccountPage
            initialTab={
              currentTab === 'account-residence'
                ? 'residence'
                : currentTab === 'account-selling'
                ? 'selling'
                : currentTab === 'saved'
                ? 'saved'
                : currentTab === 'notifications'
                ? 'notifications'
                : 'profile'
            }
            onSelectRoom={handleSelectRoom}
            onSelectProduct={handleSelectProduct}
          />
        );

      case 'admin':
        return (
          <AdminPage
            onSelectRoom={handleSelectRoom}
            onSelectProduct={handleSelectProduct}
            onOpenChatWithUser={handleOpenChatWithUser}
          />
        );

      default:
        return (
          <HomePage
            setCurrentTab={setCurrentTab}
            onSelectRoom={handleSelectRoom}
            onSelectProduct={handleSelectProduct}
            openAuthModal={openAuthModal}
          />
        );
    }
  };

  return (
    <AndroidFrame
      isAndroidFrameActive={isAndroidFrameActive}
      setIsAndroidFrameActive={setIsAndroidFrameActive}
    >
      <div className="min-h-full bg-[#F7F8FA] flex flex-col selection:bg-[#D9A441] selection:text-[#102A43] font-sans pb-16 md:pb-0">
        {/* 1. Reviewer Demo Persona Switcher */}
        <DemoSwitcher />

        {/* 2. Top Navigation */}
        <Navbar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          openAuthModal={openAuthModal}
        />

        {/* 3. Main Page Content */}
        <main className="flex-1">
          {renderActiveView()}
        </main>

        {/* 4. Footer */}
        <Footer setCurrentTab={setCurrentTab} />

        {/* 5. Mobile Bottom Navigation */}
        <MobileNav
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
        />

        {/* 6. Global Cart Drawer/Modal */}
        <CartModal />

        {/* 7. Auth Modal - Compulsory on initial access (persisted in localStorage) */}
        <AuthModal
          isOpen={!user || isAuthOpen}
          isForcedAuth={!user}
          onClose={() => setIsAuthOpen(false)}
          initialMode={!user ? 'register' : authMode}
        />
      </div>
    </AndroidFrame>
  );
}

export function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ToastProvider>
          <MainApp />
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
