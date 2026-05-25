'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError || !signInData.user) {
      setBusy(false);
      setError(signInError?.message ?? 'Sign in failed.');
      return;
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', signInData.user.id)
      .maybeSingle();

    router.replace(profile?.is_admin ? '/admin' : '/dashboard');
    router.refresh();
  }

  return (
    <main
      className="container container--narrow"
      style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
    >
      <div className="topbar__brand" style={{ justifyContent: 'center', marginBottom: 32 }}>
        <span className="topbar__brand-mark">TS</span>
        <span>TimeStamp</span>
      </div>

      <div className="card card--hero">
        <h1 style={{ marginBottom: 4 }}>Sign in</h1>
        <p className="muted" style={{ marginBottom: 24 }}>
          Accounts are created by an admin.
        </p>
        <form onSubmit={onSubmit} className="stack stack--lg" noValidate>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              inputMode="email"
              autoComplete="email"
              autoCapitalize="off"
              spellCheck={false}
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button className="btn btn--lg btn--block" type="submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
          {error && <p className="error" role="alert">{error}</p>}
        </form>
      </div>
    </main>
  );
}
