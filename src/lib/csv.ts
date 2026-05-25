import type { Entry } from '@/components/EntriesList';

type Project = { id: string; name: string };

const HEADERS = [
  'id',
  'user_email',
  'project',
  'start_at',
  'end_at',
  'duration_minutes',
  'start_lat',
  'start_lng',
  'end_lat',
  'end_lng',
  'auto_closed',
  'notes',
];

function escape(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function durationMinutes(start: string, end: string | null): string {
  if (!end) return '';
  return String(Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000));
}

export function entriesToCsv(entries: Entry[], projects: Project[]): string {
  const projectName = (id: string | null) =>
    id ? projects.find((p) => p.id === id)?.name ?? '' : '';

  const rows = entries.map((e) => [
    e.id,
    e.user_email ?? '',
    projectName(e.project_id),
    e.start_at,
    e.end_at ?? '',
    durationMinutes(e.start_at, e.end_at),
    e.start_lat ?? '',
    e.start_lng ?? '',
    e.end_lat ?? '',
    e.end_lng ?? '',
    e.auto_closed ? 'true' : 'false',
    e.notes ?? '',
  ]);

  return [HEADERS, ...rows].map((row) => row.map(escape).join(',')).join('\n');
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
