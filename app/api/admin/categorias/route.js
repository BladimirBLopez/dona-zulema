import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { isAdmin } from '@/lib/admin';

const deny = () => NextResponse.json({ error: 'no_autorizado' }, { status: 401 });
const slugify = (t) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export async function GET(req) {
  if (!(await isAdmin(req))) return deny();
  const q = sql();
  const [lineas, categorias] = await Promise.all([
    q`SELECT id, nombre FROM lineas ORDER BY orden`,
    q`SELECT c.id, c.nombre, c.linea_id, (SELECT count(*) FROM productos p WHERE p.categoria_id = c.id)::int AS total
      FROM categorias c ORDER BY c.orden, c.id`,
  ]);
  return NextResponse.json({ lineas, categorias });
}

export async function POST(req) {
  if (!(await isAdmin(req))) return deny();
  const b = await req.json().catch(() => ({}));
  const nombre = String(b.nombre || '').trim().slice(0, 60);
  if (nombre.length < 2) return NextResponse.json({ error: 'nombre_invalido' }, { status: 400 });
  const q = sql();
  if (b.id) {
    await q`UPDATE categorias SET nombre = ${nombre} WHERE id = ${b.id}`;
  } else {
    if (!b.linea_id) return NextResponse.json({ error: 'datos_invalidos' }, { status: 400 });
    let slug = slugify(nombre) || 'cat';
    const ex = await q`SELECT 1 FROM categorias WHERE linea_id = ${b.linea_id} AND slug = ${slug}`;
    if (ex.length) slug += '-' + Date.now().toString(36);
    await q`INSERT INTO categorias (linea_id, nombre, slug, orden)
      VALUES (${b.linea_id}, ${nombre}, ${slug},
      (SELECT COALESCE(MAX(orden), 0) + 1 FROM categorias WHERE linea_id = ${b.linea_id}))`;
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  if (!(await isAdmin(req))) return deny();
  const id = new URL(req.url).searchParams.get('id');
  const q = sql();
  const [{ n }] = await q`SELECT count(*)::int AS n FROM productos WHERE categoria_id = ${id}`;
  if (n > 0) return NextResponse.json({ error: 'tiene_productos' }, { status: 409 });
  await q`DELETE FROM categorias WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
