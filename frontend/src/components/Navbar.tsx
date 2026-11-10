'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, 
  Store, 
  PlusCircle, 
  Layers, 
  Compass, 
  History, 
  UserCheck, 
  LogOut, 
  LogIn, 
  ChevronDown,
  Sparkles,
  MapPin
} from 'lucide-react';
import { OtpModal } from './OtpModal';

export function Navbar() {
  const { user, logout, switchPersona } = useAuth();
  const pathname = usePathname();
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpRole, setOtpRole] = useState<'builder' | 'vendor'>('builder');
  const [showDemoMenu, setShowDemoMenu] = useState(false);

  const isBuilder = user?.role === 'builder';
  const isVendor = user?.role === 'vendor';

  const openAuth = (role: 'builder' | 'vendor') => {
    setOtpRole(role);
    setShowOtpModal(true);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Tagline */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <Building2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight flex items-center gap-1.5">
                  WARE STORE
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-400"></span>
                </span>
                <span className="text-[10px] tracking-wider uppercase text-slate-400 font-medium">
                  Where Trust Builds
                </span>
              </div>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
              {isBuilder && (
                <>
                  <Link
                    href="/builder/wizard"
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      pathname === '/builder/wizard'
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>New Requisition</span>
                  </Link>
                  <Link
                    href="/builder/projects"
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      pathname === '/builder/projects'
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>My Requisitions</span>
                  </Link>
                  <Link
                    href="/builder/kyc"
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      pathname === '/builder/kyc'
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Builder KYC</span>
                  </Link>
                </>
              )}

              {isVendor && (
                <>
                  <Link
                    href="/vendor/feed"
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      pathname === '/vendor/feed'
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Compass className="w-4 h-4" />
                    <span>Discovery Feed (0-100km)</span>
                  </Link>
                  <Link
                    href="/vendor/history"
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      pathname === '/vendor/history'
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <History className="w-4 h-4" />
                    <span>Quote History</span>
                  </Link>
                  <Link
                    href="/vendor/kyc"
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      pathname === '/vendor/kyc'
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Vendor Dual-KYC</span>
                  </Link>
                </>
              )}
            </nav>

            {/* User Session & Fast Persona Switcher */}
            <div className="flex items-center space-x-3">
              {/* Demo Persona Switcher Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDemoMenu(!showDemoMenu)}
                  className="flex items-center space-x-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 px-2.5 py-1.5 rounded-lg font-medium transition"
                  title="Switch between seeded demo accounts"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Demo Switcher</span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {showDemoMenu && (
                  <div 
                    className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 text-xs"
                    onClick={() => setShowDemoMenu(false)}
                  >
                    <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
                      Pre-Seeded Test Personas
                    </div>
                    <button
                      onClick={() => switchPersona('builder', '9876543210')}
                      className="w-full text-left px-3 py-2 hover:bg-slate-800 flex flex-col text-slate-200"
                    >
                      <span className="font-semibold text-amber-400">Rajesh Kumar (Builder)</span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" /> Whitefield, Bengaluru
                      </span>
                    </button>
                    <button
                      onClick={() => switchPersona('vendor', '9900112233')}
                      className="w-full text-left px-3 py-2 hover:bg-slate-800 flex flex-col text-slate-200"
                    >
                      <span className="font-semibold text-emerald-400">Mahaveer Infra (Vendor)</span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" /> Marathahalli (5.5 km from Whitefield)
                      </span>
                    </button>
                    <button
                      onClick={() => switchPersona('vendor', '9922334455')}
                      className="w-full text-left px-3 py-2 hover:bg-slate-800 flex flex-col text-slate-200"
                    >
                      <span className="font-semibold text-emerald-400">Apex Aggregates (Vendor)</span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" /> Hoskote (18 km from Whitefield)
                      </span>
                    </button>
                    <button
                      onClick={() => switchPersona('builder', '9811223344')}
                      className="w-full text-left px-3 py-2 hover:bg-slate-800 flex flex-col text-slate-200"
                    >
                      <span className="font-semibold text-amber-400">Ananya Sharma (Builder)</span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" /> Electronic City, Bengaluru
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {user ? (
                <div className="flex items-center space-x-3">
                  <div className="hidden sm:flex flex-col text-right">
                    <span className="text-sm font-bold text-white flex items-center justify-end gap-1.5">
                      {user.profileName || user.phoneNumber}
                      <span
                        className={`text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded ${
                          isBuilder ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        {user.role}
                      </span>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {user.kycCompleted ? '✅ KYC Verified' : '⚠️ KYC Pending'}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-400 border border-slate-700 transition"
                    title="Log Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openAuth('builder')}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-sm"
                  >
                    Builder Login
                  </button>
                  <button
                    onClick={() => openAuth('vendor')}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition"
                  >
                    Vendor Login
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* OTP Authentication Modal */}
      {showOtpModal && (
        <OtpModal
          defaultRole={otpRole}
          onClose={() => setShowOtpModal(false)}
        />
      )}
    </>
  );
}
