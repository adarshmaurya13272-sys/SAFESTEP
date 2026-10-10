'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';

export default function LoginPage() {
  const router = useRouter();
  const { login, loginDemo } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      toast.success('Signed in successfully');
      router.replace('/dashboard');
    } catch (err: any) {
      const message =
        err?.code === 401
          ? 'Incorrect email or password.'
          : err?.message || 'Could not sign in. Is the API server running?';
      setError(message);
      setIsSubmitting(false);
    }
  };

  const handleDemo = async () => {
    setError(null);
    setIsDemoLoading(true);
    try {
      await loginDemo();
      toast.success('Welcome to SAFESTEP demo');
      router.replace('/dashboard');
    } catch {
      setError('Demo mode unavailable. The API server may not be running.');
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="bg-primary/15 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Shield className="text-primary" size={28} />
        </div>
        <h1 className="text-2xl font-bold font-heading">Welcome Back</h1>
        <p className="text-muted-foreground mt-2">Sign in to your account</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
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
            autoComplete="current-password"
            className="w-full rounded-md border border-input px-3 py-2 bg-background focus:ring-2 focus:ring-primary focus:outline-none"
            placeholder="••••••••"
            required
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
          {isSubmitting ? 'Signing in…' : 'Sign In'}
        </Button>
      </form>

      <div className="text-center mt-6 text-sm">
        <span className="text-muted-foreground">Don&apos;t have an account? </span>
        <Link href="/register" className="text-primary font-medium hover:underline">
          Register here
        </Link>
      </div>

      {/* Bypass for demo */}
      <div className="mt-8 pt-6 border-t border-border text-center">
        <Button
          variant="ghost"
          className="w-full text-muted-foreground hover:text-foreground"
          onClick={handleDemo}
          disabled={isDemoLoading}
        >
          {isDemoLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Continue as Guest (Demo Mode)
        </Button>
        <p className="text-xs text-muted-foreground/60 mt-2">
          Demo account · demo@safestep.app / Demo@1234
        </p>
      </div>
    </div>
  );
}
