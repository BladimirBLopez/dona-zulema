import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { cldConfig, signParams } from '@/lib/cloudinary';

export async function POST(req) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: 'no_autorizado' }, { status: 401 });
  const c = cldConfig();
  if (!c) return NextResponse.json({ error: 'cloudinary_no_configurado' }, { status: 500 });
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'dona-zulema/productos';
  const signature = signParams({ folder, timestamp }, c.apiSecret);
  return NextResponse.json({ cloudName: c.cloudName, apiKey: c.apiKey, timestamp, folder, signature });
}
