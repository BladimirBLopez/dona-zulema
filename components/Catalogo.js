'use client';
import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Plus, Minus, X, ShoppingBag, MessageCircle, Milk, Drumstick, Trash2, PackageOpen } from 'lucide-react';

const bs = (v) => (v == null || v === '' ? null : 'Bs ' + Number(v).toFixed(2));
const stepOf = (u) => (String(u).toLowerCase() === 'kg' ? 0.5 : 1);
const Icono = ({ lslug, className }) => (lslug === 'pollo' ? <Drumstick className={className} /> : <Milk className={className} />);

function Card({ p, qty, onAdd }) {
  const st = stepOf(p.unidad);
  const menor = bs(p.precio_menor);
  const mayor = bs(p.precio_mayor);
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35 }}
      className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-vino-900/5 transition hover:-translate-y-1 hover:shadow-lift"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-oro-200/60 to-vino-100">
        {p.img ? (
          <img src={p.img} alt={p.nombre} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="grid h-full place-items-center text-vino-300"><Icono lslug={p.lslug} className="h-14 w-14" /></div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-vino-800 backdrop-blur">{p.categoria}</span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h4 className="font-semibold leading-snug text-stone-900">{p.nombre}</h4>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {menor && <span className="rounded-lg bg-vino-50 px-2 py-1 text-vino-800">Menor <b>{menor}</b>/{p.unidad}</span>}
          {mayor && <span className="rounded-lg bg-oro-200/50 px-2 py-1 text-amber-900">Mayor <b>{mayor}</b>/{p.unidad}</span>}
          {!menor && !mayor && <span className="rounded-lg bg-stone-100 px-2 py-1 text-stone-500">Consultar precio</span>}
        </div>
        <div className="mt-auto pt-4">
          {qty ? (
            <div className="flex items-center justify-between rounded-full bg-vino-800 p-1 text-white">
              <button onClick={() => onAdd(p, -st)} aria-label="Quitar" className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/15"><Minus size={16} /></button>
              <span className="text-sm font-bold">{qty} {p.unidad}</span>
              <button onClick={() => onAdd(p, st)} aria-label="Agregar" className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/15"><Plus size={16} /></button>
            </div>
          ) : (
            <button onClick={() => onAdd(p, st)} className="flex w-full items-center justify-center gap-2 rounded-full bg-vino-800 py-2.5 text-sm font-bold text-white transition hover:bg-vino-700 active:scale-95">
              <Plus size={16} /> Agregar al pedido
            </button>
          )}
        </div>
      </div>
    </motion.article>
  );
}

