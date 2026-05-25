'use client';

import type { Entry } from './EntriesList';
import { entriesToCsv, downloadCsv } from '@/lib/csv';

type Project = { id: string; name: string };

export default function ExportCsvButton({
  entries,
  projects,
  filename = 'time-entries.csv',
  label = 'Export CSV',
}: {
  entries: Entry[];
  projects: Project[];
  filename?: string;
  label?: string;
}) {
  function onClick() {
    const csv = entriesToCsv(entries, projects);
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(filename.replace('.csv', `-${stamp}.csv`), csv);
  }
  return (
    <button className="btn ghost btn--sm" onClick={onClick} disabled={entries.length === 0}>
      {label}
    </button>
  );
}
