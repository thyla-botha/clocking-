import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Reverse-geocode a lat/lng to a human-readable address via OpenStreetMap Nominatim.
// Auth-gated so it can't be abused as a free Nominatim proxy. Best-effort: returns
// { address: null } on upstream failure so clock-in/out still works if the geocoder is down.
// Nominatim requires a real User-Agent and limits to ~1 req/sec.
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const latStr = req.nextUrl.searchParams.get('lat');
  const lngStr = req.nextUrl.searchParams.get('lng');
  const lat = Number(latStr);
  const lng = Number(lngStr);
  if (
    !Number.isFinite(lat) || !Number.isFinite(lng) ||
    Math.abs(lat) > 90 || Math.abs(lng) > 180
  ) {
    return NextResponse.json({ error: 'lat and lng required' }, { status: 400 });
  }

  const url = `https://nominatim.openstreetmap.org/reverse?format=json&zoom=18&lat=${lat}&lon=${lng}`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'TimeStamp/1.0 (time-tracking app)',
        Accept: 'application/json',
        'Accept-Language': 'en',
      },
      cache: 'no-store',
    });
    if (!res.ok) return NextResponse.json({ address: null });
    const data = (await res.json()) as { display_name?: string };
    return NextResponse.json({ address: data.display_name ?? null });
  } catch {
    return NextResponse.json({ address: null });
  }
}
