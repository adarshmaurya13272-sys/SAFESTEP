'use client';
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SOSButtonProps {
  onActivate: () => void;
  className?: string;
}

export function SOSButton({ onActivate, className }: SOSButtonProps) {
  const [isPressing, setIsPressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const HOLD_TIME = 2000; // 2 seconds

  const startPress = () => {
    setIsPressing(true);
    setProgress(0);

    const startTime = Date.now();

    progressInterval.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / HOLD_TIME) * 100, 100);
      setProgress(newProgress);

      if (newProgress >= 100) {
        if (progressInterval.current) clearInterval(progressInterval.current);
      }
    }, 50);

    pressTimer.current = setTimeout(() => {
      setIsPressing(false);
      setProgress(0);
      onActivate();
    }, HOLD_TIME);
  };

  const cancelPress = () => {
    setIsPressing(false);
    setProgress(0);
    if (pressTimer.current) clearTimeout(pressTimer.current);
    if (progressInterval.current) clearInterval(progressInterval.current);
  };

  useEffect(() => {
    return () => {
      if (pressTimer.current) clearTimeout(pressTimer.current);
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, []);

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      {/* Pulse animation when idle */}
      {!isPressing && (
        <motion.div
          className="absolute inset-0 rounded-full bg-[#DC2626]/20"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.7, 0, 0.7],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Progress ring when pressing */}
      <svg className="absolute w-[120px] h-[120px] pointer-events-none" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="transparent"
          stroke="rgba(220, 38, 38, 0.2)"
          strokeWidth="6"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="transparent"
          stroke="#DC2626"
          strokeWidth="6"
          strokeDasharray="283"
          strokeDashoffset={283 - (283 * progress) / 100}
          strokeLinecap="round"
          className="transition-all duration-75 ease-linear origin-center -rotate-90"
        />
      </svg>

      <button
        type="button"
        role="button"
        aria-label="Hold to activate SOS"
        className="relative z-10 w-[80px] h-[80px] rounded-full bg-gradient-to-b from-[#EF4444] to-[#B91C1C] shadow-[0_0_20px_rgba(220,38,38,0.5)] flex items-center justify-center border-[3px] border-[#DC2626] active:scale-95 transition-transform"
        onMouseDown={startPress}
        onMouseUp={cancelPress}
        onMouseLeave={cancelPress}
        onTouchStart={startPress}
        onTouchEnd={cancelPress}
      >
        <Shield className="w-10 h-10 text-white drop-shadow-md" />
      </button>

      <AnimatePresence>
        {isPressing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute -top-12 whitespace-nowrap bg-[#14213D] text-[#EEF3FA] text-xs font-bold px-3 py-1.5 rounded-lg border border-white/10"
          >
            Hold for {Math.ceil((HOLD_TIME - (progress / 100) * HOLD_TIME) / 1000)}s
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
