import React from 'react';
import { ShieldCheck, Lock, AlertTriangle, HelpCircle, FileText, ArrowLeft } from 'lucide-react';

interface LegalPageProps {
  page: 'safety' | 'terms' | 'privacy' | 'guidelines' | 'refund-policy' | 'contact';
  onBack: () => void;
}

export const LegalPages: React.FC<LegalPageProps> = ({ page, onBack }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 mb-6 py-1 px-2 rounded-lg hover:bg-slate-100 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Platform</span>
      </button>

      {/* DATING SAFETY TIPS */}
      {page === 'safety' && (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xs space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-[#008751]/10 text-[#008751] flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            NaijaMatch Dating Safety Tips
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Your safety and emotional well-being are paramount. While NaijaMatch verifies member emails and screens profiles, you should always observe these essential precautions when dating in Nigeria:
          </p>

          <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <h3 className="font-bold text-slate-900 mb-1">1. Keep Financial Matters Completely Separate</h3>
              <p>Never send money, airtime, gift cards, or cryptocurrency to anyone you have only met online, no matter how convincing or emotional the reason sounds. Report any member asking for financial assistance immediately.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <h3 className="font-bold text-slate-900 mb-1">2. First Dates Must Be in Busy Public Spaces</h3>
              <p>Always arrange first and second dates in reputable public venues with high foot traffic (e.g. established restaurants, cafés, shopping mall cinemas in Lagos, Abuja, Port Harcourt, or Ibadan). Never agree to meet in private homes, hotel rooms, or secluded locations on early dates.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <h3 className="font-bold text-slate-900 mb-1">3. Inform Friends or Family and Share Live Location</h3>
              <p>Always tell a trusted friend or sibling where you are going, who you are meeting, and what time you expect to return. Consider sharing your live WhatsApp location with them during the outing.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <h3 className="font-bold text-slate-900 mb-1">4. Control Your Own Transportation</h3>
              <p>Always arrange your own transportation to and from the venue using your personal vehicle or a verified ride-hailing app (Uber, Bolt). Do not let your date pick you up from your private home address on your first date.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <h3 className="font-bold text-slate-900 mb-1">5. Protect Personal Identifiable Information</h3>
              <p>Do not share your home address, workplace specifics, BVN, NIN, credit card photos, or bank details with strangers. Chat inside NaijaMatch until you have established sufficient mutual trust.</p>
            </div>
          </div>
        </div>
      )}

      {/* TERMS AND CONDITIONS */}
      {page === 'terms' && (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xs space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Terms of Service & User Agreement
          </h1>
          <p className="text-xs text-slate-400">Effective Date: October 2026</p>

          <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
            <h3 className="text-sm font-bold text-slate-900">1. Eligibility (Strictly 18+)</h3>
            <p>You must be at least eighteen (18) years of age to register or use NaijaMatch. By creating an account, you legally represent and warrant that you meet this requirement. Any account discovered to belong to a minor will be permanently banned and data purged.</p>

            <h3 className="text-sm font-bold text-slate-900">2. Code of Conduct & Prohibited Activities</h3>
            <p>Members agree to maintain respectful conduct. Prohibited activities include: harassment, hate speech, posting sexually explicit or pornographic photos, impersonation, commercial sex work solicitation, extortion, and fraudulent financial requests.</p>

            <h3 className="text-sm font-bold text-slate-900">3. Subscriptions & Payment</h3>
            <p>Paid membership features (such as real-time chat and revealed likes) require an active subscription. Manual bank transfers to our official Opay account (Stephen - 8167258121) are activated following administrative review.</p>

            <h3 className="text-sm font-bold text-slate-900">4. Account Termination</h3>
            <p>NaijaMatch reserves the right to suspend or terminate accounts that violate community safety standards or state/federal laws in Nigeria without prior notice.</p>
          </div>
        </div>
      )}

      {/* PRIVACY POLICY */}
      {page === 'privacy' && (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xs space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-[#008751]/10 text-[#008751] flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Privacy Policy (NDPR Compliant)
          </h1>
          <p className="text-xs text-slate-400">Nigeria Data Protection Regulation Alignment</p>

          <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
            <h3 className="text-sm font-bold text-slate-900">1. Information We Collect</h3>
            <p>We collect registration data (email, date of birth, hashed passwords) and dating profile information (photos, display name, Nigerian state, city, interests, bio). We do NOT collect or expose your precise GPS coordinates, BVN, or credit card passwords.</p>

            <h3 className="text-sm font-bold text-slate-900">2. How Information is Used</h3>
            <p>Your profile information is used exclusively to facilitate discovery and match compatibility. Payment proof screenshots are restricted strictly to authorized platform administrators and are never shared publicly.</p>

            <h3 className="text-sm font-bold text-slate-900">3. Data Subject Rights & Deletion</h3>
            <p>Under the NDPR, you possess the right to access, rectify, or request complete erasure of your account and personal records. You can request deletion at any time by contacting support.</p>
          </div>
        </div>
      )}

      {/* COMMUNITY GUIDELINES */}
      {page === 'guidelines' && (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xs space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            NaijaMatch Community Guidelines
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            NaijaMatch is a platform built on mutual respect, Nigerian warmth, and authenticity. We operate a zero-tolerance policy against malicious behavior.
          </p>

          <ul className="space-y-3 text-xs text-slate-700 list-disc list-inside">
            <li><strong>Be Genuine:</strong> Use recent, clear photos of yourself. Do not impersonate celebrities or public figures.</li>
            <li><strong>No Catfishing:</strong> Misrepresenting your age or identity is prohibited.</li>
            <li><strong>Respect Consent & Boundaries:</strong> If someone declines a conversation or unlike request, respect their decision gracefully.</li>
            <li><strong>Zero Commercial Spam:</strong> Do not use messaging to advertise unauthorized pyramid schemes, crypto investments, or mass services.</li>
          </ul>
        </div>
      )}

      {/* REFUND POLICY */}
      {page === 'refund-policy' && (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xs space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Subscription & Refund Policy
          </h1>
          <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
            <p>NaijaMatch subscriptions grant immediate access to real-time chat, revealed likes, and priority discovery across Nigeria. Subscriptions purchased via manual bank transfer are activated following administrative review.</p>
            <p>Due to the immediate provisioning of digital dating services, subscriptions that have been reviewed, approved, and activated are non-refundable, except where required by Nigerian consumer protection laws in cases of verified technical system failure.</p>
          </div>
        </div>
      )}

      {/* CONTACT AND SUPPORT */}
      {page === 'contact' && (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xs space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-[#008751]/10 text-[#008751] flex items-center justify-center">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Contact & Support
          </h1>
          <p className="text-sm text-slate-600">
            Have questions about manual bank transfers, profile verification, or technical assistance? Our support team is here to assist.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-900 block mb-1">Email Support</span>
              <span className="text-slate-600">support@naijamatch.ng</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-900 block mb-1">Manual Transfer Queries</span>
              <span className="text-slate-600">Opay 8167258121 (Stephen)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
