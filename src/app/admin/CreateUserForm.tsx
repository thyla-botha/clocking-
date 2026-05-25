'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateUserForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setOk(null);
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, is_admin: isAdmin }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? `Failed (${res.status})`);
      return;
    }
    setOk(`Created ${data.user.email}.`);
    setEmail('');
    setPassword('');
    setIsAdmin(false);
    startTransition(() => router.refresh());
  }

  return (
    <form onSubmit={onSubmit} className="stack" noValidate>
      <div
        style={{
          display: 'grid',
          gap: 'var(--space-3)',
          gridTemplateColumns: '1fr',
        }}
        className="create-user-grid"
      >
        <div>
          <label className="label" htmlFor="new-email">Email</label>
          <input
            id="new-email"
            type="email"
            required
            inputMode="email"
            autoComplete="off"
            autoCapitalize="off"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="new.user@company.com"
          />
        </div>
        <div>
          <label className="label" htmlFor="new-password">
            Initial password
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="link-toggle"
              aria-pressed={showPassword}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </label>
          <input
            id="new-password"
            type={showPassword ? 'text' : 'password'}
            required
            minLength={8}
            autoComplete="new-password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
          />
        </div>
      </div>
      <div className="row row--between row--wrap">
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={isAdmin}
            onChange={(e) => setIsAdmin(e.target.checked)}
          />
          <span>Make this user an admin</span>
        </label>
        <button className="btn" type="submit" disabled={busy}>
          {busy ? 'Creating…' : 'Create user'}
        </button>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      {ok && <p className="ok" aria-live="polite">{ok}</p>}

      <style>{`
        @media (min-width: 640px) {
          .create-user-grid { grid-template-columns: 1fr 1fr !important; }
        }
        .link-toggle {
          background: none;
          border: 0;
          padding: 0;
          margin-left: 8px;
          font: inherit;
          font-size: var(--fs-xs);
          color: var(--accent);
          cursor: pointer;
          text-transform: none;
          letter-spacing: 0;
        }
        .link-toggle:hover { color: var(--accent-hover); }
      `}</style>
    </form>
  );
}
