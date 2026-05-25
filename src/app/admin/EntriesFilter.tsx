'use client';

import { useMemo, useState } from 'react';
import EntriesList, { type Entry } from '@/components/EntriesList';
import ExportCsvButton from '@/components/ExportCsvButton';

type Profile = { id: string; email: string | null };
type Project = { id: string; name: string };

function slugify(email: string | null | undefined): string {
  if (!email) return 'user';
  return email.replace(/[^a-zA-Z0-9._-]+/g, '_');
}

type Range = 'all' | '7d' | '30d';

const RANGE_LABELS: Record<Range, string> = {
  all: 'All time',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
};

export default function EntriesFilter({
  entries,
  profiles,
  projects,
}: {
  entries: Entry[];
  profiles: Profile[];
  projects: Project[];
}) {
  const [userId, setUserId] = useState<string>('all');
  const [range, setRange] = useState<Range>('all');

  const filtered = useMemo(() => {
    const cutoff =
      range === 'all' ? null : Date.now() - (range === '7d' ? 7 : 30) * 24 * 60 * 60 * 1000;
    return entries.filter((e) => {
      if (userId !== 'all' && e.user_id !== userId) return false;
      if (cutoff !== null && new Date(e.start_at).getTime() < cutoff) return false;
      return true;
    });
  }, [entries, userId, range]);

  const selectedEmail = profiles.find((p) => p.id === userId)?.email ?? null;
  const userPart = userId === 'all' ? 'all' : slugify(selectedEmail);
  const rangePart = range === 'all' ? 'all-time' : `last-${range}`;
  const filename = `${userPart}-${rangePart}-entries.csv`;

  return (
    <>
      <div
        className="row row--wrap"
        style={{ marginBottom: 'var(--space-3)', alignItems: 'flex-end' }}
      >
        <div style={{ minWidth: 240, flex: '1 1 240px' }}>
          <label className="label" htmlFor="user-filter">Filter by user</label>
          <select
            id="user-filter"
            className="input"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          >
            <option value="all">All users</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.email ?? '(no email)'}
              </option>
            ))}
          </select>
        </div>
        <div style={{ minWidth: 180, flex: '1 1 180px' }}>
          <label className="label" htmlFor="range-filter">Date range</label>
          <select
            id="range-filter"
            className="input"
            value={range}
            onChange={(e) => setRange(e.target.value as Range)}
          >
            {(Object.keys(RANGE_LABELS) as Range[]).map((r) => (
              <option key={r} value={r}>{RANGE_LABELS[r]}</option>
            ))}
          </select>
        </div>
        <div className="spacer" />
        <ExportCsvButton entries={filtered} projects={projects} filename={filename} />
      </div>

      <div
        className="muted"
        style={{ marginBottom: 'var(--space-3)', fontSize: 'var(--fs-sm)' }}
      >
        Showing <strong className="tabular">{filtered.length}</strong>
        {entries.length !== filtered.length && (
          <> of <span className="tabular">{entries.length}</span></>
        )}{' '}
        entries
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: 'var(--space-2) var(--space-2)' }}>
          <EntriesList
            entries={filtered}
            projects={projects}
            showUser={userId === 'all'}
          />
        </div>
      </div>
    </>
  );
}
