'use client';

import { useState } from 'react';
import type { Entry } from '@/components/EntriesList';

type Project = { id: string; name: string };

function initials(email: string | null | undefined) {
  if (!email) return '?';
  const local = email.split('@')[0] ?? '';
  return local.slice(0, 2).toUpperCase();
}

export default function DemoAdminOpenTable({
  entries,
  projects,
}: {
  entries: Entry[];
  projects: Project[];
}) {
  const [closed, setClosed] = useState<Set<string>>(new Set());
  const visible = entries.filter((e) => !closed.has(e.id));

  if (visible.length === 0) {
    return <div className="empty">Nobody is clocked in right now.</div>;
  }

  return (
    <div className="table-wrap">
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
          {visible.map((e) => (
            <tr key={e.id}>
              <td data-label="User">
                <span className="row" style={{ gap: 10 }}>
                  <span className="avatar">{initials(e.user_email)}</span>
                  <span>{e.user_email ?? '—'}</span>
                </span>
              </td>
              <td data-label="Project">{projects.find((p) => p.id === e.project_id)?.name ?? '—'}</td>
              <td data-label="Started" className="tabular">{new Date(e.start_at).toLocaleString()}</td>
              <td data-label="Action">
                <button
                  className="btn danger btn--sm"
                  onClick={() => setClosed(new Set([...closed, e.id]))}
                >
                  Force close
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
