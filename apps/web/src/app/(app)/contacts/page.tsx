'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { UserPlus, Link as LinkIcon, Trash2, Loader2, Copy, Check, ShieldCheck, Clock, ShieldX } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';

interface Contact {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  status: string; // PENDING | ACCEPTED | REVOKED
  inviteToken: string;
  createdAt: string;
}

const statusBadge: Record<string, { label: string; className: string; icon: typeof Clock }> = {
  ACCEPTED: { label: 'Accepted', className: 'bg-green-500/20 text-green-500', icon: ShieldCheck },
  PENDING: { label: 'Pending', className: 'bg-warning/20 text-warning', icon: Clock },
  REVOKED: { label: 'Revoked', className: 'bg-destructive/20 text-destructive', icon: ShieldX },
};

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function ContactsPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const res = await api.get('/contacts');
      return res.data as Contact[];
    },
  });

  const contacts = data ?? [];

  const addMutation = useMutation({
    mutationFn: async () => {
      const payload: { name: string; phone?: string; email?: string } = { name: form.name.trim() };
      if (form.phone.trim()) payload.phone = form.phone.trim();
      if (form.email.trim()) payload.email = form.email.trim();
      return api.post('/contacts', payload);
    },
    onSuccess: () => {
      toast.success('Contact added. Share their invite link to connect.');
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setAddOpen(false);
      setForm({ name: '', phone: '', email: '' });
    },
    onError: (err) => {
      const message = err instanceof ApiError ? err.message : 'Could not add the contact.';
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/contacts/${id}`),
    onSuccess: () => {
      toast.success('Contact removed.');
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: () => toast.error('Could not remove the contact.'),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => api.post(`/contacts/${id}/revoke`),
    onSuccess: () => {
      toast.success('Access revoked. They can no longer view your journeys.');
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: () => toast.error('Could not revoke access.'),
  });

  const copyInvite = async (contact: Contact) => {
    const url = `${window.location.origin}/invite/${contact.inviteToken}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(contact.id);
      toast.success('Invite link copied.');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Could not copy the link.');
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto">
      <header className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Trusted Contacts</h1>
          <p className="text-muted-foreground">People who can view your live location during a journey.</p>
        </div>
        <Button className="gap-2" onClick={() => setAddOpen(true)}>
          <UserPlus size={20} /> Add Contact
        </Button>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
          <Loader2 className="animate-spin" size={20} /> Loading contacts…
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Could not load contacts. Is the API server running?
          </CardContent>
        </Card>
      ) : contacts.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            <UserPlus size={40} className="mx-auto mb-4 opacity-20" />
            <p className="font-medium text-foreground mb-1">No trusted contacts yet</p>
            <p className="text-sm mb-6">Add up to 5 people who can see your live location and get SOS alerts.</p>
            <Button onClick={() => setAddOpen(true)} className="gap-2">
              <UserPlus size={18} /> Add your first contact
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            {contacts.map((contact) => {
              const badge = statusBadge[contact.status] ?? statusBadge.PENDING;
              const BadgeIcon = badge.icon;
              return (
                <Card key={contact.id}>
                  <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary flex-shrink-0">
                        {initials(contact.name)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold truncate">{contact.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {contact.phone || contact.email || 'No contact info'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                      <span className={cn('text-xs px-2 py-1 rounded font-bold flex items-center gap-1', badge.className)}>
                        <BadgeIcon size={12} /> {badge.label}
                      </span>
                      {contact.status === 'ACCEPTED' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-warning"
                          onClick={() => revokeMutation.mutate(contact.id)}
                        >
                          Revoke
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => {
                          if (window.confirm(`Remove ${contact.name} from your trusted contacts?`)) {
                            deleteMutation.mutate(contact.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="space-y-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">Invite Links</CardTitle>
                <CardDescription>Pending contacts join via their personal link.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {contacts.filter((c) => c.status === 'PENDING').length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No pending invites. Add a contact to generate a secure invite link.
                  </p>
                ) : (
                  contacts
                    .filter((c) => c.status === 'PENDING')
                    .map((c) => (
                      <div key={c.id} className="flex items-center gap-2">
                        <div className="flex-1 bg-background border rounded px-3 py-2 text-xs truncate">
                          {c.name}: …/invite/{c.inviteToken.slice(0, 10)}…
                        </div>
                        <Button size="icon" variant="outline" onClick={() => copyInvite(c)} title="Copy invite link">
                          {copiedId === c.id ? <Check size={16} className="text-green-500" /> : <LinkIcon size={16} />}
                        </Button>
                      </div>
                    ))
                )}
                <p className="text-xs text-muted-foreground">
                  Anyone with a link can accept the invitation — share it only with the person you trust.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Add contact dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a trusted contact</DialogTitle>
            <DialogDescription>
              They&apos;ll see your live location during journeys and receive SOS alerts. Add at least a phone or email.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label htmlFor="ct-name" className="block text-sm font-medium mb-1">Name *</label>
              <input
                id="ct-name"
                className="w-full rounded-md border border-input bg-background px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                placeholder="e.g. Mom"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="ct-phone" className="block text-sm font-medium mb-1">Phone</label>
              <input
                id="ct-phone"
                type="tel"
                className="w-full rounded-md border border-input bg-background px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="ct-email" className="block text-sm font-medium mb-1">Email</label>
              <input
                id="ct-email"
                type="email"
                className="w-full rounded-md border border-input bg-background px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                placeholder="person@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button
              onClick={() => addMutation.mutate()}
              disabled={addMutation.isPending || form.name.trim().length < 2 || (!form.phone.trim() && !form.email.trim())}
            >
              {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Add contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
