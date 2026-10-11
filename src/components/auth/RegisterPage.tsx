import React, { useState } from 'react';
import {
  ShieldCheck, Mail, Lock, Calendar, Eye, EyeOff,
  AlertCircle, CheckCircle2, User, Globe, Upload, ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { NigerianFlag } from '../common/NigerianFlag.tsx';
import { Gender } from '../../types/index.ts';

interface RegisterPageProps {
  onOpenLogin: () => void;
  onSuccess: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onOpenLogin, onSuccess }) => {
  const { login } = useAuth();

  const [step, setStep] = useState<'form' | 'otp'>('form');

  // Registration Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gender, setGender] = useState<Gender>('Woman');
  const [country, setCountry] = useState('Nigeria');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [is18OrOlder, setIs18OrOlder] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // OTP State
  const [otpCode, setOtpCode] = useState('');
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Handle Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Profile photo must be under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      setPhotoUrl(b64);
      setPhotoPreview(b64);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  // Age Calculator
  const getAge = (dob: string): number => {
    if (!dob) return 0;
    const birth = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setDevOtpHint(null);

    if (!fullName || fullName.trim().length < 2) {
      setError('Please enter your full name (minimum 2 characters).');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const age = getAge(dateOfBirth);
    if (!dateOfBirth || isNaN(age) || age < 18) {
      setError('You must be at least 18 years old to join NaijaMatch.');
      return;
    }

    if (!is18OrOlder) {
      setError('You must confirm that you are 18 years of age or older.');
      return;
    }

    if (!acceptTerms) {
      setError('You must accept the Terms of Service and Privacy Policy to continue.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          password,
          confirmPassword,
          gender,
          country,
          photoUrl: photoUrl || photoPreview,
          dateOfBirth,
          is18OrOlder,
          acceptTerms
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed.');

      setInfo(data.message || 'OTP sent! Please check your email inbox.');
      if (data.devOtp) {
        setDevOtpHint(data.devOtp);
      }
      setStep('otp');
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otpCode })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');

      login(data.token, data.user, data.profile, data.subscription);
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not resend code');

      setInfo('A new OTP has been dispatched.');
      if (data.devOtp) setDevOtpHint(data.devOtp);
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7F6] py-8 sm:py-12 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-6">
        {/* LARGE NIGERIAN FLAG ABOVE REGISTRATION FORM */}
        <div className="w-full text-center space-y-3">
          <div className="max-w-md mx-auto">
            <NigerianFlag variant="hero" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Join <span className="text-[#008751]">NaijaMatch</span>
            </h1>
            <p className="text-sm font-semibold text-slate-700">
              Find Love. Find Your Person.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Create your account to start meeting genuine singles across Nigeria.
            </p>
          </div>
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl">
          {/* Alerts */}
          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-red-50 p-3.5 text-xs text-red-800 border border-red-200 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {info && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-emerald-50 p-3.5 text-xs text-emerald-800 border border-emerald-200 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#008751] mt-0.5" />
              <span>{info}</span>
            </div>
          )}

          {devOtpHint && (
            <div className="mb-4 p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
              <div>
                <span className="font-bold">Test OTP Code: </span>
                <span className="font-mono text-sm tracking-widest font-black text-amber-800">
                  {devOtpHint}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOtpCode(devOtpHint)}
                className="text-xs font-bold uppercase text-[#008751] underline"
              >
                Auto-fill
              </button>
            </div>
          )}

          {step === 'form' ? (
            <form onSubmit={handleRegister} className="space-y-4">
              {/* 1. Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="e.g. Babajide Adeleke"
                    className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-300 text-sm focus:border-[#008751] focus:ring-1 focus:ring-[#008751] outline-hidden"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              {/* 2. Email Address */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@example.com"
                    className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-300 text-sm focus:border-[#008751] focus:ring-1 focus:ring-[#008751] outline-hidden"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              {/* 3. Gender & Country Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-300 text-sm focus:border-[#008751] outline-hidden bg-white"
                  >
                    <option value="Woman">Woman</option>
                    <option value="Man">Man</option>
                    <option value="Non-binary">Non-binary</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Country (Default Nigeria) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full h-11 pl-9 pr-3 rounded-xl border border-slate-300 text-sm focus:border-[#008751] outline-hidden bg-white"
                    >
                      <option value="Nigeria">Nigeria 🇳🇬</option>
                      <option value="Ghana">Ghana 🇬🇭</option>
                      <option value="United Kingdom">United Kingdom 🇬🇧</option>
                      <option value="United States">United States 🇺🇸</option>
                      <option value="Canada">Canada 🇨🇦</option>
                      <option value="Other">Other Country</option>
                    </select>
                    <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  </div>
                </div>
              </div>

              {/* 4. Date of Birth (Must be 18+) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Date of Birth <span className="text-red-500">*</span> (Strictly 18+)
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    required
                    max="2008-01-01"
                    className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-300 text-sm focus:border-[#008751] focus:ring-1 focus:ring-[#008751] outline-hidden"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  You must be at least 18 years of age to register on NaijaMatch.
                </p>
              </div>

              {/* 5. Profile Photo Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Profile Photo (JPG / PNG under 5MB)
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 h-12 border-2 border-dashed border-slate-300 hover:border-[#008751] rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors text-xs font-semibold text-slate-600 bg-slate-50/50 hover:bg-emerald-50/30">
                    <Upload className="w-4 h-4 text-[#008751]" />
                    <span>{photoPreview ? 'Change Photo' : 'Upload Genuine Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                  {photoPreview && (
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-300 shrink-0 bg-slate-100 shadow-xs">
                      <img
                        src={photoPreview}
                        alt="Profile preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 6. Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      placeholder="Min 8 characters"
                      className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-300 text-sm focus:border-[#008751] focus:ring-1 focus:ring-[#008751] outline-hidden"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Re-enter password"
                      className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-300 text-sm focus:border-[#008751] focus:ring-1 focus:ring-[#008751] outline-hidden"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>
              </div>

              {/* 7. Confirm 18+ Checkbox */}
              <label className="flex items-start gap-2.5 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={is18OrOlder}
                  onChange={(e) => setIs18OrOlder(e.target.checked)}
                  required
                  className="mt-0.5 rounded border-slate-300 text-[#008751] focus:ring-[#008751]"
                />
                <span className="text-xs text-slate-700 leading-tight">
                  I solemnly confirm that I am <strong>18 years of age or older</strong>.
                </span>
              </label>

              {/* 8. Terms of Service Checkbox */}
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  required
                  className="mt-0.5 rounded border-slate-300 text-[#008751] focus:ring-[#008751]"
                />
                <span className="text-xs text-slate-700 leading-tight">
                  I accept the <a href="/terms" className="text-[#008751] underline">Terms of Service</a> and <a href="/privacy" className="text-[#008751] underline">Privacy Policy</a>.
                </span>
              </label>

              {/* 9. Create Account Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-2xl bg-[#008751] text-white text-sm font-bold uppercase tracking-wider hover:bg-[#007043] active:scale-[0.99] transition-all shadow-md shadow-[#008751]/20 disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span>Creating Account...</span>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Login link for existing users */}
              <div className="text-center pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-500">Already have an account? </span>
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="text-xs font-bold text-[#008751] hover:underline"
                >
                  Log In here
                </button>
              </div>
            </form>
          ) : (
            /* OTP Verification Step */
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center space-y-2 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#008751] flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  Verify Your Email
                </h3>
                <p className="text-xs text-slate-600">
                  We've sent a 6-digit confirmation code to <strong>{email}</strong>.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  6-Digit OTP Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  required
                  placeholder="123456"
                  className="w-full h-12 text-center text-xl font-mono tracking-widest rounded-xl border border-slate-300 focus:border-[#008751] focus:ring-1 focus:ring-[#008751] outline-hidden"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || otpCode.length < 6}
                className="w-full h-12 rounded-2xl bg-[#008751] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#007043] transition-colors shadow-xs disabled:opacity-50"
              >
                {isLoading ? 'Verifying OTP...' : 'Verify & Complete Registration'}
              </button>

              <div className="flex items-center justify-between text-xs pt-2">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || isLoading}
                  className="text-[#008751] hover:underline disabled:text-slate-400"
                >
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="text-slate-500 hover:text-slate-800"
                >
                  Change details
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
