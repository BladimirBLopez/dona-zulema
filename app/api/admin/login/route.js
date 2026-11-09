import { NextResponse } from 'next/server';
import { loginToken, COOKIE, COOKIE_MAX_AGE } from '@/lib/admin';
import { limited } from '@/lib/ratelimit';

export async function POST(req) {
  const ip = (req.headers.get('x-forwarded-for') || 'x').split(',')[0].trim();
  if (await limited('login:' + ip, 5, 300)) {
    return NextResponse.json({ error: 'demasiados_intentos' }, { status: 429 });
  }
  const { password } = await req.json().catch(() => ({}));
  const token = await loginToken(password);
  if (!token) return NextResponse.json({ error: 'clave_incorrecta' }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  res.headers.set('Set-Cookie', `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`);
  return res;
}
