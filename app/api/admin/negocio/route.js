import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { isAdmin } from '@/lib/admin';
import { getNegocio, limpiar } from '@/lib/negocio';

const deny = () => NextResponse.json({ error: 'no_autorizado' }, { status: 401 });

export async function GET(req) {
  if (!(await isAdmin(req))) return deny();
  return NextResponse.json(await getNegocio());
}

export async function POST(req) {
  if (!(await isAdmin(req))) return deny();
  const b = await req.json().catch(() => ({}));
  const v = JSON.stringify(limpiar(b));
  await sql()`INSERT INTO app_settings (key, value, updated_at) VALUES ('negocio', ${v}, now())
    ON CONFLICT (key) DO UPDATE SET value = ${v}, updated_at = now()`;
  revalidatePath('/'); return NextResponse.json({ ok: true });
}
