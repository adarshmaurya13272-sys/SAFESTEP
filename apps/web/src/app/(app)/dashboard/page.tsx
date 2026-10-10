'use client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Map as MapIcon, AlertTriangle, Users, Navigation, Clock, Siren, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { useJourneyStore } from '@/stores/journey-store';
import { formatDistance, formatDuration, formatDate } from '@/lib/utils';

interface JourneyRow {
  id: string;
  status: string;
  distance: number;
  duration: number;
  startedAt: string;
  endedAt: string | null;
}

const statusChip: Record<string, { label: string; className: string; icon: typeof Clock }> = {
  ACTIVE: { label: 'In progress', className: 'bg-primary/20 text-primary', icon: Navigation },
  SOS: { label: 'SOS triggered', className: 'bg-destructive/20 text-destructive', icon: Siren },
  COMPLETED: { label: 'Completed', className: 'bg-green-500/20 text-green-500', icon: CheckCircle2 },
};

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const journey = useJourneyStore((s) => s.journey);

  const { data: journeys, isLoading } = useQuery({
    queryKey: ['journeys'],
    queryFn: async () => {
      const res = await api.get('/journeys');
      return res.data as JourneyRow[];
    },
  });

  const recent = journeys?.slice(0, 4) ?? [];
  const activeJourney = journey ?? journeys?.find((j) => j.status === 'ACTIVE' || j.status === 'SOS');

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-foreground">
          Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋
        </h1>
        <p className="text-muted-foreground mt-1">Ready to start your safe journey?</p>
      </header>

      {/* Active journey banner */}
      {activeJourney && (
        <Link href="/journey" className="block">
          <Card className="bg-primary/10 border-primary/40 hover:bg-primary/15 transition-colors">
            <CardContent className="p-4 md:p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="bg-primary/20 p-3 rounded-xl flex-shrink-0">
                  {activeJourney.status === 'SOS' ? (
                    <Siren className="text-destructive animate-pulse" size={24} />
                  ) : (
                    <Navigation className="text-primary" size={24} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-bold">
                    {activeJourney.status === 'SOS' ? 'SOS is active on your journey' : 'You have a journey in progress'}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    Tap to open live tracking and controls
                  </p>
                </div>
              </div>
              <Button className="flex-shrink-0">Resume</Button>
            </CardContent>
          </Card>
        </Link>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/10 border-primary/20 hover:bg-primary/20 transition-colors">
          <CardHeader>
            <MapIcon className="text-primary mb-2" size={32} />
            <CardTitle>Plan a Route</CardTitle>
            <CardDescription>Find the safest path to your destination.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/route">
              <Button className="w-full">Start Planning</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-warning/10 border-warning/20 hover:bg-warning/20 transition-colors">
          <CardHeader>
            <AlertTriangle className="text-warning mb-2" size={32} />
            <CardTitle>Incidents Map</CardTitle>
            <CardDescription>View reports and danger zones nearby.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/incidents">
              <Button variant="outline" className="w-full border-warning/50 text-warning hover:bg-warning/20">View Map</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border">
          <CardHeader>
            <Users className="text-foreground mb-2" size={32} />
            <CardTitle>Trusted Contacts</CardTitle>
            <CardDescription>Manage who can see your journey.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/contacts">
              <Button variant="outline" className="w-full">Manage Contacts</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-heading font-bold mb-4">Recent Journeys</h2>
          <Card>
            <CardContent className="p-4 md:p-6">
              {isLoading ? (
                <div className="flex items-center justify-center gap-3 h-40 text-muted-foreground">
                  <Loader2 className="animate-spin" size={20} /> Loading journeys…
                </div>
              ) : recent.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-center">
                  <MapIcon size={48} className="mb-4 opacity-20" />
                  <p>No recent journeys found.</p>
                  <Link href="/route" className="mt-4 text-primary font-medium hover:underline">Plan your first safe route</Link>
                </div>
              ) : (
                <ul className="space-y-3">
                  {recent.map((j) => {
                    const chip = statusChip[j.status] ?? statusChip.COMPLETED;
                    const ChipIcon = chip.icon;
                    return (
                      <li key={j.id} className="flex items-center justify-between gap-3 border-b border-border last:border-0 pb-3 last:pb-0">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="bg-secondary p-2 rounded-lg flex-shrink-0">
                            <Navigation size={16} className="text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm">
                              {formatDistance(j.distance)} · {formatDuration(j.duration / 60)}
                            </p>
                            <p className="text-xs text-muted-foreground">{formatDate(j.startedAt)}</p>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded font-bold flex items-center gap-1 flex-shrink-0 ${chip.className}`}>
                          <ChipIcon size={12} /> {chip.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-xl font-heading font-bold mb-4">Safety Quick Tips</h2>
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex gap-4 items-start">
                <Shield className="text-primary flex-shrink-0" />
                <div>
                  <h4 className="font-bold">Keep tracking on</h4>
                  <p className="text-sm text-muted-foreground">Always share your live location with at least one trusted contact when walking at night.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <AlertTriangle className="text-warning flex-shrink-0" />
                <div>
                  <h4 className="font-bold">Report incidents</h4>
                  <p className="text-sm text-muted-foreground">Notice something unsafe? Report it anonymously to warn others.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <Clock className="text-primary flex-shrink-0" />
                <div>
                  <h4 className="font-bold">Answer check-ins</h4>
                  <p className="text-sm text-muted-foreground">If you wander off your route, we&apos;ll ask if you&apos;re okay — answering alerts your contacts if you can&apos;t.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
