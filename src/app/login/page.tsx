'use client';

import { useState } from 'react';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BrandLockup } from '@/components/BrandLockup';
import { BrandMark } from '@/components/BrandMark';
import { Fingerprint, LoaderCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getErrorMessage = (errorValue: unknown) => {
    if (errorValue instanceof Error) {
      return errorValue.message;
    }

    return 'An unexpected error occurred';
  };

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login/generate');
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Login failed');
      }
      const options = await res.json();

      const authResp = await startAuthentication(options);

      const verificationRes = await fetch('/api/auth/login/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authResp),
      });

      const verification = await verificationRes.json();

      if (verification.verified) {
        router.push('/');
        router.refresh();
      } else {
        setError('Verification failed');
      }
    } catch (err: unknown) {
      console.error(err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register/generate');
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Registration failed');
      }
      const options = await res.json();

      const attResp = await startRegistration(options);

      const verificationRes = await fetch('/api/auth/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attResp),
      });

      const verification = await verificationRes.json();

      if (verification.verified) {
        router.push('/');
        router.refresh();
      } else {
        setError('Registration verification failed');
      }
    } catch (err: unknown) {
      console.error(err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 md:py-12 flex items-center justify-center">
      <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[1.1fr_0.9fr] items-center">
        <section className="glass-card rounded-[32px] p-8 lg:hidden">
          <BrandLockup
            eyebrow="Secured Entry"
            subtitle="Quiet luxury. Hard truth."
            description="A private command center for your credit rebuild and stack sequencing. Biometric only."
          />
        </section>

        <section className="hidden lg:flex lg:flex-col lg:justify-center lg:pr-12">
          <BrandLockup
            hero
            eyebrow="Secured Entry"
            subtitle="Quiet luxury. Hard truth."
            description="The command center is built to feel premium, but it behaves like an operator console. Passkey-only access keeps the system private and frictionless."
            className="max-w-xl"
          />

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <p className="editorial-kicker">Signal</p>
              <p className="font-display text-4xl text-(--text)">3</p>
              <p className="text-sm muted-copy leading-relaxed">Bureaus in one source of truth.</p>
            </div>
            <div className="space-y-2">
              <p className="editorial-kicker">Theme</p>
              <p className="font-display text-4xl text-(--text)">Auto</p>
              <p className="text-sm muted-copy leading-relaxed">Adapts to system light and dark mode.</p>
            </div>
            <div className="space-y-2">
              <p className="editorial-kicker">Access</p>
              <p className="font-display text-4xl text-(--text)">Face ID</p>
              <p className="text-sm muted-copy leading-relaxed">Biometric only. No password clutter.</p>
            </div>
          </div>
        </section>

        <Card className="w-full max-w-md mx-auto rounded-[32px] glass-card lg:ml-auto">
          <CardHeader className="text-center pb-8 pt-10">
            <BrandMark className="mx-auto mb-6" size="lg" />
            <p className="editorial-kicker">Private entry</p>
            <CardTitle className="mt-4 font-display text-3xl tracking-normal font-normal">Credifference</CardTitle>
            <CardDescription className="mx-auto mt-3 max-w-xs text-sm leading-relaxed">
              SSOT Command Center. Biometric access only.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-8 pb-10">
            <div aria-live="polite" className="min-h-0">
              {error && (
                <div className="rounded-[20px] border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-400">
                  {error}
                </div>
              )}
            </div>
            
            <Button 
              onClick={handleLogin} 
              disabled={loading}
              aria-busy={loading}
              className="h-12 w-full gap-2"
            >
              {loading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Fingerprint className="h-5 w-5" />}
              {loading ? 'Authenticating...' : 'Authenticate with Passkey'}
            </Button>

            <div className="border-t border-(--border) pt-6 text-center">
              <p className="mb-3 text-xs uppercase tracking-[0.2em] text-(--soft)">
                First time here? Register this device.
              </p>
              <Button 
                onClick={handleRegister} 
                disabled={loading}
                aria-busy={loading}
                variant="outline"
                className="h-12 w-full"
              >
                Register New Device
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
