'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CONSTRUCTION_CATALOG } from '../lib/catalog';
import { MapCoordinatePicker } from './MapCoordinatePicker';
import { api } from '../lib/api';
import { 
  Building2, 
  Truck, 
  Calendar, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft,
  FileText,
  BadgeCheck,
  Package
} from 'lucide-react';

export function RequisitionWizard() {
  const router = useRouter();

  // Step state (1: Category & Sub-Item, 2: Specs & Quantity, 3: Location & GST, 4: Review)
  const [step, setStep] = useState(1);

  // Form Fields
  const [category, setCategory] = useState(CONSTRUCTION_CATALOG[1].category); // default Bricks
  const [subItem, setSubItem] = useState(CONSTRUCTION_CATALOG[1].subItems[0]);
  const [brandPreference, setBrandPreference] = useState(CONSTRUCTION_CATALOG[1].brands[0] || '');
  const [customBrand, setCustomBrand] = useState('');
  
  const currentCategoryDef = CONSTRUCTION_CATALOG.find((c) => c.category === category) || CONSTRUCTION_CATALOG[0];

  const [quantity, setQuantity] = useState('3000');
  const [unit, setUnit] = useState(currentCategoryDef.units[0]);
  const [requirementDate, setRequirementDate] = useState(
    new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0]
  );
  const [transportNeeded, setTransportNeeded] = useState(true);
  const [gstNumber, setGstNumber] = useState('29ABCDE1234F1Z5');
  const [notes, setNotes] = useState('Direct unloading required at loading dock. Material test certificates mandatory.');

  // Location
  const [addressText, setAddressText] = useState('Prestige Tech Cloud Site, Whitefield, Bengaluru, KA 560066');
  const [latitude, setLatitude] = useState(12.9698);
  const [longitude, setLongitude] = useState(77.7500);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handlers for category change
  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    const catDef = CONSTRUCTION_CATALOG.find((c) => c.category === newCat);
    if (catDef) {
      setSubItem(catDef.subItems[0] || '');
      setUnit(catDef.units[0] || 'Units');
      setBrandPreference(catDef.brands[0] || '');
    }
  };

  const handleCoordinatesChange = (lat: number, lng: number, suggestedAddress?: string) => {
    setLatitude(lat);
    setLongitude(lng);
    if (suggestedAddress) {
      setAddressText(suggestedAddress);
    }
  };

  const handleSubmitRequisition = async () => {
    setError(null);
    setLoading(true);

    try {
      const payload = {
        category,
        subItem,
        brandPreference: customBrand ? customBrand.trim() : brandPreference,
        quantity: parseFloat(quantity),
        unit,
        requirementDate,
        transportNeeded,
        gstNumber: gstNumber ? gstNumber.trim().toUpperCase() : undefined,
        notes,
        addressText,
        latitude,
        longitude,
      };

      const result = await api.createProject(payload);
      router.push(`/builder/projects?new=${result.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to submit requisition.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
      {/* Wizard Progress Bar */}
      <div className="bg-slate-900 text-white px-6 sm:px-10 py-6 border-b border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[11px] font-black uppercase tracking-widest text-amber-400">
              Procurement Wizard
            </span>
            <h1 className="text-2xl font-black tracking-tight">Create Material Requisition</h1>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-slate-300">
            Step {step} of 4
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {['Material Category', 'Specifications', 'Site & Delivery', 'Review & Post'].map((label, idx) => (
            <div key={label} className="space-y-1">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx + 1 <= step ? 'bg-amber-400' : 'bg-slate-800'
                }`}
              />
              <span className={`text-[10px] hidden sm:block font-semibold ${idx + 1 === step ? 'text-amber-400' : 'text-slate-500'}`}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="m-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step Content */}
      <div className="p-6 sm:p-10">
        {/* Step 1: Category & Cascading Sub-Items */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">Select Construction Material Category</h2>
              <p className="text-xs text-slate-500">Pick the primary procurement classification.</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                {CONSTRUCTION_CATALOG.map((item) => {
                  const isSelected = item.category === category;
                  return (
                    <button
                      key={item.category}
                      type="button"
                      onClick={() => handleCategoryChange(item.category)}
                      className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/50 shadow-md ring-2 ring-amber-400'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm mb-3 ${
                        isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 text-slate-700'
                      }`}>
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900">{item.category}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{item.subItems.length} Variants</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cascading Sub-Item Dropdown */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Cascading Sub-Item Specification <span className="text-red-500">*</span>
                </label>
                <select
                  value={subItem}
                  onChange={(e) => setSubItem(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  {currentCategoryDef.subItems.map((si) => (
                    <option key={si} value={si}>
                      {si}
                    </option>
                  ))}
                </select>
              </div>

              {/* Brand Preference */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Brand Preference (Optional)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {currentCategoryDef.brands.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => {
                        setBrandPreference(b);
                        setCustomBrand('');
                      }}
                      className={`px-3 py-2 text-xs rounded-xl border text-left transition font-semibold ${
                        brandPreference === b && !customBrand
                          ? 'border-amber-500 bg-amber-500/10 text-amber-900'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Or enter unlisted specific brand..."
                  value={customBrand}
                  onChange={(e) => setCustomBrand(e.target.value)}
                  className="mt-2 w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Quantity, Unit, Requirement Date, Transport Needed */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Volume, Timeline & Logistics</h2>
            <p className="text-xs text-slate-500">Provide procurement quantities and required on-site date.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Required Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 2500"
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-lg font-black text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Unit of Measurement <span className="text-red-500">*</span>
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  {currentCategoryDef.units.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Requirement Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={requirementDate}
                    onChange={(e) => setRequirementDate(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              {/* Transport Needed Switch */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Logistics & Transportation
                </label>
                <div
                  onClick={() => setTransportNeeded(!transportNeeded)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                    transportNeeded
                      ? 'border-amber-500 bg-amber-50/60'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${transportNeeded ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 text-slate-600'}`}>
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {transportNeeded ? 'Vendor Delivery Needed' : 'Builder Arranging Pickup'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {transportNeeded ? 'Vendor includes freight in quote' : 'Direct loading from vendor warehouse'}
                      </div>
                    </div>
                  </div>
                  <div className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${transportNeeded ? 'bg-amber-500' : 'bg-slate-300'}`}>
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${transportNeeded ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </div>
              </div>
            </div>

            {/* Special Instructions */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Unloading Instructions & Site Gate Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Unloading requires hydraulic tipper; delivery only between 8:00 AM - 12:00 PM."
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>
        )}

        {/* Step 3: Site Coordinates & GSTIN */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Site Geolocation & Tax Information</h2>
            <p className="text-xs text-slate-500">
              PostGIS will calculate the exact transport distance for all competing vendor quotes based on these coordinates.
            </p>

            <MapCoordinatePicker
              latitude={latitude}
              longitude={longitude}
              addressText={addressText}
              onCoordinatesChange={handleCoordinatesChange}
              onAddressChange={setAddressText}
            />

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                GSTIN for Tax Invoice (Optional, 15 Characters)
              </label>
              <input
                type="text"
                maxLength={15}
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                placeholder="e.g. 29ABCDE1234F1Z5"
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono tracking-wider focus:ring-2 focus:ring-amber-500 outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Enter your company 15-character GST number to receive input tax credit (ITC) on all orders.
              </p>
            </div>
          </div>
        )}

        {/* Step 4: Review & Post Requisition */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 text-emerald-600 font-bold text-xs uppercase tracking-wider">
              <BadgeCheck className="w-4 h-4" />
              <span>Ready for Vendor Bidding</span>
            </div>
            <h2 className="text-xl font-black text-slate-900">Review Requisition Summary</h2>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-200">
                <div>
                  <span className="text-[11px] uppercase font-bold text-slate-400">Category & Specification</span>
                  <div className="text-base font-bold text-slate-900">{subItem}</div>
                  <div className="text-xs text-amber-600 font-semibold">{category} • {customBrand || brandPreference || 'Any Quality Brand'}</div>
                </div>
                <div>
                  <span className="text-[11px] uppercase font-bold text-slate-400">Total Volume</span>
                  <div className="text-xl font-black text-slate-900 font-mono">
                    {parseFloat(quantity).toLocaleString()} {unit}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-slate-200">
                <div>
                  <span className="text-[11px] uppercase font-bold text-slate-400">Required Date</span>
                  <div className="text-sm font-semibold text-slate-900 flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    {requirementDate}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] uppercase font-bold text-slate-400">Logistics</span>
                  <div className="text-sm font-semibold text-slate-900 flex items-center gap-1.5 mt-0.5">
                    <Truck className="w-3.5 h-3.5 text-slate-500" />
                    {transportNeeded ? 'Vendor Delivery Included' : 'Builder Pickup'}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] uppercase font-bold text-slate-400">GST Number</span>
                  <div className="text-sm font-mono font-semibold text-slate-900 mt-0.5">
                    {gstNumber || 'Not Specified'}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[11px] uppercase font-bold text-slate-400">Delivery Site Geolocation</span>
                <div className="text-sm font-medium text-slate-800 mt-0.5">{addressText}</div>
                <div className="text-xs font-mono text-slate-500 mt-1">
                  Coordinates: {latitude.toFixed(4)}, {longitude.toFixed(4)} (PostGIS Indexed)
                </div>
              </div>

              {notes && (
                <div>
                  <span className="text-[11px] uppercase font-bold text-slate-400">Special Notes</span>
                  <div className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200 mt-1">
                    {notes}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-bold flex items-center space-x-2 hover:bg-slate-50 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 2 && (!quantity || parseFloat(quantity) <= 0)) {
                  setError('Please enter a valid quantity.');
                  return;
                }
                setError(null);
                setStep((s) => s + 1);
              }}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold flex items-center space-x-2 transition shadow-md"
            >
              <span>Next Step</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={handleSubmitRequisition}
              className="px-8 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-black flex items-center space-x-2 transition shadow-lg shadow-amber-500/20"
            >
              {loading ? (
                <span>Posting Requisition...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Publish Requisition & Open Bidding</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
