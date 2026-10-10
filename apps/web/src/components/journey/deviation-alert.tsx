'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
// import { Button } from '@/components/ui/button';

interface DeviationAlertProps {
  isOpen: boolean;
  onDismiss: () => void;
  onTimeout: () => void;
}

export function DeviationAlert({ isOpen, onDismiss, onTimeout }: DeviationAlertProps) {
  const [countdown, setCountdown] = useState(30);
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen) {
      setCountdown(30);
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            onTimeoutRef.current();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-[#14213D] rounded-3xl p-6 max-w-sm w-full border border-white/10 shadow-2xl relative overflow-hidden"
          >
            {/* Flashing background effect */}
            <motion.div
              className="absolute inset-0 bg-[#F5A524]/10 pointer-events-none"
              animate={{ opacity: [0, 0.5, 0] }}
              transition={{ repeat: Infinity, duration: 1 }}
            />

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="bg-[#F5A524]/20 p-4 rounded-full mb-4">
                <AlertTriangle className="w-12 h-12 text-[#F5A524]" />
              </div>
              
              <h2 className="text-2xl font-bold text-[#EEF3FA] mb-2">Are you okay?</h2>
              <p className="text-[#EEF3FA]/70 text-sm mb-6">
                We noticed you deviated from your planned route. We will alert your trusted contacts if you don't respond.
              </p>

              <div className="text-5xl font-mono font-bold text-[#F5A524] mb-8">
                {countdown}s
              </div>

              <button
                onClick={onDismiss}
                className="w-full py-4 rounded-2xl bg-white text-[#0B1426] font-bold text-lg hover:bg-white/90 transition-colors shadow-lg"
              >
                I'm Okay
              </button>
            </div>
            
            {/* Progress bar at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/20">
              <motion.div 
                className="h-full bg-[#F5A524]"
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 30, ease: 'linear' }}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
