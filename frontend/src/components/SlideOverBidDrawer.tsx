'use client';

import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import { api } from '../lib/api';
import { 
  X, 
  MapPin, 
  Truck, 
  Calendar, 
  ShieldCheck, 
  Calculator, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';

interface SlideOverBidDrawerProps {
  project: Project | null;
  onClose: () => void;
  onBidSubmitted: () => void;
}

export function SlideOverBidDrawer({ project, onClose, onBidSubmitted }: SlideOverBidDrawerProps) {
  const [baseUnitPrice, setBaseUnitPrice] = useState<string>('');
  const [transportFee, setTransportFee] = useState<string>('0');
  const [taxRatePercent, setTaxRatePercent] = useState<number>(18);
  const [deliveryTimelineDays, setDeliveryTimelineDays] = useState<number>(3);
  const [remarks, setRemarks] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Set default suggestion on project load
  useEffect(() => {
    if (project) {
      setError(null);
      setSuccess(false);
      // Sensible initial defaults based on category
      if (project.category === 'Bricks') {
        setBaseUnitPrice('60');
        setTransportFee(project.transport_needed ? '4000' : '0');
      } else if (project.category === 'Steel') {
        setBaseUnitPrice('57000');
        setTransportFee(project.transport_needed ? '10000' : '0');
      } else if (project.category === 'Sand') {
        setBaseUnitPrice('45');
        setTransportFee(project.transport_needed ? '3000' : '0');
      } else if (project.category === 'Cement') {
        setBaseUnitPrice('380');
        setTransportFee(project.transport_needed ? '2000' : '0');
      } else {
        setBaseUnitPrice('100');
        setTransportFee(project.transport_needed ? '2500' : '0');
      }
    }
  }, [project]);

  if (!project) return null;

  // Real-time computation
  const qty = project.quantity || 0;
  const unitPrice = parseFloat(baseUnitPrice) || 0;
  const freight = parseFloat(transportFee) || 0;
  const subtotal = (qty * unitPrice) + freight;
  const tax = subtotal * (taxRatePercent / 100);
  const grandTotal = Math.round((subtotal + tax) * 100) / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (unitPrice <= 0) {
      setError('Base unit price must be greater than zero.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await api.submitBid({
        projectId: project.id,
        baseUnitPrice: unitPrice,
        transportFee: freight,
        taxRatePercent,
        deliveryTimelineDays,
        remarks,
      });

      setSuccess(true);
      setTimeout(() => {
        onBidSubmitted();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit quote.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col border-l border-slate-200">
          
          {/* Header */}
          <div className="bg-slate-900 text-white p-6 flex items-start justify-between border-b border-slate-800">
            <div>
              <div className="flex items-center space-x-2 text-amber-400 text-xs font-black uppercase tracking-wider mb-1">
                <Calculator className="w-4 h-4" />
                <span>Submit Formal Quote</span>
              </div>
              <h2 className="text-xl font-black">{project.sub_item}</h2>
              <div className="flex items-center space-x-2 text-xs text-slate-400 mt-1">
                <span className="font-semibold text-white">{project.category}</span>
                <span>•</span>
                <span className="flex items-center text-amber-400 font-mono font-bold">
                  <MapPin className="w-3 h-3 mr-0.5" />
                  {project.distance_km !== undefined ? `${project.distance_km} km away` : 'Near you'}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Project Specifications Card */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                Requisition Parameters
              </span>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500">Volume Required:</span>
                  <div className="font-black text-slate-900 text-sm font-mono mt-0.5">
                    {project.quantity.toLocaleString()} {project.unit}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Brand Preference:</span>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {project.brand_preference || 'Any Standard Brand'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Requirement Deadline:</span>
                  <div className="font-semibold text-slate-900 flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {project.requirement_date}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Logistics Requirement:</span>
                  <div className="font-semibold text-slate-900 flex items-center gap-1 mt-0.5">
                    <Truck className="w-3.5 h-3.5 text-slate-400" />
                    {project.transport_needed ? 'Delivery to Site Required' : 'Builder Pickup'}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 text-xs">
                <span className="text-slate-500">Delivery Address:</span>
                <p className="font-medium text-slate-800 mt-0.5">{project.address_text}</p>
              </div>

              {project.notes && (
                <div className="pt-2 border-t border-slate-200 text-xs">
                  <span className="text-slate-500">Builder Site Notes:</span>
                  <p className="text-slate-700 italic mt-0.5">{project.notes}</p>
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-2xl flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
                <div>
                  <div className="font-bold">Quote Submitted Successfully!</div>
                  <div>Your bid has been ranked on the Builder Leaderboard.</div>
                </div>
              </div>
            )}

            {/* Bid Input Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Base Unit Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={baseUnitPrice}
                      onChange={(e) => setBaseUnitPrice(e.target.value)}
                      placeholder="e.g. 58"
                      className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-black font-mono focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">per {project.unit}</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Freight / Transport (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      value={transportFee}
                      onChange={(e) => setTransportFee(e.target.value)}
                      placeholder="e.g. 3500"
                      className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-black font-mono focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Lump sum transport cost</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    GST Tax Rate (%)
                  </label>
                  <select
                    value={taxRatePercent}
                    onChange={(e) => setTaxRatePercent(parseFloat(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value={18}>18% (Standard Construction GST)</option>
                    <option value={28}>28% (Special Goods)</option>
                    <option value={12}>12% (Standard Concessional)</option>
                    <option value={5}>5% (Exempt / Low Rate)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Dispatch Turnaround
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={deliveryTimelineDays}
                      onChange={(e) => setDeliveryTimelineDays(parseInt(e.target.value, 10))}
                      className="w-20 p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold font-mono focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                    <span className="text-xs text-slate-600 font-semibold">Days to site</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Vendor Notes & Certifications (Optional)
                </label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Manufacturer test reports included. Direct dispatch from stockyard."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              {/* Real-Time Price Calculation Card */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Material ({qty} × ₹{unitPrice}):</span>
                  <span className="font-mono">₹{(qty * unitPrice).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Freight & Logistics:</span>
                  <span className="font-mono">₹{freight.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>GST ({taxRatePercent}%):</span>
                  <span className="font-mono">₹{Math.round(tax).toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-sm">
                  <span className="font-bold text-amber-400">Total Quotation Value:</span>
                  <span className="text-xl font-black font-mono text-white">
                    ₹{grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || unitPrice <= 0}
                className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-300 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center space-x-2 transition shadow-lg shadow-amber-500/20"
              >
                {loading ? (
                  <span>Submitting Quote...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>Submit Binding Quotation</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
