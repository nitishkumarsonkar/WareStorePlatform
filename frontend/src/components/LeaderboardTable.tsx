'use client';

import React, { useState } from 'react';
import { Bid } from '../types';
import { api } from '../lib/api';
import { 
  Trophy, 
  MapPin, 
  Star, 
  CheckCircle, 
  Truck, 
  Clock, 
  ShieldCheck, 
  Phone, 
  Mail, 
  AlertCircle,
  FileCheck2
} from 'lucide-react';

interface LeaderboardTableProps {
  bids: Bid[];
  isProjectOpen: boolean;
  onBidAccepted: () => void;
}

export function LeaderboardTable({ bids, isProjectOpen, onBidAccepted }: LeaderboardTableProps) {
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [loadingBidId, setLoadingBidId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAcceptBid = async (bidId: string) => {
    if (!confirm('Are you sure you want to accept this vendor quote? This will close the requisition.')) {
      return;
    }
    setError(null);
    setLoadingBidId(bidId);

    try {
      await api.acceptBid(bidId);
      onBidAccepted();
      if (selectedBid?.id === bidId) {
        setSelectedBid(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to accept quote.');
    } finally {
      setLoadingBidId(null);
    }
  };

  if (!bids || bids.length === 0) {
    return (
      <div className="text-center py-12 px-4 bg-slate-50 border border-dashed border-slate-300 rounded-3xl">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
          <Clock className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">Waiting for Verified Vendor Quotes</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
          Vendors within your delivery radius are discovering this requisition. Quotes will populate on this leaderboard in real time.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Leaderboard Table Container */}
      <div className="overflow-x-auto bg-white border border-slate-200 rounded-2xl shadow-sm">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-900 text-white uppercase text-[10px] tracking-wider border-b border-slate-800">
              <th className="py-3 px-4">Rank</th>
              <th className="py-3 px-4">Vendor & Reputation</th>
              <th className="py-3 px-4">Distance from Site</th>
              <th className="py-3 px-4">Unit Quote</th>
              <th className="py-3 px-4">Freight</th>
              <th className="py-3 px-4 text-right">Total Quote (Inc. 18% GST)</th>
              <th className="py-3 px-4 text-center">Timeline</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bids.map((bid, index) => {
              const isAccepted = bid.bid_status === 'accepted';
              const isRankOne = index === 0;

              return (
                <tr
                  key={bid.id}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    isAccepted
                      ? 'bg-emerald-50/60 font-semibold'
                      : isRankOne
                      ? 'bg-amber-50/30'
                      : ''
                  }`}
                >
                  {/* Rank */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1.5">
                      {isRankOne ? (
                        <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[11px] shadow-sm">
                          <Trophy className="w-3 h-3" />
                          <span>#1 Best</span>
                        </div>
                      ) : (
                        <span className="font-mono font-bold text-slate-500 text-xs pl-2">
                          #{index + 1}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Vendor & Rating */}
                  <td className="py-4 px-4">
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-slate-900 text-sm">{bid.business_name}</span>
                        <span title="Verified PostGIS Vendor">
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 mt-0.5 text-slate-500">
                        <span className="flex items-center text-amber-500 text-[11px] font-bold">
                          <Star className="w-3 h-3 fill-amber-400 stroke-amber-400 mr-0.5" />
                          {bid.vendor_rating.toFixed(1)}
                        </span>
                        <span className="text-[10px] text-slate-400">({bid.vendor_rating_count} reviews)</span>
                        <span className="text-[10px] text-slate-400">• Est. {bid.year_established}</span>
                      </div>
                    </div>
                  </td>

                  {/* Distance */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1 font-mono font-bold text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{bid.distance_km} km</span>
                    </div>
                    <span className="text-[10px] text-slate-400 truncate max-w-[150px] block">
                      {bid.vendor_address}
                    </span>
                  </td>

                  {/* Base Unit Price */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className="font-mono font-bold text-slate-900">
                      ₹{bid.base_unit_price.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 block">per unit</span>
                  </td>

                  {/* Transport */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1 font-mono text-slate-700">
                      <Truck className="w-3 h-3 text-slate-400" />
                      <span>₹{bid.transport_fee.toLocaleString()}</span>
                    </div>
                  </td>

                  {/* Total Quote */}
                  <td className="py-4 px-4 whitespace-nowrap text-right">
                    <div className="text-base font-black font-mono text-slate-950">
                      ₹{bid.total_amount.toLocaleString()}
                    </div>
                    <span className="text-[10px] text-emerald-700 font-semibold block">
                      Incl. ₹{Math.round((bid.total_amount - (bid.total_amount / 1.18))).toLocaleString()} GST
                    </span>
                  </td>

                  {/* Timeline */}
                  <td className="py-4 px-4 whitespace-nowrap text-center">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[11px]">
                      {bid.delivery_timeline_days} Days
                    </span>
                  </td>

                  {/* Action */}
                  <td className="py-4 px-4 whitespace-nowrap text-center">
                    {isAccepted ? (
                      <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Accepted</span>
                      </span>
                    ) : isProjectOpen ? (
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          type="button"
                          disabled={loadingBidId === bid.id}
                          onClick={() => handleAcceptBid(bid.id)}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-sm"
                        >
                          {loadingBidId === bid.id ? 'Accepting...' : 'Accept Quote'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedBid(bid)}
                          className="px-2 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs"
                          title="View Vendor Contact & Remarks"
                        >
                          Details
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Requisition Closed</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Quote Details Modal */}
      {selectedBid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                  Vendor Quote Inspection
                </span>
                <h3 className="text-lg font-bold">{selectedBid.business_name}</h3>
              </div>
              <button
                onClick={() => setSelectedBid(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Base Unit Rate</span>
                  <div className="text-base font-bold text-slate-900 font-mono">
                    ₹{selectedBid.base_unit_price.toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Freight & Logistics</span>
                  <div className="text-base font-bold text-slate-900 font-mono">
                    ₹{selectedBid.transport_fee.toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">GST (18%)</span>
                  <div className="text-sm font-semibold text-slate-700 font-mono">
                    ₹{Math.round((selectedBid.total_amount - (selectedBid.total_amount / 1.18))).toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Net Amount</span>
                  <div className="text-lg font-black text-slate-950 font-mono">
                    ₹{selectedBid.total_amount.toLocaleString()}
                  </div>
                </div>
              </div>

              {selectedBid.remarks && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Vendor Remarks</span>
                  <p className="text-xs text-slate-700 bg-amber-50/50 p-3 rounded-xl border border-amber-200 mt-1">
                    {selectedBid.remarks}
                  </p>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-medium">
                    <Phone className="w-3 h-3" /> {selectedBid.vendor_phone}
                  </span>
                  <span className="flex items-center gap-1 mt-0.5 font-medium">
                    <Mail className="w-3 h-3" /> {selectedBid.vendor_email}
                  </span>
                </div>

                {isProjectOpen && (
                  <button
                    type="button"
                    onClick={() => handleAcceptBid(selectedBid.id)}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-md"
                  >
                    Accept This Quote
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
