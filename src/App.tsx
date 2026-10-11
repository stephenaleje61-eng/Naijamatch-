import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/layout/Navbar.tsx';
import { BottomNav } from './components/layout/BottomNav.tsx';
import { Footer } from './components/layout/Footer.tsx';
import { OfflineIndicator } from './components/common/OfflineIndicator.tsx';

import { WelcomeLanding } from './components/landing/WelcomeLanding.tsx';
import { AuthModal } from './components/auth/AuthModal.tsx';
import { OnboardingModal } from './components/profile/OnboardingModal.tsx';
import { DiscoverPage } from './components/discover/DiscoverPage.tsx';
import { LikesPage } from './components/likes/LikesPage.tsx';
import { SubscriptionsPage } from './components/subscription/SubscriptionsPage.tsx';
import { PaymentProofModal } from './components/subscription/PaymentProofModal.tsx';
import { MessagesPage } from './components/messages/MessagesPage.tsx';
import { PublicChatRoom } from './components/chat/PublicChatRoom.tsx';
import { RegisterPage } from './components/auth/RegisterPage.tsx';
import { MarketplacePage } from './components/marketplace/MarketplacePage.tsx';
import { AdminDashboard } from './components/admin/AdminDashboard.tsx';
import { LegalPages } from './components/legal/LegalPages.tsx';
import { SubscriptionPlanId } from './types/index.ts';

function NaijaMatchApp() {
  const { user, profile, isLoading, token } = useAuth();

  const [currentTab, setCurrentTab] = useState<string>('home');
  const [authModalState, setAuthModalState] = useState<{ isOpen: boolean; mode: 'login' | 'register' }>({
    isOpen: false,
    mode: 'login'
  });
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [proofModalState, setProofModalState] = useState<{ isOpen: boolean; planId: SubscriptionPlanId }>({
    isOpen: false,
    planId: 'monthly'
  });
  const [selectedChatConvoId, setSelectedChatConvoId] = useState<string | undefined>(undefined);

  // Sync default view based on auth state
  useEffect(() => {
    if (!isLoading) {
      if (user && currentTab === 'home') {
        setCurrentTab('discover');
      }
      // Check if user needs profile onboarding
      if (user && user.isEmailVerified && (!profile || !profile.displayName || profile.photos.length === 0)) {
        setIsOnboardingOpen(true);
      }
    }
  }, [user, profile, isLoading]);

  const handleStartChatWithUser = async (targetUserId: string) => {
    if (!token) {
      setAuthModalState({ isOpen: true, mode: 'login' });
      return;
    }
    try {
      const res = await fetch('/api/messages/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ targetUserId })
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedChatConvoId(data.conversation.id);
        setCurrentTab('messages');
      } else {
        const err = await res.json();
        alert(err.error || 'Could not start conversation');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenAuth = (mode: 'login' | 'register') => {
    setAuthModalState({ isOpen: true, mode });
  };

  const isLegalTab = ['safety', 'terms', 'privacy', 'guidelines', 'refund-policy', 'contact'].includes(currentTab);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F7F6] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#008751] border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-base font-bold text-slate-800">NaijaMatch</h2>
        <p className="text-xs text-slate-500">Find Love. Find Your Person.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7F6] text-[#111111] flex flex-col selection:bg-[#008751]/20 selection:text-[#008751]">
      <OfflineIndicator />

      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onOpenAuth={() => handleOpenAuth('login')}
        onOpenProfile={() => setIsOnboardingOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {currentTab === 'home' && (
          <WelcomeLanding
            onGetStarted={() => {
              if (user) {
                setCurrentTab('discover');
              } else {
                setCurrentTab('register');
              }
            }}
            onOpenLogin={() => handleOpenAuth('login')}
            onOpenRegister={() => setCurrentTab('register')}
            onSelectTab={(tab) => setCurrentTab(tab)}
          />
        )}

        {currentTab === 'register' && (
          <RegisterPage
            onOpenLogin={() => handleOpenAuth('login')}
            onSuccess={() => setCurrentTab('discover')}
          />
        )}

        {currentTab === 'public-chat' && (
          <PublicChatRoom onOpenAuth={() => handleOpenAuth('login')} />
        )}

        {currentTab === 'discover' && (
          <DiscoverPage
            onStartChatWithUser={handleStartChatWithUser}
            onOpenSubscriptions={() => setCurrentTab('subscriptions')}
          />
        )}

        {currentTab === 'likes' && (
          <LikesPage
            onStartChat={handleStartChatWithUser}
            onOpenSubscriptions={() => setCurrentTab('subscriptions')}
          />
        )}

        {currentTab === 'messages' && (
          <MessagesPage
            initialConversationId={selectedChatConvoId}
            onOpenSubscriptions={() => setCurrentTab('subscriptions')}
          />
        )}

        {currentTab === 'marketplace' && (
          <MarketplacePage
            onContactSeller={handleStartChatWithUser}
            onOpenSubscriptions={() => setCurrentTab('subscriptions')}
          />
        )}

        {currentTab === 'subscriptions' && (
          <SubscriptionsPage
            onOpenUploadProof={(planId) => setProofModalState({ isOpen: true, planId })}
          />
        )}

        {currentTab === 'admin' && <AdminDashboard />}

        {isLegalTab && (
          <LegalPages
            page={currentTab as any}
            onBack={() => setCurrentTab(user ? 'discover' : 'home')}
          />
        )}
      </main>

      {/* Mobile-First Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onOpenProfile={() => setIsOnboardingOpen(true)}
        onOpenAuth={() => handleOpenAuth('login')}
      />

      {/* Footer */}
      <Footer onSelectTab={(tab) => setCurrentTab(tab)} />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalState.isOpen}
        initialMode={authModalState.mode}
        onClose={() => setAuthModalState({ ...authModalState, isOpen: false })}
        onSuccess={() => {
          setAuthModalState({ ...authModalState, isOpen: false });
          setCurrentTab('discover');
        }}
      />

      {/* Mandatory Onboarding / Profile Editing Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onSuccess={() => {
          setIsOnboardingOpen(false);
          setCurrentTab('discover');
        }}
      />

      {/* Payment Proof Upload Modal */}
      <PaymentProofModal
        isOpen={proofModalState.isOpen}
        initialPlanId={proofModalState.planId}
        onClose={() => setProofModalState({ ...proofModalState, isOpen: false })}
        onSuccess={() => {
          setProofModalState({ ...proofModalState, isOpen: false });
          setCurrentTab('subscriptions');
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NaijaMatchApp />
    </AuthProvider>
  );
}
