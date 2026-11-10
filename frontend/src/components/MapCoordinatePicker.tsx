'use client';

import React from 'react';
import { MapPin, Navigation, Compass, Check } from 'lucide-react';

interface MapCoordinatePickerProps {
  latitude: number;
  longitude: number;
  addressText: string;
  onCoordinatesChange: (lat: number, lng: number, suggestedAddress?: string) => void;
  onAddressChange: (address: string) => void;
}

const PRESET_HUBS = [
  {
    name: 'Whitefield Tech Cloud',
    city: 'Bengaluru',
    lat: 12.9698,
    lng: 77.7500,
    address: 'Prestige Tech Cloud Site, Whitefield, Bengaluru, KA 560066',
  },
  {
    name: 'Marathahalli Depot Hub',
    city: 'Bengaluru',
    lat: 12.9569,
    lng: 77.7011,
    address: 'Outer Ring Road, Marathahalli, Bengaluru, KA 560037',
  },
  {
    name: 'Electronic City Phase 1',
    city: 'Bengaluru',
    lat: 12.8452,
    lng: 77.6602,
    address: 'Sobha Silicon Oasis, Electronic City Phase 1, Bengaluru, KA 560100',
  },
  {
    name: 'Peenya Industrial Estate',
    city: 'Bengaluru',
    lat: 13.0285,
    lng: 77.5197,
    address: 'Peenya 2nd Stage Industrial Area, Bengaluru, KA 560058',
  },
  {
    name: 'Hoskote Industrial Corridor',
    city: 'Bengaluru Rural',
    lat: 13.0712,
    lng: 77.7981,
    address: 'Hoskote Industrial Area, Bengaluru Rural, KA 562114',
  },
];

export function MapCoordinatePicker({
  latitude,
  longitude,
  addressText,
  onCoordinatesChange,
  onAddressChange,
}: MapCoordinatePickerProps) {
  const handleUseCurrentLocation = () => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onCoordinatesChange(
            parseFloat(position.coords.latitude.toFixed(4)),
            parseFloat(position.coords.longitude.toFixed(4))
          );
        },
        () => {
          // Fallback to Whitefield if permission denied or unsupported in headless
          onCoordinatesChange(12.9698, 77.7500, 'Prestige Tech Cloud Site, Whitefield, Bengaluru');
        }
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* Address Textarea */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
          Delivery Site / Warehouse Physical Address <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={2}
          required
          value={addressText}
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder="e.g. Plot No 42, Prestige Tech Cloud Site, Whitefield, Bengaluru"
          className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
        />
      </div>

      {/* Geolocation Coordinates & Presets */}
      <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <Compass className="w-4 h-4" />
            <span>PostGIS Geolocation Coordinates (EPSG:4326)</span>
          </div>
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            className="flex items-center space-x-1.5 px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition"
          >
            <Navigation className="w-3 h-3 text-amber-400" />
            <span>Detect GPS</span>
          </button>
        </div>

        {/* Lat/Long Inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Latitude</label>
            <input
              type="number"
              step="0.0001"
              value={latitude || ''}
              onChange={(e) => onCoordinatesChange(parseFloat(e.target.value) || 0, longitude)}
              placeholder="e.g. 12.9698"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white font-mono focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Longitude</label>
            <input
              type="number"
              step="0.0001"
              value={longitude || ''}
              onChange={(e) => onCoordinatesChange(latitude, parseFloat(e.target.value) || 0)}
              placeholder="e.g. 77.7500"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white font-mono focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
        </div>

        {/* Quick Metro Hub Presets */}
        <div>
          <span className="block text-[11px] text-slate-400 mb-1.5 uppercase font-semibold">
            One-Click Metro Construction Hubs:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_HUBS.map((hub) => {
              const isSelected = Math.abs(hub.lat - latitude) < 0.001 && Math.abs(hub.lng - longitude) < 0.001;
              return (
                <button
                  key={hub.name}
                  type="button"
                  onClick={() => onCoordinatesChange(hub.lat, hub.lng, hub.address)}
                  className={`text-xs px-2.5 py-1 rounded-lg border flex items-center space-x-1 transition ${
                    isSelected
                      ? 'bg-amber-500 border-amber-400 text-slate-950 font-bold'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <MapPin className="w-3 h-3" />
                  <span>{hub.name}</span>
                  {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
