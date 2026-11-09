import { NextResponse } from 'next/server';
import { isAdmin, changePassword } from '@/lib/admin';
import { limited } from '@/lib/ratelimit';

export async function POST(req) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: 'no_autorizado' }, { status: 401 });
  if (await limited('clave', 5, 300)) return NextResponse.json({ error: 'demasiados_intentos' }, { status: 429 });
  const { actual, nueva } = await req.json().catch(() => ({}));
  const r = await changePassword(actual, nueva);
  return NextResponse.json(r, { status: r.ok ? 200 : 400 });
}
