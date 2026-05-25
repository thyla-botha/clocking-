import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'unauthorized' as const, status: 401 };
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile?.is_admin) return { error: 'forbidden' as const, status: 403 };
  return { user };
}

export async function POST(request: Request) {
  const gate = await requireAdmin();
  if ('error' in gate) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  let body: { email?: string; password?: string; is_admin?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password;
  const wantsAdmin = body.is_admin === true;

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email required.' }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError || !created?.user) {
    return NextResponse.json({ error: createError?.message ?? 'Create failed.' }, { status: 400 });
  }

  // The signup trigger inserts a profiles row. Set is_admin if requested.
  if (wantsAdmin) {
    const { error: roleError } = await admin
      .from('profiles')
      .update({ is_admin: true })
      .eq('id', created.user.id);
    if (roleError) {
      return NextResponse.json(
        { error: `User created but role update failed: ${roleError.message}` },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({
    user: { id: created.user.id, email: created.user.email, is_admin: wantsAdmin },
  });
}
