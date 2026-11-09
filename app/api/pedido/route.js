import { NextResponse } from 'next/server';
import { limited } from '@/lib/ratelimit';
import { crearPedido } from '@/lib/ventas';

export async function POST(req) {
  const ip = (req.headers.get('x-forwarded-for') || 'x').split(',')[0].trim();
  if (await limited('pedido:' + ip, 8, 60)) return NextResponse.json({ error: 'demasiados' }, { status: 429 });
  const b = await req.json().catch(() => ({}));
  try {
    const r = await crearPedido(b);
    return NextResponse.json(r, { status: r.error ? 400 : 200 });
  } catch (e) {
    console.error('pedido', e?.code || '', e?.message || '');
    return NextResponse.json({ error: 'error_servidor' }, { status: 500 });
  }
}
