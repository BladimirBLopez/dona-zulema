import { Scale, Snowflake, MessageCircle } from 'lucide-react';
import { sql } from '@/lib/db';
import { thumb } from '@/lib/cloudinary';
import { getNegocio, makeWa } from '@/lib/negocio';
import Reveal from '@/components/Reveal';
import Catalogo from '@/components/Catalogo';
import { Beneficios, Info } from './secciones';

export const revalidate = 60;

async function getProductos() {
  const rows = await sql()`
    SELECT p.id, p.nombre, p.precio_menor, p.precio_mayor, p.unidad, p.imagen_url,
           c.nombre AS categoria, l.nombre AS linea, l.slug AS lslug
    FROM productos p
    JOIN categorias c ON c.id = p.categoria_id
    JOIN lineas l ON l.id = c.linea_id
    WHERE p.disponible
    ORDER BY l.orden, c.orden, p.orden, p.nombre`;
  return rows.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    precio_menor: r.precio_menor,
    precio_mayor: r.precio_mayor,
    unidad: r.unidad || 'kg',
    categoria: r.categoria,
    linea: r.linea,
    lslug: r.lslug,
    img: r.imagen_url ? thumb(r.imagen_url, 600) : null,
  }));
}

export default async function Home() {
  const N = await getNegocio();
  const wa = makeWa(N.whatsapp);
  let productos = [];
  try { productos = await getProductos(); } catch (e) { console.error('catalogo', e?.message); }
  const pedido = wa('Hola, quiero hacer un pedido');
  const tel = N.whatsapp.replace(/^591/, '');

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-white/10 bg-vino-950/95 text-white backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <a href="#" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-oro-400 font-serif text-lg font-extrabold text-vino-950">{N.nombre.charAt(0)}</span>
            <span className="font-serif text-xl font-extrabold tracking-tight">{N.nombre}</span>
          </a>
          <a href={pedido} className="flex items-center gap-2 rounded-full bg-green-500 px-4 py-2 text-sm font-bold shadow transition hover:bg-green-600">
            <MessageCircle size={16} /> Escríbenos
          </a>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-br from-vino-950 via-vino-900 to-vino-700 text-white">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-oro-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-vino-500/30 blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-4 pb-28 pt-16 text-center md:pt-28">
          <Reveal>
            {N.slogan && (
              <span className="inline-block rounded-full border border-oro-300/40 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-oro-300">{N.slogan}</span>
            )}
            <h1 className="mt-6 font-serif text-4xl font-extrabold leading-[1.1] md:text-6xl">{N.titulo}</h1>
            {N.subtitulo && <p className="mx-auto mt-5 max-w-xl text-lg text-vino-100">{N.subtitulo}</p>}
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a href="#catalogo" className="rounded-full bg-oro-400 px-8 py-3.5 font-bold text-vino-950 shadow-lift transition hover:bg-oro-300">Ver catálogo</a>
              <a href={pedido} className="flex items-center gap-2 rounded-full border border-white/30 px-8 py-3.5 font-semibold transition hover:bg-white/10">
                <MessageCircle size={18} /> Pedir por WhatsApp
              </a>
            </div>
            <ul className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-oro-200">
              <li className="flex items-center gap-2"><Scale size={16} /> Mayor y menor</li>
              <li className="flex items-center gap-2"><Snowflake size={16} /> Cadena de frío</li>
              <li className="flex items-center gap-2"><MessageCircle size={16} /> Pedidos por WhatsApp</li>
            </ul>
          </Reveal>
        </div>
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="absolute bottom-0 block w-full fill-crema" style={{ height: 48 }} aria-hidden="true">
          <path d="M0,48 C240,96 480,0 720,32 C960,64 1200,80 1440,24 L1440,80 L0,80 Z" />
        </svg>
      </section>

      <Catalogo productos={productos} wa={N.whatsapp} />
      <Beneficios n={N} />
      <Info n={N} wa={wa} />

      <footer className="bg-vino-950 pb-24 pt-12 text-center text-vino-100">
        <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-oro-400 font-serif text-xl font-extrabold text-vino-950">{N.nombre.charAt(0)}</span>
        <p className="font-serif text-2xl font-extrabold text-white">{N.nombre}</p>
        {N.slogan && <p className="mt-1 text-sm text-vino-200">{N.slogan}</p>}
        <a href={pedido} className="mt-5 inline-flex items-center gap-2 rounded-full bg-green-500 px-6 py-2.5 font-bold text-white">
          <MessageCircle size={18} /> {tel}
        </a>
        <p className="mt-8 text-xs text-vino-300">© {new Date().getFullYear()} {N.nombre}. Todos los derechos reservados.</p>
      </footer>
    </>
  );
}
