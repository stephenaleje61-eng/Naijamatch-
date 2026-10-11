import React from 'react';
import { Compass, Heart, MessageSquare, ShoppingBag, User as UserIcon, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

interface BottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenProfile: () => void;
  onOpenAuth: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenProfile,
  onOpenAuth
}) => {
  const { user, unreadNotifsCount } = useAuth();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe">
      <div className="grid grid-cols-5 items-center h-16 px-1">
        <button
          onClick={() => onSelectTab(user ? 'discover' : 'home')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            currentTab === 'discover' || currentTab === 'home' ? 'text-[#008751]' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-1">Discover</span>
        </button>

        <button
          onClick={() => onSelectTab('public-chat')}
          className={`relative flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            currentTab === 'public-chat' ? 'text-[#008751]' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#008751] animate-pulse" />
          </div>
          <span className="text-[10px] font-bold tracking-tight mt-1">Public 🇳🇬</span>
        </button>

        <button
          onClick={() => {
            if (!user) {
              onOpenAuth();
            } else {
              onSelectTab('messages');
            }
          }}
          className={`relative flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            currentTab === 'messages' ? 'text-[#008751]' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          {unreadNotifsCount > 0 && (
            <span className="absolute top-2 right-4 w-2 h-2 rounded-full bg-red-600" />
          )}
          <span className="text-[10px] font-medium tracking-tight mt-1">Direct</span>
        </button>

        <button
          onClick={() => {
            if (!user) {
              onOpenAuth();
            } else {
              onSelectTab('likes');
            }
          }}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            currentTab === 'likes' ? 'text-[#008751]' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Heart className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-1">Likes</span>
        </button>

        <button
          onClick={() => onSelectTab('marketplace')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            currentTab === 'marketplace' ? 'text-[#008751]' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-1">Market</span>
        </button>

        <button
          onClick={() => {
            if (!user) {
              onOpenAuth();
            } else if (user.role === 'admin' && currentTab !== 'admin') {
              onSelectTab('admin');
            } else {
              onOpenProfile();
            }
          }}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            currentTab === 'profile' || currentTab === 'admin' ? 'text-[#008751]' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          {user?.role === 'admin' ? (
            <Shield className="w-5 h-5 text-amber-600" />
          ) : (
            <UserIcon className="w-5 h-5" />
          )}
          <span className="text-[10px] font-medium tracking-tight mt-1">
            {user?.role === 'admin' ? 'Admin' : user ? 'Profile' : 'Sign In'}
          </span>
        </button>
      </div>
    </nav>
  );
};
