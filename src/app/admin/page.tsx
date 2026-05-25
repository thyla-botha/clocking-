import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import EntriesList, { type Entry } from '@/components/EntriesList';
import ExportCsvButton from '@/components/ExportCsvButton';
import SignOutButton from '../dashboard/SignOutButton';
import ForceCloseButton from './ForceCloseButton';
import CreateUserForm from './CreateUserForm';

export const dynamic = 'force-dynamic';

type RawEntry = Entry & { user_id: string };

function initials(email: string | null | undefined) {
  if (!email) return '?';
  const local = email.split('@')[0] ?? '';
  const parts = local.split(/[.\-_+]/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return local.slice(0, 2).toUpperCase();
}

export default async function AdminPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.is_admin) redirect('/dashboard');

  const [projectsRes, entriesRes, profilesRes] = await Promise.all([
    supabase.from('projects').select('id, name').order('name'),
    supabase
      .from('time_entries')
      .select(
        'id, user_id, start_at, end_at, start_lat, start_lng, end_lat, end_lng, project_id, notes, auto_closed',
      )
      .order('start_at', { ascending: false })
      .limit(500),
    supabase.from('profiles').select('id, email, is_admin, created_at').order('created_at'),
  ]);

  const projects = projectsRes.data ?? [];
  const rawEntries = (entriesRes.data ?? []) as RawEntry[];
  const profiles = profilesRes.data ?? [];
  const emailById = new Map(profiles.map((p) => [p.id, p.email]));

  const entries: Entry[] = rawEntries.map((e) => ({
    ...e,
    user_email: emailById.get(e.user_id) ?? null,
  }));

  const openEntries = entries.filter((e) => e.end_at === null);
  const totalUsers = profiles.length;
  const admins = profiles.filter((p) => p.is_admin).length;

  return (
    <main className="container container--wide">
      <header className="topbar">
        <div className="topbar__brand">
          <span className="topbar__brand-mark">C</span>
          <span>Clockify <span className="muted" style={{ fontWeight: 500 }}>Admin</span></span>
        </div>
        <div className="topbar__actions">
          <Link href="/dashboard" className="btn ghost">My time</Link>
          <span className="topbar__user">{user.email}</span>
          <SignOutButton />
        </div>
      </header>

      {/* Stat tiles */}
      <div
        className="stack"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div className="card" style={{ padding: 'var(--space-4)' }}>
          <div className="muted" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 12 }}>Open now</div>
          <div style={{ fontSize: 'var(--fs-2xl)', fontWeight: 700, marginTop: 4 }} className="tabular">{openEntries.length}</div>
        </div>
        <div className="card" style={{ padding: 'var(--space-4)' }}>
          <div className="muted" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 12 }}>Users</div>
          <div style={{ fontSize: 'var(--fs-2xl)', fontWeight: 700, marginTop: 4 }} className="tabular">{totalUsers}</div>
        </div>
        <div className="card" style={{ padding: 'var(--space-4)' }}>
          <div className="muted" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 12 }}>Admins</div>
          <div style={{ fontSize: 'var(--fs-2xl)', fontWeight: 700, marginTop: 4 }} className="tabular">{admins}</div>
        </div>
        <div className="card" style={{ padding: 'var(--space-4)' }}>
          <div className="muted" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 12 }}>Entries (recent)</div>
          <div style={{ fontSize: 'var(--fs-2xl)', fontWeight: 700, marginTop: 4 }} className="tabular">{entries.length}</div>
        </div>
      </div>

      <h2>Open entries</h2>
      <div className="card" style={{ padding: 0 }}>
        {openEntries.length === 0 ? (
          <div className="empty">Nobody is clocked in right now.</div>
        ) : (
          <div className="table-wrap" style={{ padding: 'var(--space-2) var(--space-2)' }}>
            <table className="table-responsive">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Project</th>
                  <th>Started</th>
                  <th aria-label="actions"></th>
                </tr>
              </thead>
              <tbody>
                {openEntries.map((e) => (
                  <tr key={e.id}>
                    <td data-label="User">
                      <span className="row" style={{ gap: 10 }}>
                        <span className="avatar">{initials(e.user_email)}</span>
                        <span>{e.user_email ?? '—'}</span>
                      </span>
                    </td>
                    <td data-label="Project">{projects.find((p) => p.id === e.project_id)?.name ?? '—'}</td>
                    <td data-label="Started" className="tabular">{new Date(e.start_at).toLocaleString()}</td>
                    <td data-label="Action"><ForceCloseButton entryId={e.id} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <h2>Users</h2>
      <div className="card">
        <CreateUserForm />
      </div>
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap" style={{ padding: 'var(--space-2) var(--space-2)' }}>
          <table className="table-responsive">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.id}>
                  <td data-label="User">
                    <span className="row" style={{ gap: 10 }}>
                      <span className="avatar">{initials(p.email)}</span>
                      <span>{p.email}</span>
                    </span>
                  </td>
                  <td data-label="Role">
                    {p.is_admin ? (
                      <span className="badge badge--admin">Admin</span>
                    ) : (
                      <span className="badge badge--user">User</span>
                    )}
                  </td>
                  <td data-label="Created" className="tabular">{p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="section-head">
        <h2>All entries</h2>
        <ExportCsvButton entries={entries} projects={projects} filename="all-time-entries.csv" />
      </div>
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: 'var(--space-2) var(--space-2)' }}>
          <EntriesList entries={entries} projects={projects} showUser />
        </div>
      </div>
    </main>
  );
}
