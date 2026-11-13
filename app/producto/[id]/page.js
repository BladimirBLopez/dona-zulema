import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { sql } from '@/lib/db';
import { thumb } from '@/lib/cloudinary';
import { getNegocio, makeWa } from '@/lib/negocio';
import WhatsApp from '@/components/WhatsApp';

export const revalidate = 60;

const bs = (v) => (v == null || v === '' ? null : 'Bs ' + Number(v).toFixed(2));

async function getProducto(id) {
  try {
    const rows = await sql()`
      SELECT p.id, p.nombre, p.precio_menor, p.precio_mayor, p.mayor_desde, p.unidad, p.imagen_url,
             c.nombre AS categoria, c.id AS cid
      FROM productos p JOIN categorias c ON c.id = p.categoria_id
      WHERE p.id = ${id} AND p.disponible`;
    return rows[0] || null;
  } catch (e) { return null; }
}

async function getRelacionados(p) {
  try {
    return await sql()`
      SELECT id, nombre, imagen_url, precio_menor FROM productos
      WHERE categoria_id = ${p.cid} AND id <> ${p.id} AND disponible
      ORDER BY orden, nombre LIMIT 4`;
  } catch (e) { return []; }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const p = await getProducto(id);
  const N = await getNegocio();
  if (!p) return { title: N.nombre };
  const titulo = `${p.nombre} | Frial Jurado`;
  const precio = p.precio_menor == null
    ? ''
    : ` Precio por menor: Bs ${Number(p.precio_menor).toFixed(2)}.`;
  const descripcion = `${p.nombre} (${p.categoria}) en Frial Jurado.${precio} Venta al por mayor y menor. Pedidos por WhatsApp.`;

  return {
    title: titulo,
    description: descripcion,
    alternates: { canonical: `/producto/${id}` },
    openGraph: {
      title: titulo,
      description: descripcion,
    },
  };
}

export default async function Producto({ params }) {
  const { id } = await params;
  const p = await getProducto(id);
  if (!p) notFound();
  const N = await getNegocio();
  const wa = makeWa(N.whatsapp);
  const rel = await getRelacionados(p);
  const u = p.unidad || 'kg';
  const menor = bs(p.precio_menor);
  const mayor = bs(p.precio_mayor);
  const mayorDesde = Number(p.mayor_desde) > 0
    ? Number(p.mayor_desde) : null;

  return (
    <main className="min-h-screen bg-crema">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
        <Link href="/#catalogo" className="inline-flex items-center gap-2 text-sm font-semibold text-vino-800">
          <ArrowLeft size={18} /> Volver al catálogo
        </Link>
        <section className="mt-5 grid gap-5 overflow-hidden rounded-3xl bg-white p-4 shadow-card ring-1 ring-vino-900/10 md:grid-cols-2 md:gap-8 md:p-8">
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-white to-vino-50 p-4 sm:p-7">
            {p.imagen_url ? (
              <img
                src={thumb(p.imagen_url, 900)}
                srcSet={`${thumb(p.imagen_url, 480)} 480w, ${thumb(p.imagen_url, 900)} 900w`}
                sizes="(min-width: 768px) 45vw, 100vw"
                width={900}
                height={900}
                fetchPriority="high"
                decoding="async"
                alt={p.nombre}
                className="h-full w-full object-contain"
              />
            ) : (
              <span className="text-sm font-medium text-stone-500">
                Imagen no disponible
              </span>
            )}
          </div>
          <div className="flex flex-col">
            <span className="w-fit rounded-full bg-vino-50 px-3 py-1 text-xs font-semibold text-vino-800">{p.categoria}</span>
            <h1 className="mt-3 font-serif text-2xl font-extrabold leading-tight text-vino-900 sm:text-3xl">{p.nombre}</h1>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {menor && (
                <div className="rounded-2xl border border-vino-100 bg-vino-50 p-4">
                  <p className="text-xs font-semibold text-vino-700">PRECIO POR MENOR</p>
                  <p className="mt-2 text-2xl font-extrabold text-vino-900">{menor}</p>
                  <p className="text-xs text-vino-700">Por {u}</p>
                </div>
              )}
              {mayor && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-semibold text-amber-900">PRECIO POR MAYOR</p>
                  <p className="mt-2 text-2xl font-extrabold text-amber-950">{mayor}</p>
                  <p className="text-xs text-amber-900">
                    {mayorDesde
                      ? `Desde ${mayorDesde} ${u}`
                      : `Por ${u} · mínimo a consultar`}
                  </p>
                </div>
              )}
              {!menor && !mayor && (
                <p className="rounded-xl bg-stone-100 p-4 text-sm text-stone-600">
                  Consultar precio
                </p>
              )}
            </div>
            <p className="mt-4 text-sm text-stone-600">El precio final se confirma al momento del pedido.</p>
            <div className="mt-auto space-y-3 pt-6">
              <Link
                href={`/?agregar=${p.id}#catalogo`}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-vino-800 px-5 py-3 text-center font-bold text-white shadow transition hover:bg-vino-700"
              >
                Agregar al pedido
              </Link>
              <a
                href={wa(`Hola, quisiera consultar por ${p.nombre}.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-green-600 px-4 py-2 text-center text-sm font-bold text-green-700 hover:bg-green-50"
              >
                <WhatsApp size={20} /> Consultar por WhatsApp
              </a>
            </div>
          </div>
        </section>
        {rel.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 font-serif text-xl font-extrabold text-vino-800">También te puede gustar</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {rel.map((r) => (
                <Link key={r.id} href={`/producto/${r.id}`} className="overflow-hidden rounded-2xl bg-white shadow-card">
                  <div className="aspect-[4/3] bg-vino-100">
                    {r.imagen_url && <img src={thumb(r.imagen_url, 400)} alt={r.nombre} loading="lazy" decoding="async" className="h-full w-full object-contain p-2" />}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold text-stone-900">{r.nombre}</p>
                    <p className="mt-1 text-sm font-extrabold text-vino-800">
                      {bs(r.precio_menor) || 'Consultar precio'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
