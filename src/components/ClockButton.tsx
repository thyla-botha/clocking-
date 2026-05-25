'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getPosition, GeoError } from '@/lib/geo';
import NotesEditor from './NotesEditor';
import LiveTimer from './LiveTimer';

async function fetchAddress(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);
    if (!res.ok) return null;
    const data = (await res.json()) as { address?: string | null };
    return data.address ?? null;
  } catch {
    return null;
  }
}

type Project = { id: string; name: string };
type OpenEntry = {
  id: string;
  start_at: string;
  project_id: string | null;
  notes: string | null;
} | null;

export default function ClockButton({
  projects,
  openEntry,
  userId,
}: {
  projects: Project[];
  openEntry: OpenEntry;
  userId: string;
}) {
  const router = useRouter();
  const [projectId, setProjectId] = useState<string>(
    openEntry?.project_id ?? projects[0]?.id ?? '',
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function handleClockIn() {
    if (!projectId) {
      setError('Pick a project first.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const coords = await getPosition();
      const address = await fetchAddress(coords.lat, coords.lng);
      const supabase = createClient();
      const { error: insertError } = await supabase.from('time_entries').insert({
        user_id: userId,
        project_id: projectId,
        start_at: new Date().toISOString(),
        start_lat: coords.lat,
        start_lng: coords.lng,
        start_accuracy: coords.accuracy,
        start_address: address,
      });
      if (insertError) {
        if (insertError.code === '23505') {
          setError('You already have an open entry. Refresh the page.');
        } else {
          setError(insertError.message);
        }
        return;
      }
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof GeoError ? e.message : 'Could not clock in.');
    } finally {
      setBusy(false);
    }
  }

  async function handleClockOut() {
    if (!openEntry) return;
    setError(null);
    setBusy(true);
    try {
      const coords = await getPosition();
      const address = await fetchAddress(coords.lat, coords.lng);
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from('time_entries')
        .update({
          end_at: new Date().toISOString(),
          end_lat: coords.lat,
          end_lng: coords.lng,
          end_accuracy: coords.accuracy,
          end_address: address,
        })
        .eq('id', openEntry.id);
      if (updateError) {
        setError(updateError.message);
        return;
      }
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof GeoError ? e.message : 'Could not clock out.');
    } finally {
      setBusy(false);
    }
  }

  if (openEntry) {
    const since = new Date(openEntry.start_at).toLocaleString();
    const projectName =
      projects.find((p) => p.id === openEntry.project_id)?.name ?? 'Unknown project';
    return (
      <div className="clock-hero">
        <div className="clock-hero__status">
          <span className="badge badge--open">Clocked in</span>
          <span>since {since}</span>
        </div>
        <div className="clock-hero__project">{projectName}</div>
        <div className="clock-hero__timer">
          <LiveTimer startAt={openEntry.start_at} />
        </div>

        <NotesEditor entryId={openEntry.id} initialValue={openEntry.notes} rows={3} />

        <button className="btn danger btn--lg btn--block" onClick={handleClockOut} disabled={busy}>
          {busy ? 'Reading location…' : 'Clock out'}
        </button>
        {error && <p className="error" role="alert">{error}</p>}
      </div>
    );
  }

  return (
    <div className="stack stack--lg">
      <div>
        <label className="label" htmlFor="project">Project</label>
        <select
          id="project"
          className="input"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
        >
          {projects.length === 0 && <option value="">No projects — add one in Supabase</option>}
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>
      <button className="btn btn--lg btn--block" onClick={handleClockIn} disabled={busy || !projectId}>
        {busy ? 'Reading location…' : 'Clock in'}
      </button>
      <p className="subtle">Location permission is required.</p>
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  );
}
