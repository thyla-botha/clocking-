'use client';

import { useState } from 'react';
import LiveTimer from '@/components/LiveTimer';

type Project = { id: string; name: string };

type DemoOpen = {
  projectId: string;
  startedAt: string;
  notes: string;
};

export default function DemoClockCard({ projects }: { projects: Project[] }) {
  const [open, setOpen] = useState<DemoOpen | null>(null);
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '');
  const [busy, setBusy] = useState(false);

  async function fakeLocate() {
    setBusy(true);
    await new Promise((r) => setTimeout(r, 600));
    setBusy(false);
  }

  async function clockIn() {
    await fakeLocate();
    setOpen({ projectId, startedAt: new Date().toISOString(), notes: '' });
  }

  async function clockOut() {
    await fakeLocate();
    setOpen(null);
  }

  if (open) {
    const since = new Date(open.startedAt).toLocaleString();
    const projectName = projects.find((p) => p.id === open.projectId)?.name ?? '—';
    return (
      <div className="clock-hero">
        <div className="clock-hero__status">
          <span className="badge badge--open">Clocked in</span>
          <span>since {since}</span>
        </div>
        <div className="clock-hero__project">{projectName}</div>
        <div className="clock-hero__timer"><LiveTimer startAt={open.startedAt} /></div>

        <div>
          <label className="label" htmlFor="demo-notes">Notes</label>
          <textarea
            id="demo-notes"
            className="input"
            placeholder="What are you working on?"
            rows={3}
            value={open.notes}
            onChange={(e) => setOpen({ ...open, notes: e.target.value })}
          />
          <p className="subtle" style={{ marginTop: 4 }}>Auto-saves in the real app.</p>
        </div>

        <button className="btn danger btn--lg btn--block" onClick={clockOut} disabled={busy}>
          {busy ? 'Reading location…' : 'Clock out'}
        </button>
      </div>
    );
  }

  return (
    <div className="stack stack--lg">
      <div>
        <label className="label" htmlFor="demo-project">Project</label>
        <select
          id="demo-project"
          className="input"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>
      <button className="btn btn--lg btn--block" onClick={clockIn} disabled={busy}>
        {busy ? 'Reading location…' : 'Clock in'}
      </button>
      <p className="subtle">Location permission is required in the real app.</p>
    </div>
  );
}
