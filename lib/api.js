import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';

const STATUS = { no_encontrada: 404, no_encontrado: 404, sin_deuda: 409 };

export function admin(fn) {
  return async (req) => {
    if (!(await isAdmin(req))) return NextResponse.json({ error: 'no_autorizado' }, { status: 401 });
    try {
      const body = req.method === 'GET' || req.method === 'DELETE' ? null : await req.json().catch(() => ({}));
      const out = await fn({ body, p: new URL(req.url).searchParams });
      if (out?.error) return NextResponse.json(out, { status: STATUS[out.error] || 400 });
      return NextResponse.json(out);
    } catch (e) {
      console.error('admin api', e?.code || '', e?.message || '');
      if (e?.code === '23514' &&
          (e?.constraint === 'productos_stock_no_negativo' ||
           String(e?.message || '').includes('productos_stock_no_negativo'))) {
        return NextResponse.json(
          { error: 'stock_insuficiente' },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: e?.code === '42P01' || e?.code === '42703' ? 'falta_tabla' : 'error_servidor' }, { status: 500 });
    }
  };
}
