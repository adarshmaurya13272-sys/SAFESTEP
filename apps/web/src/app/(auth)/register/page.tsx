'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(name, email, password);
      toast.success('Account created. Welcome to SAFESTEP!');
      router.replace('/dashboard');
    } catch (err: any) {
      const message =
        err?.code === 409
          ? 'An account with this email already exists.'
          : err?.message || 'Could not create your account. Is the API server running?';
      setError(message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="bg-primary/15 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Shield className="text-primary" size={28} />
        </div>
        <h1 className="text-2xl font-bold font-heading">Create Account</h1>
        <p className="text-muted-foreground mt-2">Join SAFESTEP today</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">Full Name</label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            className="w-full rounded-md border border-input px-3 py-2 bg-background focus:ring-2 focus:ring-primary focus:outline-none"
            placeholder="Jane Doe"
            required
            minLength={2}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="w-full rounded-md border border-input px-3 py-2 bg-background focus:ring-2 focus:ring-primary focus:outline-none"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            className="w-full rounded-md border border-input px-3 py-2 bg-background focus:ring-2 focus:ring-primary focus:outline-none"
            placeholder="At least 8 characters"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full font-bold text-lg mt-6" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
          {isSubmitting ? 'Creating account…' : 'Register'}
        </Button>
      </form>

      <div className="text-center mt-6 text-sm">
        <span className="text-muted-foreground">Already have an account? </span>
        <Link href="/login" className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}
