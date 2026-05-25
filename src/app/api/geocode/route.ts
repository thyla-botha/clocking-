import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Reverse-geocode a lat/lng to a human-readable address via OpenStreetMap Nominatim.
// Best-effort: returns { address: null } on any failure rather than erroring,
// so clock-in/out still works if the geocoder is down.
// Nominatim requires a real User-Agent and limits to ~1 req/sec.
export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get('lat');
  const lng = req.nextUrl.searchParams.get('lng');
  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat and lng required' }, { status: 400 });
  }

  const url = `https://nominatim.openstreetmap.org/reverse?format=json&zoom=18&lat=${encodeURIComponent(
    lat,
  )}&lon=${encodeURIComponent(lng)}`;

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
