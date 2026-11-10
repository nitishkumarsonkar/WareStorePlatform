'use client';

import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { RequisitionWizard } from '../../../components/RequisitionWizard';
import { Building2, Sparkles } from 'lucide-react';

export default function RequisitionWizardPage() {
  const { user, switchPersona, loading } = useAuth();

  if (loading) {
    return (
      <div className="text-center py-24 text-slate-400">
        Loading builder environment...
      </div>
    );
  }

  // If user is not authenticated as builder, provide a prompt and fast-login button
  if (!user || user.role !== 'builder') {
    return (
      <div className="max-w-md mx-auto text-center py-16 px-6 bg-white rounded-3xl border border-slate-200 shadow-xl space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
          <Building2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Builder Access Required</h2>
        <p className="text-xs text-slate-600">
          You need an active Builder session to create construction material requisitions.
        </p>
        <button
          onClick={() => switchPersona('builder', '9876543210')}
          className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center space-x-2 transition shadow-md"
        >
          <Sparkles className="w-4 h-4" />
          <span>Login as Demo Builder (Rajesh Kumar - Whitefield)</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <RequisitionWizard />
    </div>
  );
}
