import React from 'react';
import { Need } from '../types';
import { motion } from 'motion/react';

interface MapViewProps {
  needs: Need[];
}

export function MapView({ needs }: MapViewProps) {
  // We'll use a grid system to simulate a map dashboard
  // Each bubble matches the relative lat/lng mapped to 0-100%
  
  const minLat = Math.min(...needs.map(n => n.location.lat), 18.9);
  const maxLat = Math.max(...needs.map(n => n.location.lat), 19.3);
  const minLng = Math.min(...needs.map(n => n.location.lng), 72.7);
  const maxLng = Math.max(...needs.map(n => n.location.lng), 73.1);

  const getPos = (lat: number, lng: number) => {
    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    const y = 100 - ((lat - minLat) / (maxLat - minLat)) * 100; // Invert latitude for top-down Y
    return { x: `${Math.max(5, Math.min(95, x))}%`, y: `${Math.max(5, Math.min(95, y))}%` };
  };

  return (
    <div className="relative w-full h-full bg-slate-100 overflow-hidden cursor-crosshair">
      {/* Simulation Grid */}
      <div className="absolute inset-0 grid grid-cols-[repeat(20,minmax(0,1fr))] grid-rows-[repeat(20,minmax(0,1fr))] opacity-[0.05]">
        {Array.from({ length: 400 }).map((_, i) => (
          <div key={i} className="border border-slate-900" />
        ))}
      </div>

      {/* Axis Labels */}
      <div className="absolute bottom-2 left-2 text-[8px] font-mono text-slate-400 uppercase tracking-widest bg-white/50 px-1">
        Loc_Index: 72.827_19.076
      </div>

      <div className="absolute inset-0">
        {needs.map((need) => {
          const pos = getPos(need.location.lat, need.location.lng);
          const isCritical = need.severity === 'critical' || need.priorityScore > 80;
          const isResolved = need.status === 'resolved';

          return (
            <motion.div
              key={need.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute"
              style={{ left: pos.x, top: pos.y }}
            >
              <div className="group relative -translate-x-1/2 -translate-y-1/2">
                <div 
                  className={`h-4 w-4 rounded-full border-2 border-white transition-all ${
                    isResolved 
                      ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' 
                      : isCritical 
                        ? 'pulse-dot bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.6)]' 
                        : 'bg-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.4)]'
                  }`}
                />
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block transition-all z-20">
                  <div className="bg-slate-900 text-white text-[10px] p-2 rounded-lg whitespace-nowrap shadow-xl border border-slate-700">
                    <p className="font-bold uppercase tracking-wider text-slate-400 mb-1">{need.category}</p>
                    <p className="font-medium max-w-[150px] whitespace-normal leading-tight">{need.description}</p>
                    <p className="mt-1 font-mono text-blue-400">P_Index: {need.priorityScore}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Map Legend */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur p-3 rounded-xl border shadow-sm text-[10px] font-bold space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
                      <span>CRITICAL (PRIORITY &gt; 80)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-blue-500" />
          <span>ACTIVE NEED</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>STABILIZED</span>
        </div>
      </div>
    </div>
  );
}
