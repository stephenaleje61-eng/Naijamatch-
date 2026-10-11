import React, { useState } from 'react';
import { X, ShieldCheck, Mail, Lock, Calendar, Eye, EyeOff, AlertCircle, CheckCircle2, User, Globe, Upload } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { NigerianFlag } from '../common/NigerianFlag.tsx';
import { Gender } from '../../types/index.ts';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'register';
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  onSuccess
}) => {
  const { login } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'otp' | 'forgot' | 'reset'>(initialMode);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gender, setGender] = useState<Gender>('Woman');
  const [country, setCountry] = useState('Nigeria');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [is18OrOlder, setIs18OrOlder] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // UI helpers
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  if (!isOpen) return null;

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setDevOtpHint(null);

    if (!fullName || fullName.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }

    if (!is18OrOlder) {
      setError('You must confirm that you are 18 years of age or older.');
      return;
    }

    if (!acceptTerms) {
      setError('You must accept the Terms and Privacy Policy to continue.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email,
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
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      setInfo(data.message);
      if (data.devOtp) {
        setDevOtpHint(data.devOtp);
      }
      setMode('otp');
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message);
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
      onClose();
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      login(data.token, data.user, data.profile, data.subscription);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch reset code');

      setInfo(data.message);
      if (data.devOtp) setDevOtpHint(data.devOtp);
      setMode('reset');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otpCode, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed');

      setInfo(data.message);
      setMode('login');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 sm:p-8 shadow-2xl my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#008751]">
              NaijaMatch
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            {mode === 'login' && 'Sign In to Your Account'}
            {mode === 'register' && 'Join NaijaMatch'}
            {mode === 'otp' && 'Verify Your Email OTP'}
            {mode === 'forgot' && 'Reset Your Password'}
            {mode === 'reset' && 'Create New Password'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {mode === 'login' && 'Welcome back! Enter your details to continue.'}
            {mode === 'register' && 'Strictly 18+. Enter your email to begin.'}
            {mode === 'otp' && `Enter the 6-digit code sent to ${email}.`}
            {mode === 'forgot' && 'Enter your email to receive an authorization code.'}
            {mode === 'reset' && 'Enter the OTP code along with your new password.'}
          </p>
        </div>

        {/* Feedback alerts */}
        {error && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-red-50 p-3 text-xs text-red-800 border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {info && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#008751] mt-0.5" />
            <span>{info}</span>
          </div>
        )}

        {/* Development test OTP helper badge */}
        {devOtpHint && (
          <div className="mb-4 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
            <div>
              <span className="font-bold">Test OTP Code: </span>
              <span className="font-mono text-sm tracking-widest font-black text-amber-700">
                {devOtpHint}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOtpCode(devOtpHint)}
              className="text-[10px] font-bold uppercase text-[#008751] underline"
            >
              Auto-fill
            </button>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
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

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-xs text-[#008751] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-300 text-sm focus:border-[#008751] focus:ring-1 focus:ring-[#008751] outline-hidden"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-xl bg-[#008751] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#007043] transition-colors shadow-xs disabled:opacity-50"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>

            <div className="text-center pt-2">
              <span className="text-xs text-slate-500">Don’t have an account yet? </span>
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-xs font-bold text-[#008751] hover:underline"
              >
                Register free
              </button>
            </div>
          </form>
        )}

        {/* REGISTER FORM */}
        {mode === 'register' && (
          <div className="space-y-4">
            {/* Prominent Nigerian Flag Banner above registration form */}
            <div className="rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs mb-2">
              <NigerianFlag variant="banner" className="h-14 sm:h-16" />
            </div>

            <form onSubmit={handleRegister} className="space-y-3.5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
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

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="your.email@example.com"
                    className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-300 text-sm focus:border-[#008751] focus:ring-1 focus:ring-[#008751] outline-hidden"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              {/* Gender & Country Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gender
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Country
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

              {/* Date of Birth */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date of Birth (Must be 18+)
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
              </div>

              {/* Profile Photo Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Profile Photo
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 h-11 border-2 border-dashed border-slate-300 hover:border-[#008751] rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors text-xs text-slate-600 bg-slate-50/50 hover:bg-emerald-50/30">
                    <Upload className="w-4 h-4 text-[#008751]" />
                    <span>{photoPreview ? 'Change Photo' : 'Upload Photo (JPG/PNG)'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                  {photoPreview && (
                    <div className="w-11 h-11 rounded-xl overflow-hidden border border-slate-300 shrink-0 bg-slate-100">
                      <img
                        src={photoPreview}
                        alt="Profile preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password (min 8 chars)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="Create secure password"
                    className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-300 text-sm focus:border-[#008751] focus:ring-1 focus:ring-[#008751] outline-hidden"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Repeat your password"
                    className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-300 text-sm focus:border-[#008751] focus:ring-1 focus:ring-[#008751] outline-hidden"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              {/* 18+ Checkbox */}
              <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={is18OrOlder}
                  onChange={(e) => setIs18OrOlder(e.target.checked)}
                  required
                  className="mt-0.5 rounded border-slate-300 text-[#008751] focus:ring-[#008751]"
                />
                <span className="text-xs text-slate-600 leading-tight">
                  I strictly confirm that I am <strong>18 years of age or older</strong>.
                </span>
              </label>

              {/* Terms Checkbox */}
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  required
                  className="mt-0.5 rounded border-slate-300 text-[#008751] focus:ring-[#008751]"
                />
                <span className="text-xs text-slate-600 leading-tight">
                  I accept the <a href="/terms" className="text-[#008751] underline">Terms of Service</a> and <a href="/privacy" className="text-[#008751] underline">Privacy Policy</a>.
                </span>
              </label>

              {/* Create Account Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-xl bg-[#008751] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#007043] transition-colors shadow-sm disabled:opacity-50 mt-2"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>

              {/* Login Link for Existing Users */}
              <div className="text-center pt-1">
                <span className="text-xs text-slate-500">Already registered? </span>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs font-bold text-[#008751] hover:underline"
                >
                  Log In
                </button>
              </div>
            </form>
          </div>
        )}

        {/* OTP VERIFICATION FORM */}
        {mode === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                6-Digit Verification Code
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
              className="w-full h-11 rounded-xl bg-[#008751] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#007043] transition-colors shadow-xs disabled:opacity-50"
            >
              {isLoading ? 'Verifying...' : 'Verify Email & Proceed'}
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
                onClick={() => setMode('register')}
                className="text-slate-500 hover:text-slate-800"
              >
                Change email
              </button>
            </div>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Enter Registered Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your.email@example.com"
                  className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-300 text-sm focus:border-[#008751] focus:ring-1 focus:ring-[#008751] outline-hidden"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-xl bg-[#008751] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#007043] transition-colors shadow-xs disabled:opacity-50"
            >
              {isLoading ? 'Sending...' : 'Send Reset OTP'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-xs text-slate-600 hover:underline"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* RESET PASSWORD FORM */}
        {mode === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                6-Digit Reset Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                required
                placeholder="123456"
                className="w-full h-11 text-center font-mono tracking-widest rounded-xl border border-slate-300 text-sm focus:border-[#008751] focus:ring-1 focus:ring-[#008751] outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                New Password (min 8 characters)
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                placeholder="••••••••"
                className="w-full h-11 px-3 rounded-xl border border-slate-300 text-sm focus:border-[#008751] focus:ring-1 focus:ring-[#008751] outline-hidden"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-xl bg-[#008751] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#007043] transition-colors shadow-xs disabled:opacity-50"
            >
              {isLoading ? 'Updating...' : 'Set New Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
