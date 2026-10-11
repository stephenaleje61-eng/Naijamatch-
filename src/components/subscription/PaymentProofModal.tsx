import React, { useState } from 'react';
import { X, Upload, CheckCircle2, AlertCircle, Copy, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { SUBSCRIPTION_PLANS, SubscriptionPlanId } from '../../types/index.ts';

interface PaymentProofModalProps {
  isOpen: boolean;
  initialPlanId?: SubscriptionPlanId;
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentProofModal: React.FC<PaymentProofModalProps> = ({
  isOpen,
  initialPlanId = 'monthly',
  onClose,
  onSuccess
}) => {
  const { token } = useAuth();
  const [planId, setPlanId] = useState<SubscriptionPlanId>(initialPlanId);
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [transactionReference, setTransactionReference] = useState('');
  const [proofScreenshotUrl, setProofScreenshotUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const selectedPlan = SUBSCRIPTION_PLANS.find(p => p.id === planId)!;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setError('Proof screenshot size must be under 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      setProofScreenshotUrl(b64);
      setImagePreview(b64);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!transactionReference.trim()) {
      setError('Please provide the transaction reference ID from your transfer.');
      return;
    }

    if (!proofScreenshotUrl) {
      setError('Please attach a screenshot of your bank transfer proof.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/subscriptions/submit-proof', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          planId,
          amountNGN: selectedPlan.priceNGN,
          paymentDate,
          transactionReference: transactionReference.trim(),
          proofScreenshotUrl
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit payment proof');

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 sm:p-8 shadow-2xl my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-[#008751]">
            Manual Bank Transfer
          </span>
          <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1">
            Upload Payment Proof
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Submit your transfer screenshot for administrator verification and instant activation.
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-red-50 p-3 text-xs text-red-800 border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-[#008751] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Proof Submitted Successfully!</h3>
            <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
              Your transfer evidence has been submitted. Our administrators will review the record against our Opay account (Stephen - 8167258121) and activate your subscription shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Plan Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Selected Subscription Plan
              </label>
              <select
                value={planId}
                onChange={(e) => setPlanId(e.target.value as SubscriptionPlanId)}
                className="w-full h-11 px-3 rounded-xl border border-slate-300 text-sm focus:border-[#008751] outline-hidden bg-white"
              >
                {SUBSCRIPTION_PLANS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — ₦{p.priceNGN.toLocaleString()} ({p.durationDays} days)
                  </option>
                ))}
              </select>
            </div>

            {/* Amount Due (Read Only) */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-600">Exact Amount Paid:</span>
              <span className="text-base font-black text-slate-900 font-mono">
                ₦{selectedPlan.priceNGN.toLocaleString()}
              </span>
            </div>

            {/* Payment Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date of Transfer
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
                className="w-full h-11 px-3 rounded-xl border border-slate-300 text-sm focus:border-[#008751] outline-hidden"
              />
            </div>

            {/* Transaction Reference / Session ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Transaction Reference / Session ID
              </label>
              <input
                type="text"
                value={transactionReference}
                onChange={(e) => setTransactionReference(e.target.value)}
                required
                placeholder="e.g. OPAY_TXN_9823412301"
                className="w-full h-11 px-3 rounded-xl border border-slate-300 text-sm font-mono focus:border-[#008751] outline-hidden"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Enter the reference number or session ID displayed on your debit receipt.
              </p>
            </div>

            {/* Screenshot Upload */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Proof Screenshot
              </label>
              <label className="border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-[#008751] hover:bg-emerald-50/20 transition-colors">
                <Upload className="w-6 h-6 text-slate-400 mb-2" />
                <span className="text-xs font-semibold text-slate-700">
                  Click to select screenshot (PNG, JPG)
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">Maximum file size: 8MB</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {imagePreview && (
                <div className="mt-2 relative rounded-xl overflow-hidden border border-slate-200 aspect-16/9 bg-slate-900">
                  <img
                    src={imagePreview}
                    alt="Proof preview"
                    className="w-full h-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setProofScreenshotUrl('');
                      setImagePreview(null);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !proofScreenshotUrl}
              className="w-full h-12 rounded-xl bg-[#008751] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#007043] transition-colors shadow-sm disabled:opacity-50 mt-2"
            >
              {isLoading ? 'Submitting Proof...' : 'Submit Payment Proof'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
