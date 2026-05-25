import { mapsLink } from '@/lib/geo';

export type Entry = {
  id: string;
  start_at: string;
  end_at: string | null;
  start_lat: number | null;
  start_lng: number | null;
  end_lat: number | null;
  end_lng: number | null;
  start_address?: string | null;
  end_address?: string | null;
  project_id: string | null;
  notes: string | null;
  auto_closed: boolean | null;
  user_id?: string;
  user_email?: string | null;
};

type Project = { id: string; name: string };

function fmtDuration(start: string, end: string | null): string {
  if (!end) return '—';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const mins = Math.round(ms / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function fmt(ts: string | null): string {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function EntriesList({
  entries,
  projects,
  showUser = false,
}: {
  entries: Entry[];
  projects: Project[];
  showUser?: boolean;
}) {
  if (entries.length === 0) {
    return <div className="empty">No entries yet.</div>;
  }
  const projectName = (id: string | null) =>
    id ? projects.find((p) => p.id === id)?.name ?? 'Unknown' : '—';

  return (
    <div className="table-wrap">
      <table className="table-responsive">
        <thead>
          <tr>
            {showUser && <th>User</th>}
            <th>Project</th>
            <th>Start</th>
            <th>End</th>
            <th>Duration</th>
            <th>Location</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id}>
              {showUser && (
                <td data-label="User">{e.user_email ?? '—'}</td>
              )}
              <td data-label="Project"><strong>{projectName(e.project_id)}</strong></td>
              <td data-label="Start" className="tabular">{fmt(e.start_at)}</td>
              <td data-label="End" className="tabular">
                {fmt(e.end_at)}
                {e.auto_closed && <span className="badge badge--auto" style={{ marginLeft: 6 }}>auto</span>}
              </td>
              <td data-label="Duration" className="tabular">{fmtDuration(e.start_at, e.end_at)}</td>
              <td data-label="Location" style={{ maxWidth: 320 }}>
                {e.start_address || (e.start_lat != null && e.start_lng != null) ? (
                  <div className="stack" style={{ gap: 4 }}>
                    <div>
                      <span aria-hidden style={{ marginRight: 4 }}>📍</span>
                      {e.start_address ? (
                        <a
                          href={e.start_lat != null && e.start_lng != null ? mapsLink(e.start_lat, e.start_lng) : '#'}
                          target="_blank"
                          rel="noreferrer"
                          title="Open in Google Maps"
                        >
                          {e.start_address}
                        </a>
                      ) : (
                        <a
                          href={mapsLink(e.start_lat as number, e.start_lng as number)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View start on map
                        </a>
                      )}
                    </div>
                    {(e.end_address || (e.end_lat != null && e.end_lng != null)) && (
                      <div className="subtle" style={{ fontSize: 'var(--fs-xs)' }}>
                        <span aria-hidden style={{ marginRight: 4 }}>→</span>
                        {e.end_address ? (
                          <a
                            href={e.end_lat != null && e.end_lng != null ? mapsLink(e.end_lat, e.end_lng) : '#'}
                            target="_blank"
                            rel="noreferrer"
                            title="Open in Google Maps"
                          >
                            {e.end_address}
                          </a>
                        ) : (
                          <a
                            href={mapsLink(e.end_lat as number, e.end_lng as number)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View end on map
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="subtle">—</span>
                )}
              </td>
              <td data-label="Notes" style={{ maxWidth: 280, whiteSpace: 'pre-wrap' }}>
                {e.notes ? e.notes : <span className="subtle">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
