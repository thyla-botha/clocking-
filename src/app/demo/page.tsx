import Link from 'next/link';
import EntriesList, { type Entry } from '@/components/EntriesList';
import DemoClockCard from './DemoClockCard';
import DemoAdminOpenTable from './DemoAdminOpenTable';

export const dynamic = 'force-static';

const projects = [
  { id: 'p1', name: 'Default Project' },
  { id: 'p2', name: 'Acme Site Visit' },
  { id: 'p3', name: 'Internal R&D' },
];

const now = Date.now();
const hours = (n: number) => new Date(now - n * 3600 * 1000).toISOString();

const myEntries: Entry[] = [
  {
    id: 'e1',
    start_at: hours(28),
    end_at: hours(20),
    project_id: 'p2',
    start_lat: -33.9249, start_lng: 18.4241,
    end_lat: -33.918, end_lng: 18.4233,
    notes: 'Cabling install at the Acme site. Finished early.',
    auto_closed: false,
  },
  {
    id: 'e2',
    start_at: hours(52),
    end_at: hours(45),
    project_id: 'p1',
    start_lat: -33.9258, start_lng: 18.4232,
    end_lat: null, end_lng: null,
    notes: '[auto-closed 2026-05-23T20:00:00Z]',
    auto_closed: true,
  },
  {
    id: 'e3',
    start_at: hours(96),
    end_at: hours(89),
    project_id: 'p3',
    start_lat: -33.9249, start_lng: 18.4241,
    end_lat: -33.9258, end_lng: 18.4233,
    notes: null,
    auto_closed: false,
  },
];

const allEntries: Entry[] = [
  {
    id: 'a1',
    start_at: hours(2),
    end_at: null,
    project_id: 'p2',
    start_lat: -33.918, start_lng: 18.4233,
    end_lat: null, end_lng: null,
    notes: null,
    auto_closed: false,
    user_email: 'sam@example.com',
  },
  ...myEntries.map((e) => ({ ...e, user_email: 'you@example.com' })),
  {
    id: 'a2',
    start_at: hours(8),
    end_at: hours(4),
    project_id: 'p1',
    start_lat: -33.93, start_lng: 18.42,
    end_lat: -33.93, end_lng: 18.42,
    notes: 'Morning shift',
    auto_closed: false,
    user_email: 'jordan@example.com',
  },
];

export default function DemoPage() {
  return (
    <main className="container container--wide">
      <header className="topbar">
        <div className="topbar__brand">
          <span className="topbar__brand-mark">C</span>
          <span>Clockify <span className="muted" style={{ fontWeight: 500 }}>Demo</span></span>
        </div>
        <Link href="/login" className="btn ghost btn--sm">Go to real app</Link>
      </header>

      <div className="card card--banner" style={{ marginBottom: 'var(--space-6)' }}>
        <strong>Mock data, no Supabase.</strong>
        <div className="muted" style={{ marginTop: 4 }}>
          Buttons work locally but nothing persists. Two views are shown stacked: <em>user dashboard</em> on top, <em>admin</em> below.
        </div>
      </div>

      <h2 style={{ marginTop: 0 }}>User dashboard</h2>
      <div className="card card--hero">
        <DemoClockCard projects={projects} />
      </div>

      <h2>Recent entries</h2>
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: 'var(--space-2) var(--space-2)' }}>
          <EntriesList entries={myEntries} projects={projects} />
        </div>
      </div>

      <div className="divider" />

      <h2 style={{ marginTop: 0 }}>Admin</h2>

      <h2>Open entries</h2>
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: 'var(--space-2) var(--space-2)' }}>
          <DemoAdminOpenTable entries={allEntries.filter((e) => !e.end_at)} projects={projects} />
        </div>
      </div>

      <h2>All entries</h2>
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: 'var(--space-2) var(--space-2)' }}>
          <EntriesList entries={allEntries} projects={projects} showUser />
        </div>
      </div>
    </main>
  );
}
