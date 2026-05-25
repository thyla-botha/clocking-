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

  const filtered = useMemo(() => {
    if (userId === 'all') return entries;
    return entries.filter((e) => e.user_id === userId);
  }, [entries, userId]);

  const selectedEmail = profiles.find((p) => p.id === userId)?.email ?? null;
  const filename =
    userId === 'all' ? 'all-time-entries.csv' : `${slugify(selectedEmail)}-time-entries.csv`;

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
        <div className="spacer" />
        <ExportCsvButton entries={filtered} projects={projects} filename={filename} />
      </div>

      <div
        className="muted"
        style={{ marginBottom: 'var(--space-3)', fontSize: 'var(--fs-sm)' }}
      >
        Showing <strong className="tabular">{filtered.length}</strong>
        {userId !== 'all' && entries.length !== filtered.length && (
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
