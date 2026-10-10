'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { User, Shield, LogOut, Loader2, Pencil, Phone, Siren } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { formatDate } from '@/lib/utils';

interface SosHistoryItem {
  id: string;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser, logout } = useAuthStore();
  const [editOpen, setEditOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [form, setForm] = useState({
    name: user?.name ?? '',
    phone: user?.phone ?? '',
    emergencyNote: user?.emergencyNote ?? '',
  });

  const { data: contacts } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const res = await api.get('/contacts');
      return res.data as { id: string; status: string }[];
    },
  });

  const { data: sosHistory } = useQuery({
    queryKey: ['sos-history'],
    queryFn: async () => {
      const res = await api.get('/sos');
      return res.data as SosHistoryItem[];
    },
  });

  const acceptedCount = contacts?.filter((c) => c.status === 'ACCEPTED').length ?? 0;

  const handleSave = async () => {
    try {
      const res = await api.patch('/me', {
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        emergencyNote: form.emergencyNote.trim() || undefined,
      });
      setUser(res.data);
      toast.success('Profile updated.');
      setEditOpen(false);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not update your profile.';
      toast.error(message);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await logout();
      toast.success('Signed out. Stay safe!');
      router.replace('/login');
    } catch {
      toast.error('Could not sign out cleanly — clearing local session anyway.');
      router.replace('/login');
    }
  };

  const initials = user?.name
    ? user.name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
    : 'ME';

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-3xl mx-auto">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-heading font-bold text-foreground">Profile</h1>
        <Button variant="ghost" size="icon" title="Edit profile" onClick={() => setEditOpen(true)}>
          <Pencil size={20} />
        </Button>
      </header>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6 flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 text-2xl font-bold">
            {initials}
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl font-bold font-heading truncate">{user?.name ?? 'Guest'}</h2>
            <p className="text-muted-foreground truncate">{user?.email}</p>
            <div className="mt-2 text-xs bg-primary/20 text-primary font-bold px-2 py-1 rounded-md inline-flex items-center gap-1.5">
              <Shield size={12} /> Member since {user?.createdAt ? formatDate(user.createdAt) : 'today'}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="text-primary" size={20} /> Safety Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <button
              className="w-full flex justify-between items-center group"
              onClick={() => router.push('/contacts')}
            >
              <span className="font-medium group-hover:text-primary transition-colors">Emergency Contacts</span>
              <span className="text-muted-foreground text-sm">
                {acceptedCount} accepted{contacts && contacts.length > acceptedCount ? ` · ${contacts.length} total` : ''}
              </span>
            </button>
            <div className="flex justify-between items-center">
              <span className="font-medium">Live Location Sharing</span>
              <span className="text-primary text-sm font-bold">On during journeys</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">SOS Alerts</span>
              <span className="text-primary text-sm font-bold">All accepted contacts</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Phone className="text-primary" size={20} /> Account Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center gap-3">
              <span className="font-medium">Phone</span>
              <span className="text-muted-foreground text-sm text-right">{user?.phone || 'Not set'}</span>
            </div>
            <div className="flex justify-between items-start gap-3">
              <span className="font-medium flex-shrink-0">Emergency Note</span>
              <span className="text-muted-foreground text-sm text-right line-clamp-2">
                {user?.emergencyNote || 'Not set'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SOS history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Siren className="text-destructive" size={20} /> SOS History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!sosHistory || sosHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">No SOS events recorded.</p>
          ) : (
            <ul className="space-y-2">
              {sosHistory.slice(0, 5).map((sos) => (
                <li key={sos.id} className="flex justify-between items-center text-sm border-b border-border last:border-0 pb-2 last:pb-0">
                  <span className="text-muted-foreground">{formatDate(sos.createdAt)}</span>
                  <span className={sos.status === 'ACTIVE' ? 'text-destructive font-bold' : 'text-green-500 font-bold'}>
                    {sos.status === 'ACTIVE' ? 'ACTIVE' : 'Resolved'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="pt-8 flex justify-center border-t mt-8">
        <Button
          variant="ghost"
          className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
          onClick={handleSignOut}
          disabled={isSigningOut}
        >
          {isSigningOut ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
          Sign Out
        </Button>
      </div>

      {/* Edit profile dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>
              The emergency note is shown to your trusted contacts when an SOS is triggered.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label htmlFor="pf-name" className="block text-sm font-medium mb-1">Full name</label>
              <input
                id="pf-name"
                className="w-full rounded-md border border-input bg-background px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="pf-phone" className="block text-sm font-medium mb-1">Phone</label>
              <input
                id="pf-phone"
                type="tel"
                className="w-full rounded-md border border-input bg-background px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="pf-note" className="block text-sm font-medium mb-1">Emergency note</label>
              <textarea
                id="pf-note"
                rows={3}
                maxLength={200}
                className="w-full rounded-md border border-input bg-background px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none resize-none"
                placeholder="e.g. Blood type O+, allergic to penicillin"
                value={form.emergencyNote}
                onChange={(e) => setForm({ ...form, emergencyNote: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={form.name.trim().length < 2}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
