'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../lib/api';
import { MapCoordinatePicker } from '../../../components/MapCoordinatePicker';
import { 
  UserCheck, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Phone, 
  Mail,
  RefreshCw
} from 'lucide-react';

export default function BuilderKycPage() {
  const { user, refreshUser, loading: authLoading } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [addressText, setAddressText] = useState('Prestige Tech Cloud Site, Whitefield, Bengaluru');
  const [latitude, setLatitude] = useState(12.9698);
  const [longitude, setLongitude] = useState(77.7500);
  const [idProofType, setIdProofType] = useState('aadhaar');
  const [idProofUrl, setIdProofUrl] = useState('');

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.profile && user.role === 'builder') {
      const p = user.profile as any;
      setFirstName(p.firstName || '');
      setLastName(p.lastName || '');
      setEmail(user.email || '');
      setAddressText(p.addressText || '');
      if (p.location?.coordinates) {
        setLongitude(p.location.coordinates[0]);
        setLatitude(p.location.coordinates[1]);
      }
    }
  }, [user]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const res = await api.uploadDocument(file);
      setIdProofUrl(res.fileUrl);
      setMessage('Identity proof uploaded successfully.');
    } catch (err: any) {
      setError(err.message || 'File upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSaving(true);

    try {
      await api.submitBuilderKyc({
        firstName,
        lastName,
        email: email || undefined,
        addressText,
        latitude,
        longitude,
        idProofType,
        idProofUrl: idProofUrl || undefined,
      });

      await refreshUser();
      setMessage('Builder profile and site geolocation successfully updated!');
    } catch (err: any) {
      setError(err.message || 'Failed to save KYC.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return <div className="text-center py-20 text-slate-500">Loading profile...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <span className="text-xs font-black uppercase tracking-wider text-amber-600">
          Account Governance
        </span>
        <h1 className="text-3xl font-black text-slate-950">Builder KYC & Site Profile</h1>
        <p className="text-xs text-slate-500 mt-1">
          Complete mandatory verification to publish requisitions and transact with verified vendors.
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

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-6">
        
        {/* Verification Status Banner */}
        <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-sm">
                Phone Verification: <span className="text-emerald-400 font-mono">+{user?.phoneNumber} (Verified)</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Primary authentication via 6-digit SMS OTP
              </div>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-slate-800 border border-slate-700 text-amber-400 rounded-full">
            Role: Builder
          </span>
        </div>

        {/* Name Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. Rajesh"
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g. Kumar"
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
        </div>

        {/* Optional Email */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Billing / Notifications Email (Optional)
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. rajesh.infra@example.com"
              className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
        </div>

        {/* Map Geolocation Coordinates */}
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

        {/* ID Proof Document Upload */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Government Identity Proof (Aadhaar / PAN)
          </label>
          
          <div className="grid grid-cols-2 gap-3 mb-2">
            <button
              type="button"
              onClick={() => setIdProofType('aadhaar')}
              className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                idProofType === 'aadhaar'
                  ? 'border-amber-500 bg-amber-50 text-amber-900'
                  : 'border-slate-200 text-slate-600'
              }`}
            >
              Aadhaar Card
            </button>
            <button
              type="button"
              onClick={() => setIdProofType('pan')}
              className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                idProofType === 'pan'
                  ? 'border-amber-500 bg-amber-50 text-amber-900'
                  : 'border-slate-200 text-slate-600'
              }`}
            >
              PAN Card
            </button>
          </div>

          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:bg-slate-50 transition cursor-pointer relative">
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="flex flex-col items-center">
              <Upload className="w-8 h-8 text-slate-400 mb-2" />
              <span className="text-xs font-bold text-slate-700">
                {uploading ? 'Uploading document...' : 'Click or drag document to upload'}
              </span>
              <span className="text-[11px] text-slate-400 mt-1">PDF, PNG, JPG up to 10MB</span>
              {idProofUrl && (
                <div className="mt-3 text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Document Attached: {idProofUrl.split('/').pop()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 px-4 bg-slate-950 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold rounded-2xl text-sm flex items-center justify-center space-x-2 transition shadow-lg"
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <UserCheck className="w-4 h-4" />
              <span>Save Profile & Complete Builder KYC</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
