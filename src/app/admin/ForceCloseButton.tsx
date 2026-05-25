'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function ForceCloseButton({ entryId }: { entryId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  async function onClick() {
    if (!confirm('Force-close this entry with no end location?')) return;
    setBusy(true);
    const supabase = createClient();
    const now = new Date().toISOString();
    const { data: existing } = await supabase
      .from('time_entries')
      .select('notes')
      .eq('id', entryId)
      .maybeSingle();
    const stamp = `[force-closed by admin ${now}]`;
    const notes = existing?.notes ? `${existing.notes}\n${stamp}` : stamp;
    const { error } = await supabase
      .from('time_entries')
      .update({ end_at: now, notes, auto_closed: true })
      .eq('id', entryId);
    setBusy(false);
    if (error) {
      alert(`Failed: ${error.message}`);
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <button className="btn danger btn--sm" onClick={onClick} disabled={busy}>
      {busy ? 'Closing…' : 'Force close'}
    </button>
  );
}
