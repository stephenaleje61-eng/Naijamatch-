import React, { useState, useEffect } from 'react';
import {
  Check, Copy, CheckCircle2, ShieldCheck, Clock, AlertCircle,
  CreditCard, ArrowRight, Upload, Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { SUBSCRIPTION_PLANS, SubscriptionPlanId, PaymentSubmission } from '../../types/index.ts';

interface SubscriptionsPageProps {
  onOpenUploadProof: (planId: SubscriptionPlanId) => void;
}

export const SubscriptionsPage: React.FC<SubscriptionsPageProps> = ({
  onOpenUploadProof
}) => {
  const { token, subscription, user } = useAuth();
  const [selectedPlanId, setSelectedPlanId] = useState<SubscriptionPlanId>('monthly');
  const [copiedAccount, setCopiedAccount] = useState(false);

  const [myPayments, setMyPayments] = useState<PaymentSubmission[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(true);

  // Bank Destination (Site Owner Details)
  const BANK_DETAILS = {
    accountName: 'Stephen',
    accountNumber: '8167258121',
    bank: 'Opay'
  };

  const fetchPayments = async () => {
    if (!token) return;
    setIsLoadingPayments(true);
    try {
      const res = await fetch('/api/subscriptions/my-payments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMyPayments(data.payments || []);
      }
    } catch (e) {
      console.error('Error fetching payments:', e);
    } finally {
      setIsLoadingPayments(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [token]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const selectedPlan = SUBSCRIPTION_PLANS.find(p => p.id === selectedPlanId)!;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#008751]/10 text-[#008751] text-xs font-bold mb-3">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Transparent Membership</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Select Your NaijaMatch Plan
        </h1>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          Unlock unlimited real-time chat, see who likes you, and connect with serious singles across Nigeria.
        </p>
      </div>

      {/* Active Subscription Banner */}
      {subscription && subscription.status === 'active' && (
        <div className="mb-10 p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#008751] text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">
                  Active Subscription: {subscription.planId.toUpperCase()} Plan
                </span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#008751] text-white">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Full privileges active through{' '}
                <strong>{new Date(subscription.endDate).toLocaleDateString()}</strong>.
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenUploadProof(selectedPlanId)}
            className="px-4 py-2 rounded-xl bg-[#008751] text-white text-xs font-bold hover:bg-[#007043] transition-colors"
          >
            Extend / Renew Plan
          </button>
        </div>
      )}

      {/* 3 Subscription Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const isSelected = selectedPlanId === plan.id;
          return (
            <div
              key={plan.id}
              onClick={() => setSelectedPlanId(plan.id)}
              className={`relative rounded-3xl p-6 sm:p-8 cursor-pointer transition-all border-2 flex flex-col justify-between ${
                isSelected
                  ? 'border-[#008751] bg-white shadow-xl ring-2 ring-[#008751]/10'
                  : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 right-6 bg-[#008751] text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-full shadow-sm tracking-wider">
                  {plan.badge}
                </span>
              )}

              <div>
                <h3 className="text-lg font-black text-slate-900">{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 tabular-nums">
                    ₦{plan.priceNGN.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">
                    / {plan.durationDays} days
                  </span>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                  {plan.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
                      <Check className="w-4 h-4 text-[#008751] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlanId(plan.id);
                  }}
                  className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
                    isSelected
                      ? 'bg-[#008751] text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {isSelected ? 'Selected Plan' : 'Select Plan'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Manual Bank Transfer Payment Box */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-12">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-black text-slate-900">
              Manual Bank Transfer Instructions
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Transfer exactly <strong>₦{selectedPlan.priceNGN.toLocaleString()}</strong> for the{' '}
              <strong>{selectedPlan.name}</strong> to our verified account below.
            </p>
          </div>

          <button
            onClick={() => onOpenUploadProof(selectedPlanId)}
            className="px-6 py-3 rounded-xl bg-[#008751] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#007043] transition-colors shadow-sm flex items-center justify-center gap-2 shrink-0"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Payment Proof</span>
          </button>
        </div>

        {/* Bank Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
          <div className="p-4 rounded-2xl bg-[#F5F7F6] border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Bank
            </span>
            <p className="text-base font-bold text-slate-900 mt-1">{BANK_DETAILS.bank}</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F5F7F6] border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Account Name
            </span>
            <p className="text-base font-bold text-slate-900 mt-1">{BANK_DETAILS.accountName}</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F5F7F6] border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Account Number
              </span>
              <p className="text-base font-mono font-black text-[#008751] tracking-wider mt-1">
                {BANK_DETAILS.accountNumber}
              </p>
            </div>
            <button
              onClick={() => copyToClipboard(BANK_DETAILS.accountNumber)}
              className="p-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors"
              title="Copy account number"
            >
              {copiedAccount ? (
                <Check className="w-4 h-4 text-[#008751]" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <div className="mt-6 flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Important:</strong> After transferring, take a screenshot of your debit confirmation / receipt and click <strong>Upload Payment Proof</strong>. Subscriptions are activated immediately once an administrator verifies the transfer.
          </p>
        </div>
      </div>

      {/* Paystack Gateway Status Notice */}
      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 mb-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Paystack Card Gateway (Awaiting API Keys)
            </h4>
            <p className="text-xs text-slate-500">
              Automated Paystack debit card checkout abstraction is ready. Live keys have not been configured yet; please use manual Opay transfer.
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-200 text-slate-700">
          Awaiting Keys
        </span>
      </div>

      {/* Submission History */}
      {token && (
        <div>
          <h3 className="text-lg font-black text-slate-900 mb-4">
            My Payment Submissions History
          </h3>

          {isLoadingPayments ? (
            <p className="text-xs text-slate-400">Loading payment records...</p>
          ) : myPayments.length === 0 ? (
            <p className="text-xs text-slate-500 bg-white p-6 rounded-2xl border border-slate-200">
              No previous payment submissions found on your account.
            </p>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5">Plan</th>
                      <th className="p-3.5">Amount</th>
                      <th className="p-3.5">Reference ID</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Admin Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {myPayments.map((p) => (
                      <tr key={p.id}>
                        <td className="p-3.5 tabular-nums">{p.paymentDate}</td>
                        <td className="p-3.5 capitalize font-bold">{p.planId}</td>
                        <td className="p-3.5 tabular-nums font-bold">₦{p.amountNGN.toLocaleString()}</td>
                        <td className="p-3.5 font-mono text-[11px] text-slate-500">{p.transactionReference}</td>
                        <td className="p-3.5">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              p.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : p.status === 'rejected'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-500">
                          {p.rejectionReason || (p.status === 'approved' ? 'Verified by Admin' : 'In review')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
