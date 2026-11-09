import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { isAdmin } from '@/lib/admin';
import { destroyImage } from '@/lib/cloudinary';

const deny = () => NextResponse.json({ error: 'no_autorizado' }, { status: 401 });
const num = (v) => (v === '' || v == null || isNaN(Number(v)) ? null : Number(v));

export async function GET(req) {
  if (!(await isAdmin(req))) return deny();
  const q = sql();
  const [productos, categorias] = await Promise.all([
    q`SELECT p.*, c.nombre AS categoria, l.nombre AS linea
      FROM productos p JOIN categorias c ON c.id = p.categoria_id
      JOIN lineas l ON l.id = c.linea_id
      ORDER BY l.orden, c.orden, p.nombre`,
    q`SELECT c.id, c.nombre, l.nombre AS linea
      FROM categorias c JOIN lineas l ON l.id = c.linea_id ORDER BY l.orden, c.orden`,
  ]);
  return NextResponse.json({ productos, categorias });
}

export async function POST(req) {
  if (!(await isAdmin(req))) return deny();
  const b = await req.json().catch(() => ({}));
  const nombre = String(b.nombre || '').trim().slice(0, 120);
  if (!nombre || !b.categoria_id) return NextResponse.json({ error: 'datos_invalidos' }, { status: 400 });
  const q = sql();
  const unidad = String(b.unidad || 'kg').slice(0, 20);
  const disp = b.disponible !== false;
  if (b.id) {
    const old = await q`SELECT imagen_public_id FROM productos WHERE id = ${b.id}`;
    if (b.imagen_public_id && old[0]?.imagen_public_id && old[0].imagen_public_id !== b.imagen_public_id) {
      await destroyImage(old[0].imagen_public_id);
    }
    await q`UPDATE productos SET categoria_id=${b.categoria_id}, nombre=${nombre},
      precio_menor=${num(b.precio_menor)}, precio_mayor=${num(b.precio_mayor)},
      unidad=${unidad}, disponible=${disp},
      costo=${num(b.costo)}, stock_min=${num(b.stock_min)},
      imagen_url=COALESCE(${b.imagen_url || null}, imagen_url),
      imagen_public_id=COALESCE(${b.imagen_public_id || null}, imagen_public_id)
      WHERE id=${b.id}`;
  } else {
    await q`INSERT INTO productos (categoria_id, nombre, precio_menor, precio_mayor, unidad, disponible, costo, stock, stock_min, imagen_url, imagen_public_id)
      VALUES (${b.categoria_id}, ${nombre}, ${num(b.precio_menor)}, ${num(b.precio_mayor)}, ${unidad}, ${disp},
      ${num(b.costo)}, ${num(b.stock)}, ${num(b.stock_min)},
      ${b.imagen_url || null}, ${b.imagen_public_id || null})`;
  }
  revalidatePath('/'); return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  if (!(await isAdmin(req))) return deny();
  const id = new URL(req.url).searchParams.get('id');
  const q = sql();
  const r = await q`DELETE FROM productos WHERE id=${id} RETURNING imagen_public_id`;
  if (r[0]?.imagen_public_id) await destroyImage(r[0].imagen_public_id);
  revalidatePath('/'); return NextResponse.json({ ok: true });
}

export async function PUT(req) {
  if (!(await isAdmin(req))) return deny();
  const b = await req.json().catch(() => ({}));
  if (!b.id) return NextResponse.json({ error: 'datos_invalidos' }, { status: 400 });
  await sql()`UPDATE productos SET disponible = ${b.disponible === true} WHERE id = ${b.id}`;
  revalidatePath('/');
  return NextResponse.json({ ok: true });
}
