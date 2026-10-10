'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Check, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';

export default function InvitePage({ params }: { params: { token: string } }) {
  const [state, setState] = useState<'idle' | 'accepting' | 'accepted' | 'declined' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const accept = async () => {
    setState('accepting');
    setError(null);
    try {
      await api.post(`/contacts/accept/${params.token}`);
      setState('accepted');
    } catch (err) {
      setState('error');
      setError(err instanceof ApiError ? err.message : 'Could not accept the invitation.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B1426] to-[#14213D] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#38BDF8] to-cyan-200 tracking-wider">
            SAFESTEP
          </h1>
        </div>

        <Card className="border-primary/20 shadow-xl">
          <CardContent className="p-8 text-center space-y-6">
            {state === 'accepted' ? (
              <>
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto text-green-500">
                  <CheckCircle2 size={32} />
                </div>
                <div>
                  <h2 className="text-xl font-bold mb-2">Invitation accepted</h2>
                  <p className="text-muted-foreground text-sm">
                    You are now a trusted contact. You&apos;ll be able to follow live journeys and receive SOS alerts
                    with the person&apos;s location.
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Keep this page&apos;s link — journey tracking links are shared per trip.
                </p>
              </>
            ) : state === 'declined' ? (
              <>
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                  <AlertCircle size={32} />
                </div>
                <div>
                  <h2 className="text-xl font-bold mb-2">Invitation declined</h2>
                  <p className="text-muted-foreground text-sm">
                    No worries — nothing was accepted. You can safely ignore this link.
                  </p>
                </div>
              </>
            ) : state === 'error' ? (
              <>
                <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto text-destructive">
                  <AlertCircle size={32} />
                </div>
                <div>
                  <h2 className="text-xl font-bold mb-2">Invalid invitation</h2>
                  <p className="text-muted-foreground text-sm">{error}</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto text-primary">
                  <Shield size={32} />
                </div>

                <div>
                  <h2 className="text-xl font-bold mb-2">You&apos;ve been invited</h2>
                  <p className="text-muted-foreground text-sm">
                    Someone you know would like to add you as their trusted emergency contact on SAFESTEP.
                  </p>
                </div>

                <div className="bg-secondary p-4 rounded-lg text-sm text-left space-y-2">
                  <p className="font-bold flex items-center gap-2">
                    <Check size={16} className="text-primary" /> See their live location during shared journeys.
                  </p>
                  <p className="font-bold flex items-center gap-2">
                    <Check size={16} className="text-primary" /> Receive an alert with their location if they trigger an SOS.
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button className="flex-1" onClick={accept} disabled={state === 'accepting'}>
                    {state === 'accepting' ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                    Accept Invite
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-muted-foreground"
                    onClick={() => setState('declined')}
                  >
                    Decline
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
