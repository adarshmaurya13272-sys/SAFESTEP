'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Navigation, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';

export default function LandingPage() {
  const router = useRouter();
  const { loginDemo, isAuthenticated } = useAuthStore();
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const handleDemoMode = async () => {
    setIsDemoLoading(true);
    try {
      await loginDemo();
      toast.success('Welcome to SAFESTEP demo');
      router.push('/dashboard');
    } catch {
      toast.error('Demo mode unavailable. The API server may not be running — try registering instead.');
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#0B1426] to-[#14213D] text-white overflow-hidden">
      <main className="flex-grow flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          className="max-w-3xl w-full"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="mb-6 relative inline-block">
            <h1 className="text-6xl md:text-8xl font-heading font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-200 drop-shadow-[0_0_15px_rgba(56,189,248,0.5)]">
              SAFESTEP
            </h1>
          </motion.div>

          <motion.p variants={itemVariants} className="text-xl md:text-3xl text-[#EEF3FA]/90 mb-12 font-sans font-medium">
            Choose a safer route. Stay connected. Get help faster.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <Link href="/register" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-primary text-[#0B1426] hover:bg-primary/90 transition-all font-bold text-lg flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(56,189,248,0.3)]">
                Get Started <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
            <button
              onClick={handleDemoMode}
              disabled={isDemoLoading}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl border-2 border-primary/50 text-primary hover:bg-primary/10 transition-all text-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isDemoLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {isAuthenticated ? 'Continue to Dashboard' : 'Enter Demo Mode'}
            </button>
          </motion.div>

          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 text-left">
            <div className="bg-[#14213D] p-6 rounded-2xl border border-white/10 shadow-lg">
              <div className="bg-primary/20 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
                <Navigation className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Plan a safer route</h3>
              <p className="text-[#EEF3FA]/70">Compare multiple route options with real-time safety scores based on lighting, crowd density, and history.</p>
            </div>

            <div className="bg-[#14213D] p-6 rounded-2xl border border-white/10 shadow-lg">
              <div className="bg-primary/20 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Stay connected</h3>
              <p className="text-[#EEF3FA]/70">Share your live location securely with trusted contacts. Automatic alerts if you deviate from your path.</p>
            </div>

            <div className="bg-[#14213D] p-6 rounded-2xl border border-white/10 shadow-lg">
              <div className="bg-[#DC2626]/20 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-[#DC2626]" />
              </div>
              <h3 className="text-xl font-bold mb-2">Get help faster</h3>
              <p className="text-[#EEF3FA]/70">One-tap SOS activates a distress signal and directs you to the nearest verified safe location.</p>
            </div>
          </motion.div>
        </motion.div>
      </main>

      <footer className="py-8 px-4 text-center border-t border-white/5 bg-[#0B1426]/50">
        <p className="text-[#F5A524] text-sm mb-2 max-w-2xl mx-auto bg-[#F5A524]/10 p-3 rounded-xl border border-[#F5A524]/20">
          ⚠️ SAFESTEP assists but does not replace emergency services. In danger, call your local emergency number.
        </p>
        <p className="mt-4 text-sm text-[#EEF3FA]/50 font-bold tracking-wider">
          SAFESTEP · by NEXORA
        </p>
      </footer>
    </div>
  );
}
