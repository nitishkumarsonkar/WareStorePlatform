'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../lib/api';
import { Project, Bid } from '../../../types';
import { LeaderboardTable } from '../../../components/LeaderboardTable';
import Link from 'next/link';
import { 
  Layers, 
  PlusCircle, 
  Calendar, 
  MapPin, 
  Truck, 
  Trophy, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  XCircle,
  FileText,
  Sparkles
} from 'lucide-react';

export default function BuilderProjectsPage() {
  const { user, switchPersona, loading: authLoading } = useAuth();
  
  const [statusTab, setStatusTab] = useState<'open' | 'closed' | 'cancelled'>('open');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<Bid[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [bidsLoading, setBidsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await api.getProjects(statusTab);
      setProjects(data);
      if (data.length > 0) {
        // If current selected is not in data, pick first
        if (!selectedProjectId || !data.some((p) => p.id === selectedProjectId)) {
          setSelectedProjectId(data[0].id);
        }
      } else {
        setSelectedProjectId(null);
        setLeaderboard([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load projects.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async (projId: string) => {
    try {
      setBidsLoading(true);
      const bids = await api.getProjectLeaderboard(projId);
      setLeaderboard(bids);
    } catch (err: any) {
      console.error('Error fetching leaderboard:', err);
    } finally {
      setBidsLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'builder') {
      fetchProjects();
    }
  }, [user, statusTab]);

  useEffect(() => {
    if (selectedProjectId) {
      fetchLeaderboard(selectedProjectId);
    }
  }, [selectedProjectId]);

  const handleCancelProject = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this requisition? Active vendor bids will be discarded.')) {
      return;
    }
    try {
      await api.updateProjectStatus(id, 'cancelled');
      await fetchProjects();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel requisition.');
    }
  };

  if (authLoading) {
    return <div className="text-center py-20 text-slate-500">Authenticating...</div>;
  }

  if (!user || user.role !== 'builder') {
    return (
      <div className="max-w-md mx-auto text-center py-16 px-6 bg-white rounded-3xl border border-slate-200 shadow-xl space-y-4">
        <h2 className="text-xl font-black text-slate-900">Builder Access Required</h2>
        <p className="text-xs text-slate-600">
          Sign in as a builder to view your requisition dashboard and live vendor quotes.
        </p>
        <button
          onClick={() => switchPersona('builder', '9876543210')}
          className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center space-x-2 transition shadow-md"
        >
          <Sparkles className="w-4 h-4" />
          <span>Switch to Demo Builder (Rajesh Kumar)</span>
        </button>
      </div>
    );
  }

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="space-y-8">
      {/* Header with New Requisition CTA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-amber-600">
            Builder Dashboard
          </span>
          <h1 className="text-3xl font-black text-slate-950">Material Requisitions & Bids</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review incoming supplier quotes, track delivery timelines, and award procurement orders.
          </p>
        </div>

        <Link
          href="/builder/wizard"
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-2 transition shadow-md"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Requisition</span>
        </Link>
      </div>

      {/* State Tabs: Open, Closed, Cancelled */}
      <div className="flex border-b border-slate-200 space-x-2">
        {(['open', 'closed', 'cancelled'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setStatusTab(tab)}
            className={`py-3 px-6 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
              statusTab === tab
                ? 'border-amber-500 text-slate-900 bg-amber-50/40 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            {tab} Requisitions
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm">Loading your requisitions...</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white border border-slate-200 rounded-3xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No {statusTab} requisitions found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {statusTab === 'open'
              ? 'Post a new material requisition using our cascading wizard to invite vendor bids.'
              : `You have no ${statusTab} requisitions in this tab.`}
          </p>
          {statusTab === 'open' && (
            <Link
              href="/builder/wizard"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-black mt-2 shadow"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Launch Wizard</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Requisition Cards List */}
          <div className="lg:col-span-5 space-y-3">
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
              {projects.length} Requisitions in {statusTab.toUpperCase()} state
            </span>

            {projects.map((proj) => {
              const isSelected = proj.id === selectedProjectId;
              return (
                <div
                  key={proj.id}
                  onClick={() => setSelectedProjectId(proj.id)}
                  className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'border-amber-500 bg-white shadow-md ring-2 ring-amber-400/40'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[10px] uppercase">
                        {proj.category}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900 mt-1">{proj.sub_item}</h3>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-black text-slate-900">
                        {proj.quantity.toLocaleString()} {proj.unit}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {proj.total_bids || 0} Quotes Received
                      </div>
                    </div>
                  </div>

                  {/* Summary row */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      Req: {proj.requirement_date}
                    </span>
                    {proj.lowest_quote ? (
                      <span className="font-bold text-emerald-600 font-mono">
                        Best: ₹{proj.lowest_quote.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">No quotes yet</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Requisition Details & Live Leaderboard */}
          <div className="lg:col-span-7 space-y-6">
            {selectedProject && (
              <>
                {/* Project Quick Overview Banner */}
                <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-[10px] uppercase font-black text-amber-400 tracking-wider">
                        Requisition #{selectedProject.id.slice(0, 8)}
                      </span>
                      <h2 className="text-xl font-black">{selectedProject.sub_item}</h2>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-xs font-black uppercase px-2.5 py-1 rounded-full ${
                          selectedProject.status === 'open'
                            ? 'bg-amber-400/20 text-amber-400'
                            : selectedProject.status === 'closed'
                            ? 'bg-emerald-400/20 text-emerald-400'
                            : 'bg-red-400/20 text-red-400'
                        }`}
                      >
                        ● {selectedProject.status}
                      </span>

                      {selectedProject.status === 'open' && (
                        <button
                          type="button"
                          onClick={() => handleCancelProject(selectedProject.id)}
                          className="px-2.5 py-1 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-950/40 text-[11px] font-bold transition"
                        >
                          Cancel Requisition
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase">Volume</span>
                      <div className="font-mono font-bold text-sm text-white mt-0.5">
                        {selectedProject.quantity.toLocaleString()} {selectedProject.unit}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase">Target Date</span>
                      <div className="font-semibold text-white mt-0.5">{selectedProject.requirement_date}</div>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase">Logistics</span>
                      <div className="font-semibold text-white mt-0.5">
                        {selectedProject.transport_needed ? 'Vendor Freight' : 'Self Pickup'}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase">Brand Pref</span>
                      <div className="font-semibold text-white mt-0.5 truncate">
                        {selectedProject.brand_preference || 'Any Standard'}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 pt-2 border-t border-slate-800 flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span>{selectedProject.address_text}</span>
                  </div>
                </div>

                {/* Open Bids Leaderboard Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Trophy className="w-5 h-5 text-amber-500" />
                      <h3 className="text-base font-black text-slate-900">
                        Live Vendor Quotes Leaderboard
                      </h3>
                    </div>
                    <span className="text-xs text-slate-500 font-semibold">
                      Ranked by Total Value & PostGIS Distance
                    </span>
                  </div>

                  {bidsLoading ? (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      Computing leaderboard ranking...
                    </div>
                  ) : (
                    <LeaderboardTable
                      bids={leaderboard}
                      isProjectOpen={selectedProject.status === 'open'}
                      onBidAccepted={() => {
                        fetchProjects();
                        if (selectedProjectId) fetchLeaderboard(selectedProjectId);
                      }}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
