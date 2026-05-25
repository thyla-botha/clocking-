import Link from 'next/link';

export type PeriodKey = 'this-week' | 'last-week' | 'this-month' | 'last-month';

export const PERIOD_LABELS: Record<PeriodKey, string> = {
  'this-week': 'This week',
  'last-week': 'Last week',
  'this-month': 'This month',
  'last-month': 'Last month',
};

export const PERIOD_KEYS: PeriodKey[] = ['this-week', 'last-week', 'this-month', 'last-month'];

function fmtHours(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export type TotalsRow = {
  userId: string;
  email: string | null;
  minutes: number;
  entries: number;
};

export default function TotalsPanel({
  period,
  rows,
}: {
  period: PeriodKey;
  rows: TotalsRow[];
}) {
  const totalMinutes = rows.reduce((acc, r) => acc + r.minutes, 0);
  const sorted = [...rows].sort((a, b) => b.minutes - a.minutes);

  return (
    <>
      <h2>Totals</h2>
      <p className="muted" style={{ marginTop: -8, marginBottom: 'var(--space-3)' }}>
        Hours per user for the selected period. Open entries are counted up to now.
      </p>
      <div
        className="row row--wrap"
        style={{ marginBottom: 'var(--space-3)', gap: 'var(--space-2)', alignItems: 'center' }}
      >
        {PERIOD_KEYS.map((k) => (
          <Link
            key={k}
            href={`/admin?period=${k}`}
            className={`btn ${k === period ? 'primary' : 'ghost'}`}
          >
            {PERIOD_LABELS[k]}
          </Link>
        ))}
        <div className="spacer" />
        <div className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
          Total <strong className="tabular">{fmtHours(totalMinutes)}</strong>
          {' '}across <span className="tabular">{sorted.length}</span>
          {' '}{sorted.length === 1 ? 'user' : 'users'}
        </div>
      </div>
      <div className="card" style={{ padding: 0 }}>
        {sorted.length === 0 ? (
          <div className="empty">No entries in this period.</div>
        ) : (
          <div className="table-wrap" style={{ padding: 'var(--space-2) var(--space-2)' }}>
            <table className="table-responsive">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Hours</th>
                  <th>Entries</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r) => (
                  <tr key={r.userId}>
                    <td data-label="User">{r.email ?? '—'}</td>
                    <td data-label="Hours" className="tabular">{fmtHours(r.minutes)}</td>
                    <td data-label="Entries" className="tabular">{r.entries}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
