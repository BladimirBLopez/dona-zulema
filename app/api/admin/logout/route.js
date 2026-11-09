import { NextResponse } from 'next/server';
import { COOKIE } from '@/lib/admin';

export async function GET(req) {
  const res = NextResponse.redirect(new URL('/admin', req.url));
  res.headers.set('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
  return res;
}
