'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { 
  X, 
  Phone, 
  Mail, 
  ShieldCheck, 
  ArrowRight, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2,
  Lock,
  Building,
  Store
} from 'lucide-react';

interface OtpModalProps {
  defaultRole?: 'builder' | 'vendor';
  onClose: () => void;
  onSuccess?: () => void;
}

export function OtpModal({ defaultRole = 'builder', onClose, onSuccess }: OtpModalProps) {
  const { refreshUser } = useAuth();
  const [role, setRole] = useState<'builder' | 'vendor'>(defaultRole);
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [type, setType] = useState<'phone' | 'email'>('phone');
  
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // OTP Timer & Dev OTP
  const [countdown, setCountdown] = useState(0);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await api.sendOtp(identifier, type, role);
      setSuccessMsg(res.message);
      setCountdown(res.expiresInSeconds || 300);
      if (res.devOtp) {
        setDevOtp(res.devOtp);
      }
      setStep('verify');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.verifyOtp(identifier, otp, type, role);
      await refreshUser();
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2 text-amber-400 text-xs uppercase font-extrabold tracking-wider mb-1">
            <Lock className="w-3.5 h-3.5" />
            <span>Secure Two-Factor Gateway</span>
          </div>
          <h2 className="text-xl font-bold">
            {step === 'request' ? 'Sign In / Register' : 'Verify 6-Digit OTP'}
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            {role === 'builder'
              ? 'Builder Portal - Instant SMS Verification'
              : 'Vendor Portal - Dual Phone & Email Verification'}
          </p>

          {/* Role selector tabs */}
          {step === 'request' && (
            <div className="mt-4 grid grid-cols-2 gap-2 bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setRole('builder');
                  setType('phone');
                  setIdentifier('');
                }}
                className={`flex items-center justify-center space-x-1.5 py-2 rounded-lg text-xs font-bold transition ${
                  role === 'builder'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>Builder (Buyer)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setRole('vendor');
                  setType('phone');
                  setIdentifier('');
                }}
                className={`flex items-center justify-center space-x-1.5 py-2 rounded-lg text-xs font-bold transition ${
                  role === 'vendor'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Vendor (Seller)</span>
              </button>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Development Mode Helper Banner */}
          {devOtp && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-300 text-amber-900 text-xs rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <div>
                  <span className="font-bold">Test OTP Generated: </span>
                  <span className="font-mono text-sm font-black text-amber-700 ml-1">{devOtp}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOtp(devOtp)}
                className="px-2 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded font-bold text-[11px] transition"
              >
                Auto Fill
              </button>
            </div>
          )}

          {step === 'request' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              {role === 'vendor' && (
                <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
                  <button
                    type="button"
                    onClick={() => setType('phone')}
                    className={`flex-1 py-1.5 font-medium rounded-md text-center transition ${
                      type === 'phone' ? 'bg-white shadow-sm text-slate-900 font-bold' : 'text-slate-500'
                    }`}
                  >
                    Phone (SMS OTP)
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('email')}
                    className={`flex-1 py-1.5 font-medium rounded-md text-center transition ${
                      type === 'email' ? 'bg-white shadow-sm text-slate-900 font-bold' : 'text-slate-500'
                    }`}
                  >
                    Business Email OTP
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {type === 'phone' ? 'Mobile Phone Number' : 'Corporate Email Address'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    {type === 'phone' ? <Phone className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                  </div>
                  <input
                    type={type === 'phone' ? 'tel' : 'email'}
                    required
                    placeholder={type === 'phone' ? 'e.g. 9876543210' : 'e.g. contact@business.com'}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {type === 'phone'
                    ? '10-digit Indian mobile number. 6-digit OTP will be generated.'
                    : 'Official company domain email for vendor KYC dual-verification.'}
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !identifier.trim()}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold rounded-xl text-sm flex items-center justify-center space-x-2 transition shadow-md"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Enter 6-Digit Code sent to <span className="text-slate-900 font-bold">{identifier}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setStep('request')}
                    className="text-[11px] text-amber-600 hover:underline font-semibold"
                  >
                    Change
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="• • • • • •"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full py-3 text-center tracking-[0.5em] font-mono text-2xl font-black bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
                />
              </div>

              {/* Timer and Cooldown info */}
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Expires in: <strong className="text-slate-800 font-mono">{formatSeconds(countdown)}</strong></span>
                {countdown === 0 ? (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="text-amber-600 font-bold hover:underline"
                  >
                    Resend Code
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-400">Max 3 attempts per OTP</span>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-300 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center space-x-2 transition shadow-md"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify & Continue</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
