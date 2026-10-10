'use client';
import React from 'react';
import { Clock, MapPin, Building, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
// import { Button } from '@/components/ui/button';

interface JourneyPanelProps {
  elapsedTime: string; // e.g. "00:15"
  eta: string; // e.g. "12 mins"
  progress: number; // 0-100
  nearestPolice?: { name: string; distance: string };
  nearestHospital?: { name: string; distance: string };
  onArrived: () => void;
  className?: string;
}

export function JourneyPanel({
  elapsedTime,
  eta,
  progress,
  nearestPolice,
  nearestHospital,
  onArrived,
  className
}: JourneyPanelProps) {
  return (
    <div className={cn("bg-[#14213D] rounded-2xl border border-white/10 p-4 shadow-xl text-[#EEF3FA]", className)}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex flex-col">
          <span className="text-xs text-[#EEF3FA]/60 font-medium uppercase tracking-wider">Elapsed</span>
          <div className="flex items-center gap-1.5 text-lg font-bold">
            <Clock className="w-4 h-4 text-[#38BDF8]" />
            {elapsedTime}
          </div>
        </div>
        
        <div className="flex flex-col items-end">
          <span className="text-xs text-[#EEF3FA]/60 font-medium uppercase tracking-wider">ETA</span>
          <div className="flex items-center gap-1.5 text-lg font-bold text-[#F5A524]">
            {eta}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="h-2 bg-[#0B1426] rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#38BDF8] to-cyan-300 rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs mt-1 text-[#EEF3FA]/50">
          <span>Start</span>
          <span>{progress.toFixed(0)}%</span>
          <span>Destination</span>
        </div>
      </div>

      <div className="space-y-3 mb-6 bg-[#0B1426]/50 p-3 rounded-xl border border-white/5">
        <h4 className="text-xs font-semibold text-[#EEF3FA]/70 uppercase tracking-wide">Nearest Safe Points</h4>
        
        {nearestPolice ? (
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#38BDF8]" />
              <span className="truncate max-w-[150px]">{nearestPolice.name}</span>
            </div>
            <span className="font-mono text-xs">{nearestPolice.distance}</span>
          </div>
        ) : null}

        {nearestHospital ? (
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-[#DC2626]" />
              <span className="truncate max-w-[150px]">{nearestHospital.name}</span>
            </div>
            <span className="font-mono text-xs">{nearestHospital.distance}</span>
          </div>
        ) : null}
      </div>

      <button 
        onClick={onArrived}
        className="w-full py-3.5 rounded-xl bg-[#38BDF8] text-[#0B1426] font-bold text-sm hover:bg-[#38BDF8]/90 transition-colors flex items-center justify-center gap-2"
      >
        <MapPin className="w-4 h-4" />
        I&apos;ve Arrived Safely
      </button>
    </div>
  );
}
