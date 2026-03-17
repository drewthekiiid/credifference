'use client';

import { useState } from 'react';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Fingerprint, ShieldCheck } from 'lucide-react';

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
        alert('Device registered successfully! You can now login.');
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
    <div className="min-h-screen flex items-center justify-center bg-[#050505] p-4 font-sans text-slate-100">
      <Card className="w-full max-w-md bg-[#111111] border-slate-800 text-slate-100 shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight font-display">SSOT Command Center</CardTitle>
          <CardDescription className="text-slate-400">
            Biometric access required.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-md">
              {error}
            </div>
          )}
          
          <Button 
            onClick={handleLogin} 
            disabled={loading}
            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center gap-2"
          >
            <Fingerprint className="w-5 h-5" />
            {loading ? 'Authenticating...' : 'Authenticate with Passkey'}
          </Button>

          {process.env.NODE_ENV === 'development' && (
            <div className="pt-6 mt-6 border-t border-slate-800 text-center">
              <p className="text-xs text-slate-500 mb-3">Development Only</p>
              <Button 
                onClick={handleRegister} 
                disabled={loading}
                variant="outline"
                className="w-full border-slate-700 hover:bg-slate-800 text-slate-300"
              >
                Register New Device
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
