'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../lib/api';
import { MapCoordinatePicker } from '../../../components/MapCoordinatePicker';
import { CONSTRUCTION_CATALOG } from '../../../lib/catalog';
import { OtpModal } from '../../../components/OtpModal';
import { 
  ShieldCheck, 
  Store, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Check, 
  RefreshCw, 
  Mail, 
  Phone,
  Building,
  FileText
} from 'lucide-react';

export default function VendorKycPage() {
  const { user, refreshUser, loading: authLoading } = useAuth();

  const [businessName, setBusinessName] = useState('');
  const [yearEstablished, setYearEstablished] = useState<number>(2012);
  const [panNumber, setPanNumber] = useState('AAECM4567K');
  const [gstNumber, setGstNumber] = useState('29AAECM4567K1Z5');
  const [addressText, setAddressText] = useState('Outer Ring Road, Marathahalli, Bengaluru');
  const [latitude, setLatitude] = useState(12.9569);
  const [longitude, setLongitude] = useState(77.7011);
  const [catalogCategories, setCatalogCategories] = useState<string[]>(['Bricks', 'Cement', 'Sand']);

  const [idProofUrl, setIdProofUrl] = useState('');
  const [gstCertUrl, setGstCertUrl] = useState('');

  const [uploadingPan, setUploadingPan] = useState(false);
  const [uploadingGst, setUploadingGst] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Email verification helper
  const [showEmailOtpModal, setShowEmailOtpModal] = useState(false);

  useEffect(() => {
    if (user?.profile && user.role === 'vendor') {
      const p = user.profile as any;
      setBusinessName(p.businessName || '');
      setYearEstablished(p.yearEstablished || 2015);
      setPanNumber(p.panNumber || '');
      setGstNumber(p.gstNumber || '');
      setAddressText(p.addressText || '');
      if (p.catalogCategories) {
        setCatalogCategories(p.catalogCategories);
      }
      if (p.location?.coordinates) {
        setLongitude(p.location.coordinates[0]);
        setLatitude(p.location.coordinates[1]);
      }
    }
  }, [user]);

  const toggleCategory = (catName: string) => {
    setCatalogCategories((prev) =>
      prev.includes(catName) ? prev.filter((c) => c !== catName) : [...prev, catName]
    );
  };

  const handlePanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPan(true);
    try {
      const res = await api.uploadDocument(file);
      setIdProofUrl(res.fileUrl);
    } catch (err: any) {
      setError(err.message || 'PAN upload failed.');
    } finally {
      setUploadingPan(false);
    }
  };

  const handleGstUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingGst(true);
    try {
      const res = await api.uploadDocument(file);
      setGstCertUrl(res.fileUrl);
    } catch (err: any) {
      setError(err.message || 'GST Certificate upload failed.');
    } finally {
      setUploadingGst(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSaving(true);

    try {
      await api.submitVendorKyc({
        businessName,
        yearEstablished,
        panNumber,
        gstNumber,
        addressText,
        latitude,
        longitude,
        catalogCategories,
        idProofUrl: idProofUrl || undefined,
        gstCertUrl: gstCertUrl || undefined,
      });

      await refreshUser();
      setMessage('Vendor KYC and PostGIS warehouse location registered successfully!');
    } catch (err: any) {
      setError(err.message || 'Vendor onboarding failed.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return <div className="text-center py-20 text-slate-500">Loading vendor profile...</div>;
  }

  const isPhoneVerified = !!user?.phoneVerified;
  const isEmailVerified = !!user?.emailVerified;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <span className="text-xs font-black uppercase tracking-wider text-emerald-600">
          Supplier Onboarding
        </span>
        <h1 className="text-3xl font-black text-slate-950">Vendor Dual-Verification & KYC</h1>
        <p className="text-xs text-slate-500 mt-1">
          Strict verification ensures only legitimate material suppliers participate on Ware Store.
        </p>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-2xl flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Dual Verification Gate Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-amber-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Dual-Authentication Gate (Mandatory for Vendors)</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {isPhoneVerified && isEmailVerified ? '2 of 2 Verified' : 'Action Required'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Factor 1: Phone */}
          <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-xl ${isPhoneVerified ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">SMS Phone OTP</div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                  +{user?.phoneNumber || '9900112233'}
                </div>
              </div>
            </div>
            {isPhoneVerified ? (
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase flex items-center gap-1">
                <Check className="w-3 h-3" /> Verified
              </span>
            ) : (
              <span className="text-[10px] text-amber-400 font-bold">Pending OTP</span>
            )}
          </div>

          {/* Factor 2: Business Email */}
          <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-xl ${isEmailVerified ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Corporate Email OTP</div>
                <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[150px]">
                  {user?.email || 'sales@mahaveersupplies.com'}
                </div>
              </div>
            </div>
            {isEmailVerified ? (
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase flex items-center gap-1">
                <Check className="w-3 h-3" /> Verified
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setShowEmailOtpModal(true)}
                className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-black text-[10px] hover:bg-amber-400 transition"
              >
                Verify Email
              </button>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-6">
        
        {/* Business Particulars */}
        <div className="space-y-4">
          <h2 className="text-base font-black text-slate-900 uppercase tracking-wider text-xs">
            1. Trade & Registration Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Registered Business / Firm Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Mahaveer Building Materials & Infra"
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Year Established <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1900"
                max={new Date().getFullYear()}
                required
                value={yearEstablished}
                onChange={(e) => setYearEstablished(parseInt(e.target.value, 10))}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Permanent Account Number (PAN) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                maxLength={10}
                required
                value={panNumber}
                onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                placeholder="e.g. AAECM4567K"
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono tracking-widest focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">10-character alphanumeric PAN format</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                GSTIN Identification Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                maxLength={15}
                required
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                placeholder="e.g. 29AAECM4567K1Z5"
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono tracking-widest focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">15-character GSTIN format with State code</span>
            </div>
          </div>
        </div>

        {/* Inventory Catalog Multi-Select */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            2. Multi-Select Inventory Catalog <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-slate-500">
            Select all product categories your stockyards supply. You will receive real-time bids for these lines.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            {CONSTRUCTION_CATALOG.map((cat) => {
              const isSelected = catalogCategories.includes(cat.category);
              return (
                <button
                  key={cat.category}
                  type="button"
                  onClick={() => toggleCategory(cat.category)}
                  className={`p-3 rounded-2xl border text-left flex items-center justify-between transition ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-black'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-xs">{cat.category}</span>
                  {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Warehouse Geolocation */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h2 className="text-base font-black text-slate-900 uppercase tracking-wider text-xs">
            3. Warehouse / Stockyard PostGIS Geolocation
          </h2>
          <p className="text-xs text-slate-500">
            Your origin coordinates determine distance calculation (`ST_Distance`) to builder construction sites.
          </p>

          <MapCoordinatePicker
            latitude={latitude}
            longitude={longitude}
            addressText={addressText}
            onCoordinatesChange={(lat, lng, addr) => {
              setLatitude(lat);
              setLongitude(lng);
              if (addr) setAddressText(addr);
            }}
            onAddressChange={setAddressText}
          />
        </div>

        {/* Document Uploads */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h2 className="text-base font-black text-slate-900 uppercase tracking-wider text-xs">
            4. Statutory Documentation
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-2">
              <span className="text-xs font-bold text-slate-800 block">Company PAN Proof</span>
              <input
                type="file"
                accept=".pdf,.png,.jpg"
                onChange={handlePanUpload}
                className="text-xs text-slate-500 w-full"
              />
              {uploadingPan && <span className="text-[11px] text-amber-600">Uploading PAN...</span>}
              {idProofUrl && <span className="text-[11px] text-emerald-600 font-bold block">✓ PAN Attached</span>}
            </div>

            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-2">
              <span className="text-xs font-bold text-slate-800 block">GST Registration Certificate</span>
              <input
                type="file"
                accept=".pdf,.png,.jpg"
                onChange={handleGstUpload}
                className="text-xs text-slate-500 w-full"
              />
              {uploadingGst && <span className="text-[11px] text-amber-600">Uploading GST Certificate...</span>}
              {gstCertUrl && <span className="text-[11px] text-emerald-600 font-bold block">✓ GST Certificate Attached</span>}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-4 px-6 bg-slate-950 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold rounded-2xl text-sm flex items-center justify-center space-x-2 transition shadow-xl"
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Submit Statutory Vendor KYC & Activate Feed</span>
            </>
          )}
        </button>
      </form>

      {/* Email OTP Verification Modal */}
      {showEmailOtpModal && (
        <OtpModal
          defaultRole="vendor"
          onClose={() => setShowEmailOtpModal(false)}
          onSuccess={() => {
            refreshUser();
            setShowEmailOtpModal(false);
          }}
        />
      )}
    </div>
  );
}
