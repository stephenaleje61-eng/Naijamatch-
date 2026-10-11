import React from 'react';
import { ArrowRight, ShieldCheck, MapPin, Users, Heart, MessageSquare } from 'lucide-react';
import { NigerianFlag } from '../common/NigerianFlag.tsx';

interface WelcomeLandingProps {
  onGetStarted: () => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onSelectTab: (tab: string) => void;
}

export const WelcomeLanding: React.FC<WelcomeLandingProps> = ({
  onGetStarted,
  onOpenLogin,
  onOpenRegister,
  onSelectTab
}) => {
  return (
    <div className="min-h-screen bg-[#F5F7F6]">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-6">
            {/* LARGE NIGERIAN FLAG - Main Visual Feature */}
            <div className="w-full max-w-xl mx-auto mb-2 animate-fadeIn">
              <NigerianFlag variant="hero" />
            </div>

            {/* Platform Branding & Slogan */}
            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
                Welcome to <span className="text-[#008751]">NaijaMatch</span>
              </h1>

              <p className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
                Find Love. Find Your Person.
              </p>

              <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
                Nigeria's trusted dating community and live public chatroom. Connect with authentic singles across Lagos, Abuja, Port Harcourt, and all 36 states.
              </p>
            </div>

            {/* Primary Action Button: Clear Green Get Started Button */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 w-full sm:w-auto">
              <button
                onClick={onGetStarted}
                className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-[#008751] text-white text-base font-bold shadow-xl shadow-[#008751]/25 hover:bg-[#007043] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5"
              >
                <span>Get Started</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 text-sm text-slate-600 font-semibold">
                <button
                  onClick={onOpenLogin}
                  className="hover:text-[#008751] transition-colors py-2 px-3 underline underline-offset-4"
                >
                  Log In
                </button>
                <span className="text-slate-300">·</span>
                <button
                  onClick={onOpenRegister}
                  className="hover:text-[#008751] transition-colors py-2 px-3 underline underline-offset-4"
                >
                  Register
                </button>
              </div>
            </div>

            {/* Quick Live Public Chat Callout */}
            <div className="pt-2">
              <button
                onClick={() => onSelectTab('public-chat')}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white border-2 border-[#008751]/30 hover:border-[#008751] text-sm font-bold text-slate-800 hover:text-[#008751] shadow-md shadow-[#008751]/10 hover:shadow-lg transition-all group"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#008751] animate-pulse" />
                <MessageSquare className="w-4 h-4 text-[#008751] group-hover:scale-110 transition-transform" />
                <span>Enter Live Public Chatroom 🇳🇬 (Chat & Reply Free)</span>
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-200/80 w-full max-w-lg">
              <div>
                <p className="text-xl font-black text-slate-900 tabular-nums">100%</p>
                <p className="text-xs text-slate-500">Verified Adults (18+)</p>
              </div>
              <div>
                <p className="text-xl font-black text-slate-900 tabular-nums">36 + FCT</p>
                <p className="text-xs text-slate-500">All Nigerian States</p>
              </div>
              <div>
                <p className="text-xl font-black text-slate-900 tabular-nums">Real-Time</p>
                <p className="text-xs text-slate-500">Public & Private Chat</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Proudly Built for Nigeria
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              A dignified, respectful space designed to help genuine Nigerian singles find lasting love and real companions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-[#F5F7F6] border border-slate-200/80 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#008751]/10 flex items-center justify-center text-[#008751]">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Live Public Chatroom</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Connect and chat live with other verified Nigerian singles in real-time. Discuss dating, relationship topics, or reply directly to comments.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F5F7F6] border border-slate-200/80 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#008751]/10 flex items-center justify-center text-[#008751]">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">All 36 States + Abuja</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Whether you live in Lagos, Abuja, Ibadan, Port Harcourt, Enugu, or Kano, find compatible singles who share your cultural values and life goals.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F5F7F6] border border-slate-200/80 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#008751]/10 flex items-center justify-center text-[#008751]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Safe & Authenticated</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Strict 18+ requirement with email verification, safety moderation, and encrypted messaging to protect your privacy and peace of mind.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
