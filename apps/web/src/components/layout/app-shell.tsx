'use client';

import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2, Shield } from 'lucide-react';
import Sidebar from './sidebar';
import BottomNav from './bottom-nav';
import { OfflineBanner } from './offline-banner';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-3">
        <div className="bg-primary/10 p-3 rounded-2xl">
          <Shield className="text-primary" size={32} />
        </div>
        <Loader2 className="animate-spin text-primary" size={20} />
        <p className="text-sm text-muted-foreground">Loading SAFESTEP…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <OfflineBanner />
      <Sidebar />
      <main className="flex-1 pb-16 lg:pb-0 lg:pl-64">{children}</main>
      <BottomNav />
    </div>
  );
}
