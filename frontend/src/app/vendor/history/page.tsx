'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../lib/api';
import { 
  History, 
  MapPin, 
  Truck, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Trophy, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function VendorHistoryPage() {
  const { user, switchPersona, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<'ongoing' | 'completed' | 'closed' | 'cancelled'>('ongoing');
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await api.getVendorHistory(tab);
      setHistory(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load quote history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'vendor') {
      fetchHistory();
    }
  }, [user, tab]);

  if (authLoading) {
    return <div className="text-center py-20 text-slate-500">Authenticating...</div>;
  }

  if (!user || user.role !== 'vendor') {
    return (
      <div className="max-w-md mx-auto text-center py-16 px-6 bg-white rounded-3xl border border-slate-200 shadow-xl space-y-4">
        <h2 className="text-xl font-black text-slate-900">Vendor Access Required</h2>
        <p className="text-xs text-slate-600">
          Sign in as a registered vendor to inspect quote history and order statuses.
        </p>
        <button
          onClick={() => switchPersona('vendor', '9900112233')}
          className="w-full py-3 px-4 rounded-xl bg-slate-900 text-emerald-400 font-black text-sm flex items-center justify-center space-x-2 transition"
        >
          <Sparkles className="w-4 h-4" />
          <span>Login as Demo Vendor (Mahaveer Infra)</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <span className="text-xs font-black uppercase tracking-wider text-emerald-600">
          Order Governance
        </span>
        <h1 className="text-3xl font-black text-slate-950">Vendor Quotation History</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review ongoing bids, closed auctions, completed awards, and cancelled projects.
        </p>
      </div>

      {/* 4 Distinct Tabs */}
      <div className="flex border-b border-slate-200 space-x-2 overflow-x-auto">
        {[
          { key: 'ongoing', label: 'Ongoing Bids', icon: Clock },
          { key: 'completed', label: 'Completed (Won)', icon: Trophy },
          { key: 'closed', label: 'Closed Bids', icon: XCircle },
          { key: 'cancelled', label: 'Cancelled Bids', icon: History },
        ].map((item) => {
          const isSelected = tab === item.key;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key as any)}
              className={`py-3 px-5 text-xs font-black uppercase tracking-wider border-b-2 flex items-center space-x-2 transition-all whitespace-nowrap ${
                isSelected
                  ? 'border-emerald-500 text-slate-900 bg-emerald-50/40 rounded-t-xl'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* History Stream */}
      {loading ? (
        <div className="text-center py-20 text-slate-400 text-sm">Loading quotations...</div>
      ) : history.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white border border-slate-200 rounded-3xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <History className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No {tab} quotes found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {tab === 'ongoing'
              ? 'Browse the discovery feed to find open builder requisitions in your area and submit quotes.'
              : `You have no ${tab} quotes in your log.`}
          </p>
          <Link
            href="/vendor/feed"
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold mt-2 hover:bg-emerald-600 transition"
          >
            <span>Open Discovery Feed</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {history.map((record) => {
            const isWon = record.bid_status === 'accepted';
            return (
              <div
                key={record.bid_id}
                className={`bg-white rounded-3xl p-6 border-2 shadow-sm space-y-4 ${
                  isWon ? 'border-emerald-400 bg-emerald-50/20' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold text-[10px] uppercase">
                      {record.category}
                    </span>
                    <h3 className="font-black text-base text-slate-900 mt-1">{record.sub_item}</h3>
                    <p className="text-xs text-slate-500">
                      Builder: <strong>{record.builder_first_name} {record.builder_last_name}</strong>
                    </p>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-black uppercase ${
                        isWon
                          ? 'bg-emerald-100 text-emerald-800'
                          : record.bid_status === 'submitted'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {isWon && <Trophy className="w-3.5 h-3.5 mr-1" />}
                      <span>{isWon ? 'Awarded / Won' : record.bid_status}</span>
                    </span>
                  </div>
                </div>

                {/* Pricing Breakdown */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Unit Price</span>
                    <div className="font-bold text-slate-900 font-mono mt-0.5">
                      ₹{record.base_unit_price.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Freight</span>
                    <div className="font-bold text-slate-900 font-mono mt-0.5">
                      ₹{record.transport_fee.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Total (Inc. Tax)</span>
                    <div className="font-black text-slate-950 font-mono text-sm mt-0.5">
                      ₹{record.total_amount.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Logistics & Location */}
                <div className="text-xs text-slate-600 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1 font-mono text-slate-700">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      Distance: {record.distance_km} km
                    </span>
                    <span className="text-slate-500">
                      Timeline: <strong>{record.delivery_timeline_days} Days</strong>
                    </span>
                  </div>
                  <p className="truncate text-slate-500 text-[11px]">{record.project_address}</p>
                </div>

                {record.remarks && (
                  <div className="text-xs text-slate-600 italic bg-amber-50/40 p-2.5 rounded-xl border border-amber-200">
                    &quot;{record.remarks}&quot;
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
