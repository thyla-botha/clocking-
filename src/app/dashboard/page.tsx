import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ClockButton from '@/components/ClockButton';
import EntriesList from '@/components/EntriesList';
import ExportCsvButton from '@/components/ExportCsvButton';
import SignOutButton from './SignOutButton';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [projectsRes, openRes, entriesRes, profileRes] = await Promise.all([
    supabase.from('projects').select('id, name').order('name'),
    supabase
      .from('time_entries')
      .select('id, start_at, project_id, notes')
      .eq('user_id', user.id)
      .is('end_at', null)
      .maybeSingle(),
    supabase
      .from('time_entries')
      .select(
        'id, start_at, end_at, start_lat, start_lng, end_lat, end_lng, start_address, end_address, project_id, notes, auto_closed',
      )
      .eq('user_id', user.id)
      .order('start_at', { ascending: false })
      .limit(100),
    supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle(),
  ]);

  const projects = projectsRes.data ?? [];
  const openEntry = openRes.data ?? null;
  const entries = entriesRes.data ?? [];
  const isAdmin = profileRes.data?.is_admin === true;

  return (
    <main className="container">
      <header className="topbar">
        <div className="topbar__brand">
          <span className="topbar__brand-mark">TS</span>
          <span>TimeStamp</span>
        </div>
        <div className="topbar__actions">
          {isAdmin && (
            <Link href="/admin" className="btn ghost">Admin</Link>
          )}
          <span className="topbar__user">
            {user.email}
            {isAdmin && <span className="badge badge--admin" style={{ marginLeft: 8 }}>Admin</span>}
          </span>
          <SignOutButton />
        </div>
      </header>

      <div className="card card--hero">
        <ClockButton projects={projects} openEntry={openEntry} userId={user.id} />
      </div>

      <div className="section-head">
        <h2>Recent entries</h2>
        <ExportCsvButton entries={entries} projects={projects} filename="my-time-entries.csv" />
      </div>
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: 'var(--space-2) var(--space-2)' }}>
          <EntriesList entries={entries} projects={projects} />
        </div>
      </div>
    </main>
  );
}
