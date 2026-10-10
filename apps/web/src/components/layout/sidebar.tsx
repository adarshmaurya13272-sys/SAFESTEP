'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Map as MapIcon, Navigation, Info, User, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'Route Planning', href: '/route', icon: MapIcon },
    { name: 'Active Journey', href: '/journey', icon: Navigation },
    { name: 'Help Finder', href: '/help', icon: Info },
    { name: 'Incidents Map', href: '/incidents', icon: AlertTriangle },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-navy text-white hidden lg:flex flex-col z-50">
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl font-heading font-bold text-primary tracking-wider">SAFESTEP</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                isActive 
                  ? "bg-primary text-navy font-bold shadow-lg" 
                  : "text-surface/80 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon size={20} className={isActive ? "" : "opacity-80"} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 text-xs text-surface/50 border-t border-white/10">
        <p className="mb-2 font-bold text-surface/70">SAFESTEP · by NEXORA</p>
        <p>Assists but does not replace emergency services.</p>
      </div>
    </aside>
  );
}
