import React from 'react';
import { Heart, Bell, Shield, User as UserIcon, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { PWAInstallButton } from '../common/PWAInstallButton.tsx';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenAuth,
  onOpenProfile
}) => {
  const { user, profile, subscription, logout, unreadNotifsCount } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <button
          onClick={() => onSelectTab(user ? 'discover' : 'home')}
          className="flex items-center gap-2.5 text-left group shrink-0"
        >
          <div className="w-8 h-8 rounded-lg bg-[#008751] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
            <Heart className="w-4 h-4 fill-white" />
          </div>
          <span className="text-xl font-black tracking-tight text-slate-900 whitespace-nowrap">
            NaijaMatch
          </span>
        </button>

        {/* Zone 2: Navigation Links (Single line, 1-2 words) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          {user ? (
            <>
              <button
                onClick={() => onSelectTab('discover')}
                className={`whitespace-nowrap transition-colors hover:text-[#008751] ${
                  currentTab === 'discover' ? 'text-[#008751] font-bold' : ''
                }`}
              >
                Discover
              </button>
              <button
                onClick={() => onSelectTab('public-chat')}
                className={`flex items-center gap-1.5 whitespace-nowrap transition-colors hover:text-[#008751] ${
                  currentTab === 'public-chat' ? 'text-[#008751] font-bold' : ''
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#008751] animate-pulse" />
                <span>Public Chat</span>
              </button>
              <button
                onClick={() => onSelectTab('likes')}
                className={`whitespace-nowrap transition-colors hover:text-[#008751] ${
                  currentTab === 'likes' ? 'text-[#008751] font-bold' : ''
                }`}
              >
                Likes
              </button>
              <button
                onClick={() => onSelectTab('messages')}
                className={`whitespace-nowrap transition-colors hover:text-[#008751] ${
                  currentTab === 'messages' ? 'text-[#008751] font-bold' : ''
                }`}
              >
                Messages
              </button>
              <button
                onClick={() => onSelectTab('marketplace')}
                className={`whitespace-nowrap transition-colors hover:text-[#008751] ${
                  currentTab === 'marketplace' ? 'text-[#008751] font-bold' : ''
                }`}
              >
                Marketplace
              </button>
              <button
                onClick={() => onSelectTab('subscriptions')}
                className={`whitespace-nowrap transition-colors hover:text-[#008751] ${
                  currentTab === 'subscriptions' ? 'text-[#008751] font-bold' : ''
                }`}
              >
                Plans
              </button>
              {user.role === 'admin' && (
                <button
                  onClick={() => onSelectTab('admin')}
                  className={`flex items-center gap-1 whitespace-nowrap transition-colors hover:text-amber-600 ${
                    currentTab === 'admin' ? 'text-amber-700 font-bold' : 'text-slate-600'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  Admin
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={() => onSelectTab('home')}
                className={`whitespace-nowrap transition-colors hover:text-[#008751] ${
                  currentTab === 'home' ? 'text-[#008751] font-bold' : ''
                }`}
              >
                Home
              </button>
              <button
                onClick={() => onSelectTab('public-chat')}
                className={`flex items-center gap-1.5 whitespace-nowrap transition-colors hover:text-[#008751] ${
                  currentTab === 'public-chat' ? 'text-[#008751] font-bold' : ''
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#008751] animate-pulse" />
                <span>Public Chat</span>
              </button>
              <button
                onClick={() => onSelectTab('subscriptions')}
                className={`whitespace-nowrap transition-colors hover:text-[#008751] ${
                  currentTab === 'subscriptions' ? 'text-[#008751] font-bold' : ''
                }`}
              >
                Plans
              </button>
              <button
                onClick={() => onSelectTab('marketplace')}
                className={`whitespace-nowrap transition-colors hover:text-[#008751] ${
                  currentTab === 'marketplace' ? 'text-[#008751] font-bold' : ''
                }`}
              >
                Marketplace
              </button>
              <button
                onClick={() => onSelectTab('safety')}
                className={`whitespace-nowrap transition-colors hover:text-[#008751] ${
                  currentTab === 'safety' ? 'text-[#008751] font-bold' : ''
                }`}
              >
                Safety Tips
              </button>
            </>
          )}
        </nav>

        {/* Zone 3: Primary Action / User Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <PWAInstallButton />

          {user ? (
            <div className="flex items-center gap-2">
              {unreadNotifsCount > 0 && (
                <button
                  onClick={() => onSelectTab('messages')}
                  className="relative p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-600" />
                </button>
              )}

              <button
                onClick={onOpenProfile}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white transition-colors text-left"
              >
                {profile?.photos?.[0]?.url ? (
                  <img
                    src={profile.photos[0].url}
                    alt={profile.displayName}
                    className="w-6 h-6 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <UserIcon className="w-4 h-4 text-slate-500" />
                )}
                <span className="text-xs font-semibold text-slate-800 max-w-[100px] truncate hidden sm:inline">
                  {profile?.displayName || 'My Profile'}
                </span>
                {subscription ? (
                  <span className="text-[10px] font-bold text-[#008751] bg-[#008751]/10 px-1.5 py-0.5 rounded-sm">
                    PRO
                  </span>
                ) : null}
              </button>

              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#008751] rounded-lg hover:bg-[#007043] transition-colors whitespace-nowrap shrink-0 shadow-xs"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
