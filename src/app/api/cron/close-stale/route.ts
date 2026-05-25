import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Entries open longer than this are auto-closed.
const STALE_HOURS = 16;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const expected = `Bearer ${process.env.CRON_SECRET ?? ''}`;
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const cutoff = new Date(Date.now() - STALE_HOURS * 3600 * 1000).toISOString();

  const { data: stale, error: selectError } = await supabase
    .from('time_entries')
    .select('id, notes')
    .is('end_at', null)
    .lt('start_at', cutoff);

  if (selectError) {
    return NextResponse.json({ error: selectError.message }, { status: 500 });
  }
  if (!stale || stale.length === 0) {
    return NextResponse.json({ closed: 0 });
  }

  const now = new Date().toISOString();
  const stamp = `[auto-closed ${now}]`;

  const results = await Promise.all(
    stale.map((entry) => {
      const merged = entry.notes ? `${entry.notes}\n${stamp}` : stamp;
      return supabase
        .from('time_entries')
        .update({ end_at: now, notes: merged, auto_closed: true })
        .eq('id', entry.id);
    }),
  );

  const failures = results.filter((r) => r.error).map((r) => r.error?.message);
  if (failures.length > 0) {
    return NextResponse.json(
      { closed: stale.length - failures.length, failures },
      { status: 500 },
    );
  }
  return NextResponse.json({ closed: stale.length });
}