export default function Catalogo({ productos, wa }) {
  const [q, setQ] = useState('');
  const [linea, setLinea] = useState('all');
  const [cat, setCat] = useState('all');
  const [cart, setCart] = useState({});
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState('menor');
  const [nota, setNota] = useState('');
  const ultimo = useRef({ k: '', t: 0 });

  const lineas = useMemo(() => {
    const m = new Map();
    productos.forEach((p) => m.set(p.lslug, p.linea));
    return [...m];
  }, [productos]);

  const cats = useMemo(() => {
    const s = new Set();
    productos.filter((p) => linea === 'all' || p.lslug === linea).forEach((p) => s.add(p.categoria));
    return [...s];
  }, [productos, linea]);

  const grupos = useMemo(() => {
    const t = q.trim().toLowerCase();
    const out = [];
    for (const p of productos) {
      if (linea !== 'all' && p.lslug !== linea) continue;
      if (cat !== 'all' && p.categoria !== cat) continue;
      if (t && !(p.nombre + ' ' + p.categoria).toLowerCase().includes(t)) continue;
      let l = out.find((x) => x.linea === p.linea);
      if (!l) out.push((l = { linea: p.linea, cats: [] }));
      let c = l.cats.find((x) => x.nombre === p.categoria);
      if (!c) l.cats.push((c = { nombre: p.categoria, items: [] }));
      c.items.push(p);
    }
    return out;
  }, [productos, q, linea, cat]);

  const pickLinea = (v) => { setLinea(v); setCat('all'); };

  const add = (p, d) =>
    setCart((c) => {
      const n = { ...c };
      const qty = (c[p.id]?.qty || 0) + d;
      if (qty <= 0) delete n[p.id];
      else n[p.id] = { p, qty };
      return n;
    });

  const items = Object.values(cart);
  const count = items.length;
  const msg = [
    'Hola, quiero hacer este pedido (' + (tipo === 'mayor' ? 'al por mayor' : 'al por menor') + '):',
    ...items.map(({ p, qty }) => `• ${qty} ${p.unidad} de ${p.nombre}`),
    nota.trim() ? 'Nota: ' + nota.trim() : '',
  ].filter(Boolean).join('\n');
  const link = `https://wa.me/${wa}?text=${encodeURIComponent(msg)}`;

  function guardarPedido() {
    try {
      const lista = items.map(({ p, qty }) => ({ id: p.id, qty }));
      const k = JSON.stringify(lista);
      const ahora = Date.now();
      if (ultimo.current.k === k && ahora - ultimo.current.t < 120000) return;
      ultimo.current = { k, t: ahora };
      fetch('/api/pedido', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: lista }),
      }).catch(() => {});
    } catch {}
  }

  const tab = (act) => `whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${act ? 'bg-vino-800 text-white shadow' : 'bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-vino-50'}`;
  const chip = (act) => `whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold transition ${act ? 'bg-oro-400 text-vino-950' : 'bg-white text-stone-600 ring-1 ring-stone-200'}`;

  return (
    <section id="catalogo" className="scroll-mt-16 bg-crema pb-10 pt-6">
      <div className="sticky top-16 z-20 border-b border-vino-900/5 bg-crema/90 backdrop-blur">
        <div className="mx-auto max-w-6xl space-y-3 px-4 py-3">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar queso, jamón, pollo..."
              className="w-full rounded-full border-0 bg-white py-3 pl-11 pr-4 text-sm shadow-card outline-none ring-1 ring-stone-200 focus:ring-2 focus:ring-vino-500"
            />
          </div>
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            <button onClick={() => pickLinea('all')} className={tab(linea === 'all')}>Todo</button>
            {lineas.map(([s, n]) => (
              <button key={s} onClick={() => pickLinea(s)} className={tab(linea === s)}>{n}</button>
            ))}
          </div>
          {cats.length > 1 && (
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              <button onClick={() => setCat('all')} className={chip(cat === 'all')}>Todas</button>
              {cats.map((c) => (
                <button key={c} onClick={() => setCat(c)} className={chip(cat === c)}>{c}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-8">
        {productos.length === 0 && (
          <p className="py-16 text-center text-stone-500">Pronto tendremos el catálogo aquí. Mientras tanto, escríbenos por WhatsApp.</p>
        )}
        {productos.length > 0 && grupos.length === 0 && (
          <div className="py-16 text-center text-stone-500">
            <PackageOpen className="mx-auto mb-3 h-10 w-10 text-vino-300" />
            No encontramos productos con esa búsqueda.
          </div>
        )}
        {grupos.map((l) => (
          <div key={l.linea} className="mb-12">
            <h2 className="mb-5 font-serif text-3xl font-extrabold text-vino-800">{l.linea}</h2>
            {l.cats.map((c) => (
              <div key={l.linea + c.nombre} className="mb-9">
                <h3 className="mb-4 flex items-center gap-3 text-lg font-bold text-stone-800">
                  <span className="h-6 w-1.5 rounded bg-oro-400" /> {c.nombre}
                  <span className="text-sm font-normal text-stone-400">{c.items.length}</span>
                </h3>
                <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {c.items.map((p) => (
                    <Card key={p.id} p={p} qty={cart[p.id]?.qty} onAdd={add} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <AnimatePresence>
        {count > 0 && !open && (
          <motion.button
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-4 left-4 right-4 z-40 flex items-center justify-between rounded-full bg-vino-900 px-5 py-4 font-bold text-white shadow-lift md:left-auto md:right-6 md:w-96"
          >
            <span className="flex items-center gap-2"><ShoppingBag size={20} className="text-oro-300" /> Mi pedido ({count})</span>
            <span className="rounded-full bg-oro-400 px-4 py-1 text-sm text-vino-950">Ver</span>
          </motion.button>
        )}
      </AnimatePresence>

      {count === 0 && (
        <a href={`https://wa.me/${wa}?text=${encodeURIComponent('Hola, quiero hacer un pedido')}`} aria-label="WhatsApp"
          className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-green-500 text-white shadow-lift transition hover:scale-110">
          <MessageCircle size={26} />
        </a>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 md:items-center"
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 md:rounded-3xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-serif text-2xl font-extrabold text-vino-800">Mi pedido</h3>
                <button onClick={() => setOpen(false)} aria-label="Cerrar" className="grid h-9 w-9 place-items-center rounded-full bg-stone-100"><X size={18} /></button>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-1 rounded-full bg-stone-100 p-1 text-sm font-semibold">
                {[['menor', 'Al por menor'], ['mayor', 'Al por mayor']].map(([v, t]) => (
                  <button key={v} onClick={() => setTipo(v)} className={`rounded-full py-2 transition ${tipo === v ? 'bg-vino-800 text-white shadow' : 'text-stone-600'}`}>{t}</button>
                ))}
              </div>

              <ul className="space-y-2">
                {items.map(({ p, qty }) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 rounded-2xl bg-crema p-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{p.nombre}</p>
                      <p className="text-xs text-stone-500">{qty} {p.unidad}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button onClick={() => add(p, -stepOf(p.unidad))} aria-label="Quitar" className="grid h-8 w-8 place-items-center rounded-full bg-white shadow"><Minus size={14} /></button>
                      <button onClick={() => add(p, stepOf(p.unidad))} aria-label="Agregar" className="grid h-8 w-8 place-items-center rounded-full bg-white shadow"><Plus size={14} /></button>
                      <button onClick={() => add(p, -qty)} aria-label="Eliminar" className="grid h-8 w-8 place-items-center rounded-full text-red-600"><Trash2 size={16} /></button>
                    </div>
                  </li>
                ))}
              </ul>

              <textarea
                value={nota} onChange={(e) => setNota(e.target.value)} rows={2} maxLength={200}
                placeholder="Nota (opcional): hora de entrega, zona, etc."
                className="mt-4 w-full rounded-2xl border border-stone-200 p-3 text-sm outline-none focus:border-vino-500"
              />
              <p className="mt-2 text-xs text-stone-500">El precio final se confirma por WhatsApp.</p>

              <a href={link} onClick={guardarPedido} target="_blank" rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center gap-2 rounded-full bg-green-500 py-3.5 font-bold text-white shadow-lg transition hover:bg-green-600">
                <MessageCircle size={20} /> Enviar pedido por WhatsApp
              </a>
              <button onClick={() => { setCart({}); setOpen(false); }} className="mt-3 w-full text-sm text-stone-500">Vaciar pedido</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
