'use client';
import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle, Filter, Plus, Loader2, Flag, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { useUserLocation } from '@/hooks/useUserLocation';
import { cn, formatDate } from '@/lib/utils';
import { SafeMap, TileLayer, CircleMarker, Popup, Recenter } from '@/components/map/map-container';

interface Incident {
  id: string;
  category: string;
  description: string | null;
  lat: number;
  lng: number;
  severity: string;
  isDemo: boolean;
  createdAt: string;
}

const CATEGORIES = [
  { value: 'HARASSMENT', label: 'Harassment' },
  { value: 'SUSPICIOUS_ACTIVITY', label: 'Suspicious Activity' },
  { value: 'POOR_LIGHTING', label: 'Poor Lighting' },
  { value: 'OTHER', label: 'Other' },
];

const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH'];

const severityColor: Record<string, string> = {
  HIGH: '#DC2626',
  MEDIUM: '#F5A524',
  LOW: '#4ADE80',
};

function categoryLabel(value: string) {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export default function IncidentsPage() {
  const queryClient = useQueryClient();
  const { coords } = useUserLocation();

  const [category, setCategory] = useState<string>('ALL');
  const [reportOpen, setReportOpen] = useState(false);
  const [form, setForm] = useState({ category: 'HARASSMENT', severity: 'MEDIUM', description: '' });

  const bbox = useMemo(() => {
    if (!coords) return null;
    const [lat, lng] = coords;
    return { minLat: lat - 0.1, maxLat: lat + 0.1, minLng: lng - 0.1, maxLng: lng + 0.1 };
  }, [coords]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['incidents', bbox?.minLat.toFixed(3), category],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (bbox) {
        params.set('bbox', `${bbox.minLng.toFixed(4)},${bbox.minLat.toFixed(4)},${bbox.maxLng.toFixed(4)},${bbox.maxLat.toFixed(4)}`);
      }
      if (category !== 'ALL') params.set('category', category);
      const res = await api.get(`/incidents?${params.toString()}`);
      return res.data as Incident[];
    },
    enabled: !!bbox,
  });

  const incidents = data ?? [];
  const hasDemoData = incidents.some((i) => i.isDemo);

  const reportMutation = useMutation({
    mutationFn: async () => {
      if (!coords) throw new Error('Location not available yet');
      return api.post('/incidents', {
        category: form.category,
        severity: form.severity,
        description: form.description.trim() || undefined,
        lat: coords[0],
        lng: coords[1],
      });
    },
    onSuccess: () => {
      toast.success('Incident reported. Thank you for keeping others safe.');
      setReportOpen(false);
      setForm({ category: 'HARASSMENT', severity: 'MEDIUM', description: '' });
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
    onError: (err) => {
      const message = err instanceof ApiError ? err.message : 'Could not report the incident.';
      toast.error(message);
    },
  });

  const flagMutation = useMutation({
    mutationFn: (id: string) => api.post(`/incidents/${id}/flag`),
    onSuccess: () => {
      toast.success('Thanks — the report was flagged for review.');
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
    onError: () => toast.error('Could not flag this report.'),
  });

  const mapCenter = coords ?? [28.6139, 77.209];

  return (
    <div className="flex flex-col min-h-[calc(100dvh-4rem)] lg:min-h-screen">
      <div className="p-4 md:p-6 bg-card border-b z-10 shadow-sm">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div>
            <h1 className="text-2xl font-heading font-bold">Incidents Map</h1>
            <p className="text-sm text-muted-foreground">Recent reports in your area</p>
          </div>
          <Button className="gap-2" onClick={() => setReportOpen(true)} disabled={!coords}>
            <Plus size={20} />
            <span>Report</span>
          </Button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 mt-4 hide-scrollbar">
          <Button
            variant={category === 'ALL' ? 'secondary' : 'outline'}
            size="sm"
            className={cn('rounded-full flex-shrink-0', category === 'ALL' && 'bg-primary text-primary-foreground hover:bg-primary/90')}
            onClick={() => setCategory('ALL')}
          >
            <Filter size={14} className="mr-1.5" /> All
          </Button>
          {CATEGORIES.map((c) => (
            <Button
              key={c.value}
              variant={category === c.value ? 'secondary' : 'outline'}
              size="sm"
              className={cn('rounded-full flex-shrink-0', category === c.value && 'bg-primary text-primary-foreground hover:bg-primary/90')}
              onClick={() => setCategory(c.value)}
            >
              {c.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="relative h-[42vh] md:h-[52vh] flex-shrink-0 bg-surface/5 border-b">
        {coords && (
          <SafeMap center={mapCenter} zoom={13} scrollWheelZoom style={{ height: '100%', width: '100%', zIndex: 0 }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Recenter center={mapCenter} zoom={13} />
            {incidents.map((incident) => (
              <CircleMarker
                key={incident.id}
                center={[incident.lat, incident.lng]}
                radius={9}
                pathOptions={{
                  color: severityColor[incident.severity] ?? '#94A3B8',
                  fillColor: severityColor[incident.severity] ?? '#94A3B8',
                  fillOpacity: 0.45,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="space-y-1.5 min-w-[180px]">
                    <p className="font-bold">{categoryLabel(incident.category)}</p>
                    <p className="text-xs uppercase tracking-wide" style={{ color: severityColor[incident.severity] }}>
                      {incident.severity} severity
                    </p>
                    {incident.description && <p className="text-xs opacity-80">{incident.description}</p>}
                    <p className="text-xs opacity-50">{formatDate(incident.createdAt)}</p>
                    <button
                      className="mt-1 text-xs text-warning flex items-center gap-1 hover:underline"
                      onClick={() => flagMutation.mutate(incident.id)}
                    >
                      <Flag size={12} /> Flag as inaccurate
                    </button>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </SafeMap>
        )}

        {/* Severity legend */}
        <div className="absolute bottom-3 left-3 bg-card/90 border border-border rounded-xl px-3 py-2 text-[11px] space-y-1 z-[500] shadow-lg">
          <p className="font-bold uppercase tracking-wider text-muted-foreground">Severity</p>
          {(['HIGH', 'MEDIUM', 'LOW'] as const).map((s) => (
            <p key={s} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: severityColor[s] }} />
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </p>
          ))}
        </div>

        {hasDemoData && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-secondary text-secondary-foreground px-4 py-1.5 rounded-full shadow-md text-xs font-bold uppercase tracking-wider z-[500]">
            Includes demo data
          </div>
        )}
      </div>

      {/* Recent list */}
      <div className="flex-1 p-4 md:p-6">
        <div className="max-w-3xl">
          <h2 className="text-lg font-heading font-bold mb-3">Recent reports</h2>
          {isLoading ? (
            <div className="flex items-center gap-3 text-muted-foreground py-8 justify-center">
              <Loader2 className="animate-spin" size={20} /> Loading incidents…
            </div>
          ) : isError ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="mx-auto mb-2 text-warning" size={28} />
              <p>Could not load incidents. Is the API server running?</p>
            </div>
          ) : incidents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="mx-auto mb-2 opacity-30" size={28} />
              <p>No incidents reported in this area yet.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {incidents.slice(0, 12).map((incident) => (
                <li key={incident.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: severityColor[incident.severity] }} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{categoryLabel(incident.category)}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {incident.description || 'No description'} · {formatDate(incident.createdAt)}
                    </p>
                  </div>
                  <button
                    className="text-xs text-muted-foreground hover:text-warning flex items-center gap-1 flex-shrink-0"
                    onClick={() => flagMutation.mutate(incident.id)}
                  >
                    <Flag size={12} /> Flag
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Report dialog */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report an incident</DialogTitle>
            <DialogDescription>
              Reports are anonymized (rounded to ~50m) and help others choose safer routes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label htmlFor="inc-category" className="block text-sm font-medium mb-1">Category</label>
              <select
                id="inc-category"
                className="w-full rounded-md border border-input bg-background px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Severity</label>
              <div className="flex gap-2">
                {SEVERITIES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm({ ...form, severity: s })}
                    className={cn(
                      'flex-1 py-2 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-2',
                      form.severity === s ? 'border-transparent text-white' : 'border-border text-muted-foreground hover:bg-accent'
                    )}
                    style={form.severity === s ? { background: severityColor[s] } : undefined}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ background: form.severity === s ? '#fff' : severityColor[s] }} />
                    {s.charAt(0) + s.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="inc-desc" className="block text-sm font-medium mb-1">Description (optional)</label>
              <textarea
                id="inc-desc"
                rows={3}
                maxLength={200}
                placeholder="What did you notice?"
                className="w-full rounded-md border border-input bg-background px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none resize-none"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <MapPin size={12} className="text-primary" />
              Location: your current position (GPS or demo city center).
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReportOpen(false)}>Cancel</Button>
            <Button onClick={() => reportMutation.mutate()} disabled={reportMutation.isPending}>
              {reportMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Submit report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
