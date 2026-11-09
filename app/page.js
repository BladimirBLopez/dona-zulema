import { sql } from '@/lib/db';
import { thumb } from '@/lib/cloudinary';

export const revalidate = 60;

const WA = '59175284955';
const wa = (t) => `https://wa.me/${WA}?text=${encodeURIComponent(t)}`;

async function getData() {
  const rows = await sql()`
    SELECT p.id, p.nombre, p.descripcion, p.precio_menor, p.precio_mayor,
           p.unidad, p.imagen_url, c.nombre AS categoria, c.orden AS corden,
           l.nombre AS linea, l.orden AS lorden
    FROM productos p
    JOIN categorias c ON c.id = p.categoria_id
    JOIN lineas l ON l.id = c.linea_id
    WHERE p.disponible
    ORDER BY l.orden, c.orden, p.orden, p.nombre`;
  const out = [];
  for (const r of rows) {
    let l = out.find((x) => x.nombre === r.linea);
    if (!l) out.push((l = { nombre: r.linea, cats: [] }));
    let c = l.cats.find((x) => x.nombre === r.categoria);
    if (!c) l.cats.push((c = { nombre: r.categoria, items: [] }));
    c.items.push(r);
  }
  return out;
}

const bs = (v) => (v == null ? null : 'Bs ' + Number(v).toFixed(2));

export default async function Home() {
  let lineas = [];
  try { lineas = await getData(); } catch (e) { console.error(e); }

  return (
    <main className="mx-auto max-w-5xl p-4">
      <header className="py-6 text-center">
        <h1 className="text-3xl font-extrabold text-red-800">Doña Zulema</h1>
        <p className="text-stone-600">Quesos, fiambres, lácteos, pollo y menudencias</p>
        <p className="text-sm text-stone-500">Al por mayor y menor</p>
        <a href={wa('Hola, quiero hacer un pedido')} className="mt-4 inline-block rounded-full bg-green-600 px-6 py-3 font-bold text-white">
          Pedir por WhatsApp
        </a>
      </header>

      {lineas.length === 0 && (
        <p className="py-10 text-center text-stone-500">Pronto tendremos el catálogo aquí.</p>
      )}

      {lineas.map((l) => (
        <section key={l.nombre} className="mb-10">
          <h2 className="mb-3 border-b-2 border-amber-400 text-2xl font-bold text-red-800">{l.nombre}</h2>
          {l.cats.map((c) => (
            <div key={c.nombre} className="mb-6">
              <h3 className="mb-2 text-lg font-semibold">{c.nombre}</h3>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {c.items.map((p) => (
                  <article key={p.id} className="overflow-hidden rounded-xl bg-white shadow">
                    {p.imagen_url && <img src={thumb(p.imagen_url, 400)} alt={p.nombre} className="h-32 w-full object-cover" loading="lazy" />}
                    <div className="p-3">
                      <h4 className="font-semibold">{p.nombre}</h4>
                      {bs(p.precio_menor) && <p className="text-sm">Menor: <b>{bs(p.precio_menor)}</b>/{p.unidad}</p>}
                      {bs(p.precio_mayor) && <p className="text-sm text-stone-600">Mayor: {bs(p.precio_mayor)}/{p.unidad}</p>}
                      <a href={wa(`Hola, quiero pedir: ${p.nombre}`)} className="mt-2 block rounded bg-green-600 py-1 text-center text-sm font-bold text-white">
                        Pedir
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </section>
      ))}
    </main>
  );
}
