'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function NotesEditor({
  entryId,
  initialValue,
  placeholder = 'Notes — what are you working on?',
  rows = 3,
}: {
  entryId: string;
  initialValue: string | null;
  placeholder?: string;
  rows?: number;
}) {
  const [value, setValue] = useState(initialValue ?? '');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saved = useRef(initialValue ?? '');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function save(next: string) {
    if (next === saved.current) return;
    setStatus('saving');
    const supabase = createClient();
    const { error } = await supabase
      .from('time_entries')
      .update({ notes: next.length === 0 ? null : next })
      .eq('id', entryId);
    if (error) {
      setStatus('error');
    } else {
      saved.current = next;
      setStatus('saved');
      setTimeout(() => setStatus((s) => (s === 'saved' ? 'idle' : s)), 1400);
    }
  }

  function onChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const next = e.target.value;
    setValue(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => save(next), 700);
  }

  return (
    <div className="stack" style={{ gap: 4 }}>
      <label className="label" htmlFor={`notes-${entryId}`}>Notes</label>
      <textarea
        id={`notes-${entryId}`}
        className="input"
        value={value}
        onChange={onChange}
        onBlur={() => save(value)}
        placeholder={placeholder}
        rows={rows}
      />
      <div className="subtle" style={{ minHeight: 18, marginTop: 4 }} aria-live="polite">
        {status === 'saving' && 'Saving…'}
        {status === 'saved' && <span className="ok">Saved</span>}
        {status === 'error' && <span style={{ color: '#FCA5A5' }}>Save failed</span>}
      </div>
    </div>
  );
}
