import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Clock, Navigation, Info } from 'lucide-react';

interface RouteCardProps {
  id: string;
  distance: string;
  duration: string;
  safetyScore: number; // 0-100
  confidence: 'Low' | 'Medium' | 'High';
  factors: string[];
  isRecommended?: boolean;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function RouteCard({
  id,
  distance,
  duration,
  safetyScore,
  confidence,
  factors,
  isRecommended,
  selected,
  onClick,
  className
}: RouteCardProps) {
  // Determine colors based on score
  let scoreColor = 'text-green-400';
  let scoreBg = 'bg-green-500/10 border-green-500/20';
  let gaugeColor = '#4ADE80'; // green-400

  if (safetyScore < 40) {
    scoreColor = 'text-[#DC2626]'; // red
    scoreBg = 'bg-[#DC2626]/10 border-[#DC2626]/20';
    gaugeColor = '#DC2626';
  } else if (safetyScore < 70) {
    scoreColor = 'text-[#F5A524]'; // amber
    scoreBg = 'bg-[#F5A524]/10 border-[#F5A524]/20';
    gaugeColor = '#F5A524';
  }

  // Circular gauge calculations
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safetyScore / 100) * circumference;

  return (
    <div 
      onClick={onClick}
      className={cn(
        "relative bg-[#14213D] rounded-2xl border p-4 cursor-pointer transition-all hover:border-[#38BDF8]/50",
        selected ? "border-[#38BDF8] ring-1 ring-[#38BDF8] shadow-[0_0_15px_rgba(56,189,248,0.2)]" : "border-white/10",
        className
      )}
    >
      {isRecommended && (
        <div className="absolute -top-3 left-4">
          <Badge variant="default" className="shadow-lg">Recommended</Badge>
        </div>
      )}
      
      <div className="flex justify-between items-start mt-1 mb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-lg font-bold text-[#EEF3FA]">
            {duration}
          </div>
          <div className="flex items-center gap-2 text-sm text-[#EEF3FA]/60">
            <Navigation className="w-3.5 h-3.5" />
            {distance}
          </div>
        </div>

        <div className={cn("flex flex-col items-center p-2 rounded-xl border min-w-[70px]", scoreBg)}>
          <div className="relative w-12 h-12 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
              <circle
                cx="24"
                cy="24"
                r={radius}
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                className="text-white/10"
              />
              <circle
                cx="24"
                cy="24"
                r={radius}
                stroke={gaugeColor}
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <span className={cn("font-bold text-sm", scoreColor)}>{safetyScore}</span>
          </div>
          <span className="text-[10px] uppercase font-bold text-[#EEF3FA]/70 mt-1">Score</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#EEF3FA]/50 font-medium">Confidence:</span>
          <span className={cn(
            "text-xs font-semibold px-2 py-0.5 rounded-md bg-[#0B1426]",
            confidence === 'High' ? "text-green-400" : confidence === 'Medium' ? "text-[#F5A524]" : "text-[#DC2626]"
          )}>
            {confidence}
          </span>
        </div>
        
        <div className="bg-[#0B1426] p-2.5 rounded-xl border border-white/5">
          <ul className="text-xs text-[#EEF3FA]/80 space-y-1.5">
            {factors.slice(0, 3).map((factor, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] mt-1 shrink-0" />
                <span className="line-clamp-1">{factor}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="mt-3 flex items-start gap-1.5 text-[10px] text-[#EEF3FA]/40">
        <Info className="w-3 h-3 shrink-0" />
        <p>Score based on lighting, crowd density, and historical data.</p>
      </div>
    </div>
  );
}
