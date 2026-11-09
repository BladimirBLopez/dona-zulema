import { Beneficios, Info } from './secciones';
import { getNegocio, makeWa } from '@/lib/negocio';
import { sql } from '@/lib/db';
import { thumb } from '@/lib/cloudinary';

export const revalidate = 60;

const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-');
const bs = (v) => (v == null ? null : 'Bs ' + Number(v).toFixed(2));
const serif = { fontFamily: 'var(--font-serif), Georgia, serif' };

async function getData() {
  const rows = await sql()`
    SELECT p.id, p.nombre, p.precio_menor, p.precio_mayor, p.unidad, p.imagen_url,
           c.nombre AS categoria, l.nombre AS linea, l.slug AS lslug
    FROM productos p
    JOIN categorias c ON c.id = p.categoria_id
    JOIN lineas l ON l.id = c.linea_id
    WHERE p.disponible
    ORDER BY l.orden, c.orden, p.orden, p.nombre`;
  const out = [];
  for (const r of rows) {
    let l = out.find((x) => x.nombre === r.linea);
    if (!l) out.push((l = { nombre: r.linea, lslug: r.lslug, cats: [] }));
    let c = l.cats.find((x) => x.nombre === r.categoria);
    if (!c) l.cats.push((c = { nombre: r.categoria, items: [] }));
    c.items.push(r);
  }
  return out;
}

function WaIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.8 14.2c-.2.7-1.4 1.3-2 1.4-.5.1-1.2.1-1.9-.1-.4-.1-1-.3-1.7-.6-3-1.3-4.9-4.3-5-4.5-.1-.2-1.2-1.6-1.2-3s.8-2.1 1-2.4c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .6l-.4.6c-.1.2-.3.4-.1.7.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.7-.1l.9-1.1c.2-.3.4-.2.7-.1l1.9.9c.3.1.5.2.6.4.1.1.1.8-.1 1.5Z" />
    </svg>
  );
}

export default async function Home() {
  const N = await getNegocio();
  const wa = makeWa(N.whatsapp);
  let lineas = [];
  try { lineas = await getData(); } catch (e) { console.error(e); }
  const cats = lineas.flatMap((l) => l.cats.map((c) => c.nombre));

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-amber-200/60 bg-[#7a1414]/95 text-white backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <a href="#" className="text-xl font-extrabold tracking-tight" style={serif}>{N.nombre}</a>
          <a href={wa('Hola, quiero hacer un pedido')} className="flex items-center gap-2 rounded-full bg-green-500 px-4 py-2 text-sm font-bold shadow">
            <WaIcon className="h-4 w-4" /> Pedir
          </a>
        </div>
        {cats.length > 0 && (
          <nav className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-3 text-sm">
            {cats.map((c) => (
              <a key={c} href={`#${slug(c)}`} className="whitespace-nowrap rounded-full border border-amber-300/50 px-3 py-1 text-amber-100 hover:bg-amber-300 hover:text-red-900">
                {c}
              </a>
            ))}
          </nav>
        )}
      </header>

      <section className="relative overflow-hidden bg-gradient-to-br from-[#5e0d0d] via-[#8b1a1a] to-[#b02a1e] text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 text-center md:py-24">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">{N.slogan}</p>
          <h1 className="text-4xl font-extrabold leading-tight md:text-6xl" style={serif}>
            Frescura y sabor,<br />al por mayor y menor
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-amber-100/90">
            Quesos, fiambres Sofía, lácteos PIL, pollo y menudencias. Haz tu pedido directo por WhatsApp.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href={wa('Hola, quiero hacer un pedido')} className="flex items-center gap-2 rounded-full bg-green-500 px-8 py-3 font-bold shadow-lg">
              <WaIcon /> Pedir por WhatsApp
            </a>
            <a href="#catalogo" className="rounded-full border border-amber-300 px-8 py-3 font-semibold text-amber-200">Ver catálogo</a>
          </div>
          <ul className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-amber-200">
            <li>✔ Mayor y menor</li><li>✔ Marcas Sofía y PIL</li><li>✔ Pedidos por WhatsApp</li>
          </ul>
        </div>
        <div className="h-2 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400" />
      </section>

      <Beneficios n={N} />
      <main id="catalogo" className="mx-auto max-w-6xl px-4 py-10">
        {lineas.length === 0 && (
          <p className="py-16 text-center text-stone-500">Pronto tendremos el catálogo aquí. Mientras tanto, escríbenos por WhatsApp.</p>
        )}

        {lineas.map((l) => (
          <section key={l.nombre} className="mb-14">
            <h2 className="mb-6 text-3xl font-extrabold text-[#7a1414]" style={serif}>{l.nombre}</h2>
            {l.cats.map((c) => (
              <div key={c.nombre} id={slug(c.nombre)} className="mb-10 scroll-mt-32">
                <h3 className="mb-4 flex items-center gap-3 text-lg font-bold">
                  <span className="h-6 w-1.5 rounded bg-amber-400" /> {c.nombre}
                </h3>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {c.items.map((p) => (
                    <article key={p.id} className="group flex flex-col overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                      <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-amber-100 to-red-100">
                        {p.imagen_url ? (
                          <img src={thumb(p.imagen_url, 500)} alt={p.nombre} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-5xl">{p.lslug === 'pollo' ? '🍗' : '🧀'}</div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col p-3">
                        <h4 className="font-semibold leading-snug">{p.nombre}</h4>
                        <div className="mt-2 space-y-0.5 text-sm">
                          {bs(p.precio_menor) && <p><span className="text-stone-500">Menor</span> <b className="text-[#7a1414]">{bs(p.precio_menor)}</b><span className="text-stone-400">/{p.unidad}</span></p>}
                          {bs(p.precio_mayor) && <p><span className="text-stone-500">Mayor</span> <b className="text-amber-700">{bs(p.precio_mayor)}</b><span className="text-stone-400">/{p.unidad}</span></p>}
                          {!bs(p.precio_menor) && !bs(p.precio_mayor) && <p className="text-stone-500">Consultar precio</p>}
                        </div>
                        <a href={wa(`Hola, quiero pedir: ${p.nombre}`)} className="mt-3 flex items-center justify-center gap-2 rounded-full bg-green-600 py-2 text-sm font-bold text-white hover:bg-green-700">
                          <WaIcon className="h-4 w-4" /> Pedir
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

      <Info n={N} wa={wa} />
      <footer className="bg-[#3b0909] py-10 text-center text-amber-100">
        <p className="text-2xl font-extrabold" style={serif}>{N.nombre}</p>
        <p className="mt-1 text-sm text-amber-200/80">Quesería y Fiambrería · Frial Jurado</p>
        <a href={wa('Hola, quiero hacer un pedido')} className="mt-4 inline-flex items-center gap-2 rounded-full bg-green-500 px-6 py-2 font-bold text-white">
          <WaIcon className="h-4 w-4" /> {N.whatsapp.replace(/^591/, "")}
        </a>
      </footer>

      <a href={wa('Hola, quiero hacer un pedido')} aria-label="WhatsApp" className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-xl">
        <WaIcon className="h-7 w-7" />
      </a>
    </>
  );
}
