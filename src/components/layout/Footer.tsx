import React from 'react';
import { Heart, ShieldCheck } from 'lucide-react';

interface FooterProps {
  onSelectTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTab }) => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-20 pb-20 md:pb-12 text-slate-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Col */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#008751] flex items-center justify-center text-white">
                <Heart className="w-3.5 h-3.5 fill-white" />
              </div>
              <span className="text-lg font-black tracking-tight text-slate-900">
                NaijaMatch
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Find Love. Find Your Person. The premier, trusted dating platform connecting genuine singles across all 36 Nigerian states and Abuja.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
              <ShieldCheck className="w-4 h-4 text-[#008751]" />
              <span>Strictly 18+ · NDPR Compliant</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Explore
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onSelectTab('discover')}
                  className="hover:text-[#008751] transition-colors"
                >
                  Discover Matches
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('subscriptions')}
                  className="hover:text-[#008751] transition-colors"
                >
                  Membership Plans
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('marketplace')}
                  className="hover:text-[#008751] transition-colors"
                >
                  Date Ideas & Gifts Market
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('subscriptions')}
                  className="hover:text-[#008751] transition-colors"
                >
                  Manual Bank Transfer (Opay)
                </button>
              </li>
            </ul>
          </div>

          {/* Safety & Trust */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Safety & Support
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onSelectTab('safety')}
                  className="hover:text-[#008751] transition-colors"
                >
                  Dating Safety Tips
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('guidelines')}
                  className="hover:text-[#008751] transition-colors"
                >
                  Community Guidelines
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('refund-policy')}
                  className="hover:text-[#008751] transition-colors"
                >
                  Subscription & Refund Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('contact')}
                  className="hover:text-[#008751] transition-colors"
                >
                  Contact & Support Team
                </button>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Legal & Verification
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onSelectTab('terms')}
                  className="hover:text-[#008751] transition-colors"
                >
                  Terms and Conditions
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('privacy')}
                  className="hover:text-[#008751] transition-colors"
                >
                  Privacy Policy (NDPR)
                </button>
              </li>
              <li>
                <span className="text-slate-400">
                  Manual Bank Transfer: Opay 8167258121 (Stephen)
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} NaijaMatch. All rights reserved. Made for love in Nigeria.</p>
          <div className="flex items-center gap-4">
            <span>Lagos</span>
            <span>·</span>
            <span>Abuja</span>
            <span>·</span>
            <span>Port Harcourt</span>
            <span>·</span>
            <span>36 States & FCT</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
