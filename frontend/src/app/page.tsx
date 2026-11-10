'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { OtpModal } from '../components/OtpModal';
import { 
  Building2, 
  Store, 
  ShieldCheck, 
  Compass, 
  Layers, 
  ArrowRight, 
  CheckCircle, 
  Sparkles,
  Truck,
  TrendingDown,
  Clock,
  MapPin
} from 'lucide-react';

export default function LandingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'builder' | 'vendor'>('builder');

  const handlePathwayClick = (role: 'builder' | 'vendor') => {
    if (user) {
      if (user.role === role) {
        router.push(role === 'builder' ? '/builder/wizard' : '/vendor/feed');
      } else {
        // Logged in as different role
        setSelectedRole(role);
        setShowOtpModal(true);
      }
    } else {
      setSelectedRole(role);
      setShowOtpModal(true);
    }
  };

  return (
    <div className="space-y-16 py-4">
      
      {/* Hero Section */}
      <div className="relative text-center max-w-4xl mx-auto space-y-6 pt-4 sm:pt-10">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 font-bold text-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>India&apos;s PostGIS-Powered B2B Construction Network</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-slate-950 tracking-tight leading-tight">
          Ware Store <br />
          <span className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 bg-clip-text text-transparent">
            Where Trust Builds
          </span>
        </h1>

        <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          The verified marketplace bridging <strong>Construction Builders</strong> and <strong>Material Vendors</strong>. Transparent price discovery, PostGIS spatial radius matching, and binding quotes.
        </p>

        {/* Live Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto pt-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
            <div className="text-2xl font-black text-slate-900 font-mono">100%</div>
            <div className="text-[11px] text-slate-500 font-semibold uppercase mt-0.5">Verified PAN/GSTIN</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
            <div className="text-2xl font-black text-slate-900 font-mono">0–100 km</div>
            <div className="text-[11px] text-slate-500 font-semibold uppercase mt-0.5">PostGIS Radius</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
            <div className="text-2xl font-black text-amber-600 font-mono">14.8%</div>
            <div className="text-[11px] text-slate-500 font-semibold uppercase mt-0.5">Average Cost Saved</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
            <div className="text-2xl font-black text-slate-900 font-mono">&lt; 3 Hours</div>
            <div className="text-[11px] text-slate-500 font-semibold uppercase mt-0.5">Quote Turnaround</div>
          </div>
        </div>
      </div>

      {/* Two Entry Pathways: Buy & Sell */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Pathway A: Builder (Buyer) */}
        <div className="group relative bg-white rounded-3xl p-8 border-2 border-slate-200 hover:border-amber-500 shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20 group-hover:scale-110 transition-transform">
              <Building2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[11px] uppercase font-black tracking-wider text-amber-600">
                Role A • Construction Buyers
              </span>
              <h2 className="text-2xl font-black text-slate-950 mt-1">
                I Need Building Materials
              </h2>
              <p className="text-slate-600 text-xs mt-2 leading-relaxed">
                Post material requisitions with cascading specs, define project deadlines, and compare competing vendor quotes on a live distance-ranked leaderboard.
              </p>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-700 pt-2 border-t border-slate-100">
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Instant SMS OTP login without password friction</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Cascading requisition wizard: Sand, Cement, Steel, Bricks</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Live Vendor Leaderboard ranked by total price & distance</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => handlePathwayClick('builder')}
            className="mt-8 w-full py-3.5 px-6 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center space-x-2 transition shadow-md group-hover:bg-amber-500 group-hover:text-slate-950"
          >
            <span>Enter as Builder</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Pathway B: Vendor (Seller) */}
        <div className="group relative bg-white rounded-3xl p-8 border-2 border-slate-200 hover:border-emerald-500 shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center font-black shadow-md shadow-emerald-500/10 group-hover:scale-110 transition-transform">
              <Store className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[11px] uppercase font-black tracking-wider text-emerald-600">
                Role B • Material Suppliers
              </span>
              <h2 className="text-2xl font-black text-slate-950 mt-1">
                I Supply Quality Materials
              </h2>
              <p className="text-slate-600 text-xs mt-2 leading-relaxed">
                Discover active requisitions in your delivery territory using PostGIS distance sliders (0–100 km). Submit itemized quotes via a fast slide-over drawer.
              </p>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-700 pt-2 border-t border-slate-100">
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Strict dual-verification: Phone OTP + Corporate Email OTP</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>PostGIS spatial radius discovery filter (0 to 100 km)</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Interactive slide-over drawer with real-time tax & freight calculation</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => handlePathwayClick('vendor')}
            className="mt-8 w-full py-3.5 px-6 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center space-x-2 transition shadow-md group-hover:bg-emerald-600 group-hover:text-white"
          >
            <span>Enter as Vendor</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="max-w-5xl mx-auto pt-8 border-t border-slate-200">
        <div className="text-center mb-8">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Platform Integrity</span>
          <h3 className="text-2xl font-black text-slate-900 mt-1">Built for Heavy B2B Commerce</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-2">
            <div className="p-3 bg-amber-50 rounded-xl w-fit text-amber-600">
              <Compass className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">PostGIS Spatial Engine</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Real-time geodesic calculations (EPSG:4326) calculate road and straight-line distances from vendor depots to job sites.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-2">
            <div className="p-3 bg-emerald-50 rounded-xl w-fit text-emerald-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Dual-Verification KYC</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every vendor profile undergoes algorithmic validation against PAN & GSTIN formats, preventing fraudulent listings.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-2">
            <div className="p-3 bg-blue-50 rounded-xl w-fit text-blue-600">
              <TrendingDown className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Open Bids Leaderboard</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Competitive transparency gives builders the best value quotes, while vendors see where their quote ranks in real time.
            </p>
          </div>
        </div>
      </div>

      {showOtpModal && (
        <OtpModal
          defaultRole={selectedRole}
          onClose={() => setShowOtpModal(false)}
          onSuccess={() => {
            router.push(selectedRole === 'builder' ? '/builder/wizard' : '/vendor/feed');
          }}
        />
      )}
    </div>
  );
}
