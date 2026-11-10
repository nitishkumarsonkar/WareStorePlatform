'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../lib/api';
import { Project } from '../../../types';
import { SlideOverBidDrawer } from '../../../components/SlideOverBidDrawer';
import { CONSTRUCTION_CATALOG } from '../../../lib/catalog';
import { 
  Compass, 
  MapPin, 
  SlidersHorizontal, 
  Truck, 
  Calendar, 
  Search, 
  Trophy, 
  CheckCircle2, 
  Layers, 
  Clock, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function VendorFeedPage() {
  const { user, switchPersona, loading: authLoading } = useAuth();

  // Filters
  const [distanceKm, setDistanceKm] = useState<number>(50); // Slider: 0 - 100 km
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSubItem, setSelectedSubItem] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'relevance' | 'distance' | 'quantity' | 'date'>('relevance');

  // Data & Drawer
  const [feed, setFeed] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProjectForBid, setSelectedProjectForBid] = useState<Project | null>(null);

  const fetchFeed = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getMarketplaceFeed({
        distance_km: distanceKm,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        sub_item: selectedSubItem !== 'All' ? selectedSubItem : undefined,
        search: searchQuery || undefined,
        sort_by: sortBy,
      });
      setFeed(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load marketplace feed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'vendor') {
      fetchFeed();
    }
  }, [user, distanceKm, selectedCategory, selectedSubItem, sortBy]);

  // Handle Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFeed();
  };

  if (authLoading) {
    return <div className="text-center py-20 text-slate-500">Authenticating...</div>;
  }

  if (!user || user.role !== 'vendor') {
    return (
      <div className="max-w-md mx-auto text-center py-16 px-6 bg-white rounded-3xl border border-slate-200 shadow-xl space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
          <Compass className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Vendor Access Required</h2>
        <p className="text-xs text-slate-600">
          Sign in as a registered vendor to browse PostGIS-filtered requisitions and submit bids.
        </p>
        <button
          onClick={() => switchPersona('vendor', '9900112233')}
          className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 font-black text-sm flex items-center justify-center space-x-2 transition shadow-md"
        >
          <Sparkles className="w-4 h-4" />
          <span>Login as Demo Vendor (Mahaveer Infra - Marathahalli)</span>
        </button>
      </div>
    );
  }

  const currentCatDef = CONSTRUCTION_CATALOG.find((c) => c.category === selectedCategory);

  return (
    <div className="space-y-8">
      {/* Feed Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-emerald-600">
            Real-Time Demand Feed
          </span>
          <h1 className="text-3xl font-black text-slate-950">Marketplace Discovery</h1>
          <p className="text-xs text-slate-500 mt-1">
            Active builder requisitions matching your product line and geospatial radius.
          </p>
        </div>

        {/* Current Vendor Location Pill */}
        <div className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-slate-200 rounded-2xl shadow-sm text-xs">
          <MapPin className="w-4 h-4 text-emerald-600" />
          <span className="font-bold text-slate-800">{user.profileName || 'Your Warehouse'}</span>
          <span className="text-[10px] text-slate-400">• PostGIS Origin Point</span>
        </div>
      </div>

      {/* Filter Control Console */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
        
        {/* Top Search & Sort Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <form onSubmit={handleSearchSubmit} className="md:col-span-8 relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by material, grade, site address, or brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-24 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 px-3 py-1.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition"
            >
              Search
            </button>
          </form>

          <div className="md:col-span-4 flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="relevance">Relevance (Un-bid first)</option>
              <option value="distance">Nearest Distance First</option>
              <option value="quantity">Highest Quantity First</option>
              <option value="date">Most Recently Posted</option>
            </select>
          </div>
        </div>

        {/* PostGIS Geolocation Radius Slider (0 to 100 km) */}
        <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-bold">
              <Compass className="w-4 h-4 text-amber-400" />
              <span>PostGIS Spatial Radius Filter (ST_DWithin)</span>
            </div>
            <div className="px-3 py-1 bg-amber-500 text-slate-950 font-black text-xs rounded-full font-mono shadow">
              Within {distanceKm} km
            </div>
          </div>

          <div className="relative flex items-center">
            <input
              type="range"
              min="1"
              max="100"
              step="1"
              value={distanceKm}
              onChange={(e) => setDistanceKm(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>

          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>0 km (Depot Immediate)</span>
            <span>25 km (Local Metro)</span>
            <span>50 km (Suburban)</span>
            <span>100 km (Regional Corridor)</span>
          </div>
        </div>

        {/* Category Pills Filter */}
        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
            Material Categories
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('All');
                setSelectedSubItem('All');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedCategory === 'All'
                  ? 'bg-slate-900 text-white shadow'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Categories
            </button>
            {CONSTRUCTION_CATALOG.map((cat) => (
              <button
                key={cat.category}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.category);
                  setSelectedSubItem('All');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  selectedCategory === cat.category
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat.category}
              </button>
            ))}
          </div>
        </div>

        {/* Cascading Sub-Item Filter if Category selected */}
        {currentCatDef && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Sub-Items:</span>
            <button
              type="button"
              onClick={() => setSelectedSubItem('All')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                selectedSubItem === 'All'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All {selectedCategory}
            </button>
            {currentCatDef.subItems.map((si) => (
              <button
                key={si}
                type="button"
                onClick={() => setSelectedSubItem(si)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                  selectedSubItem === si
                    ? 'bg-emerald-100 text-emerald-800 font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {si}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Feed Cards Stream */}
      {loading ? (
        <div className="text-center py-20 text-slate-400 text-sm">
          Searching geospatial database within {distanceKm} km...
        </div>
      ) : feed.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white border border-slate-200 rounded-3xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Compass className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            No active requisitions within {distanceKm} km
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try expanding your distance radius slider to 75 km or 100 km, or select &quot;All Categories&quot; to discover broader builder demand.
          </p>
          <button
            type="button"
            onClick={() => setDistanceKm(100)}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold mt-2"
          >
            Expand Radius to 100 km
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Showing <strong>{feed.length}</strong> matching requisitions within {distanceKm} km</span>
            <span>Hover or click any project to submit a quote</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {feed.map((project) => {
              const hasBid = project.has_submitted_bid;

              return (
                <div
                  key={project.id}
                  onClick={() => setSelectedProjectForBid(project)}
                  className={`group bg-white rounded-3xl p-6 border-2 transition-all duration-300 cursor-pointer flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 ${
                    hasBid
                      ? 'border-emerald-300 bg-emerald-50/20'
                      : 'border-slate-200 hover:border-emerald-500'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Card Badges */}
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold text-[10px] uppercase">
                        {project.category}
                      </span>

                      <div className="flex items-center space-x-1 text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full font-mono font-bold text-xs">
                        <MapPin className="w-3 h-3 text-emerald-600" />
                        <span>{project.distance_km} km</span>
                      </div>
                    </div>

                    {/* Title & Specs */}
                    <div>
                      <h3 className="text-base font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {project.sub_item}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Brand: <strong>{project.brand_preference || 'Any Standard Brand'}</strong>
                      </p>
                    </div>

                    {/* Volume and Logistics */}
                    <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Volume</span>
                        <div className="text-sm font-black text-slate-900 font-mono mt-0.5">
                          {project.quantity.toLocaleString()} {project.unit}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Logistics</span>
                        <div className="text-xs font-semibold text-slate-700 flex items-center gap-1 mt-0.5">
                          <Truck className="w-3 h-3 text-slate-400" />
                          {project.transport_needed ? 'Delivery Req.' : 'Self Pickup'}
                        </div>
                      </div>
                    </div>

                    {/* Site Location */}
                    <div className="text-xs text-slate-600">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Site Address:</span>
                      <p className="truncate text-[11px] font-medium text-slate-800 mt-0.5">{project.address_text}</p>
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        Needed by {project.requirement_date}
                      </span>
                      <span className="text-slate-400 font-mono">
                        {project.total_bids || 0} Quotes
                      </span>
                    </div>
                  </div>

                  {/* Card Bottom CTA */}
                  <div className="mt-5 pt-3 border-t border-slate-100">
                    {hasBid ? (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center text-xs font-bold text-emerald-700 gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          Quote Submitted
                        </span>
                        <span className="font-mono font-black text-xs text-slate-900">
                          ₹{project.my_bid_amount?.toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="w-full py-2.5 px-4 rounded-xl bg-slate-900 group-hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition shadow"
                      >
                        <span>Submit Quote (Drawer)</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Slide-Over Drawer */}
      <SlideOverBidDrawer
        project={selectedProjectForBid}
        onClose={() => setSelectedProjectForBid(null)}
        onBidSubmitted={() => {
          fetchFeed();
        }}
      />
    </div>
  );
}
