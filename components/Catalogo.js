'use client';
import { pasoDe, cantidadValida } from '@/lib/unidades';
import { obtenerPrecioPedido, redondearDinero } from '@/lib/precio-pedido';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Plus, Minus, X, ShoppingBag, Milk, Drumstick, Trash2, PackageOpen, SlidersHorizontal, ArrowDownUp, Check } from 'lucide-react';
import Link from 'next/link';
import WhatsApp from '@/components/WhatsApp';

const bs = (v) => (v == null || v === '' ? null : 'Bs ' + Number(v).toFixed(2).replace('.', ','));
const normalizar = (v) => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const stepOf = pasoDe;
const CLAVE_CARRITO = 'frial-jurado-carrito-v1';
const Icono = ({ lslug, className }) => (lslug === 'pollo' ? <Drumstick className={className} /> : <Milk className={className} />);

const unidadDe = (u) => { const x = String(u || 'unidad').trim().toLowerCase(); return x === 'kg' ? 'kilo' : x.startsWith('unidad') ? 'unidad' : x; };
const cantidadDe = (n, u) => {
  const v = String(Math.round(Number(n) * 1000) / 1000);
  const x = unidadDe(u);
  if (x === 'kilo') return v + ' kg';
  if (x === 'unidad') return v + (Number(n) === 1 ? ' unidad' : ' unidades');
  return v + ' ' + x + (Number(n) === 1 || /s$/.test(x) ? '' : 's');
};
const porUnidad = (u) => { const x = unidadDe(u); return x === 'unidad' ? 'c/u' : 'por ' + x; };

function Card({ p, qty, onAdd, sinCat = false }) {
  const paso = stepOf(p.unidad);
  const menor = bs(p.precio_menor);
  const mayor = bs(p.precio_mayor);
  const desde = Number(p.mayor_desde) > 0
    ? cantidadDe(p.mayor_desde, p.unidad) : null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.25 }}
      className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-card"
    >
      <Link
        href={`/producto/${p.id}`}
        aria-label={`Ver detalle de ${p.nombre}`}
        className="relative block aspect-square w-full overflow-hidden border-b border-stone-100 bg-white"
      >
        {p.img ? (
          <img
            src={p.imgSmall || p.img}
            srcSet={p.imgSmall ? `${p.imgSmall} 360w, ${p.img} 600w` : undefined}
            sizes="(min-width:1280px) 260px, (min-width:1024px) 33vw, 50vw"
            alt={p.nombre}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 block h-full w-full object-cover object-center"
          />
        ) : (
          <span className="absolute inset-0 grid place-items-center text-vino-300">
            <Icono lslug={p.lslug} className="h-12 w-12" />
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col px-3 pb-3 pt-3 sm:px-4 sm:pb-4">
        {!sinCat && (
          <p className="mb-1 truncate text-[10px] font-semibold uppercase tracking-wide text-vino-600">
            {p.categoria}
          </p>
        )}

        <Link
          href={`/producto/${p.id}`}
          className="line-clamp-2 min-h-[2.5rem] text-[13px] font-bold leading-snug text-stone-900 hover:text-vino-800 sm:text-[15px]"
        >
          {p.nombre}
        </Link>

        <div className="mt-2.5">
          {menor ? (
            <>
              <span className="block text-[10px] font-medium text-stone-500">
                Precio por menor
              </span>
              <p className="mt-0.5 flex flex-wrap items-baseline gap-x-1">
                <strong className="text-[19px] font-extrabold leading-tight tracking-tight text-vino-800 sm:text-[22px]">
                  {menor}
                </strong>
                <span className="text-[10px] text-stone-500">
                  {porUnidad(p.unidad)}
                </span>
              </p>
            </>
          ) : (
            <p className="text-sm font-semibold text-stone-600">
              Consultar precio
            </p>
          )}

          {mayor && (
            <div className="mt-2 rounded-lg bg-oro-200/50 p-2 text-[11px] leading-snug text-vino-950">
              <p className="font-bold">
                Mayorista: {mayor}{' '}
                <span className="font-normal">{porUnidad(p.unidad)}</span>
              </p>
              <p className="mt-0.5 text-[10px]">
                {desde ? `Desde ${desde}` : 'Al seleccionar compra por mayor'}
              </p>
            </div>
          )}
        </div>

        <div className="relative z-10 mt-auto pt-3">
          {qty ? (
            <div className="flex min-h-11 items-center justify-between rounded-xl bg-vino-800 text-white">
              <button
                type="button"
                onClick={() => onAdd(p, -paso)}
                aria-label={`Quitar ${p.nombre}`}
                className="grid h-11 w-9 shrink-0 place-items-center rounded-l-xl hover:bg-white/15 sm:w-11"
              >
                <Minus size={17} />
              </button>
              <span className="min-w-0 flex-1 text-center text-xs font-bold leading-tight">
                {qty}
                <span className="block text-[9px] font-normal opacity-80">
                  {p.unidad}
                </span>
              </span>
              <button
                type="button"
                onClick={() => onAdd(p, paso)}
                aria-label={`Agregar otro ${p.nombre}`}
                className="grid h-11 w-9 shrink-0 place-items-center rounded-r-xl hover:bg-white/15 sm:w-11"
              >
                <Plus size={17} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onAdd(p, paso)}
              aria-label={`Agregar ${p.nombre} al carrito`}
              className="flex min-h-11 w-full items-center justify-center gap-1 rounded-xl bg-vino-800 px-1.5 py-2 text-center text-[11px] font-bold leading-tight text-white transition hover:bg-vino-700 active:scale-95 sm:gap-2 sm:text-sm"
            >
              <ShoppingBag size={15} className="shrink-0" />
              <span>Agregar al carrito</span>
            </button>
          )}
        </div>
      </div>
    </motion.article>
  );
}

export default function Catalogo({ productos, wa, negocio }) {
  const [q, setQ] = useState('');
  const [linea, setLinea] = useState('all');
  const [cat, setCat] = useState('all');
  const [precioMax, setPrecioMax] = useState('todos');
  const [orden, setOrden] = useState('catalogo');
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [cart, setCart] = useState({});
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState('menor');
  const [nota, setNota] = useState('');
  const [enviandoPedido, setEnviandoPedido] = useState(false);
  const [errorPedido, setErrorPedido] = useState('');
  const enviandoRef = useRef(false);
  const ultimo = useRef({ k: '', t: 0 });
  const recuperacionIniciada = useRef(false);
  const [carritoListo, setCarritoListo] = useState(false);

  // Recuperar solo cantidades, nunca precios antiguos.
  useEffect(() => {
    if (productos.length === 0) return;
    if (recuperacionIniciada.current) return;
    recuperacionIniciada.current = true;

    try {
      const datos = JSON.parse(
        window.localStorage.getItem(CLAVE_CARRITO) || '{}'
      );

      if (datos && typeof datos === 'object' && !Array.isArray(datos)) {
        const recuperados = {};

        for (const p of productos) {
          const cantidad = Number(datos[String(p.id)]);

          if (
            cantidadValida(cantidad, p.unidad) &&
            cantidad <= 10000
          ) {
            recuperados[p.id] = { p, qty: cantidad };
          }
        }

        if (Object.keys(recuperados).length > 0) {
          setCart(recuperados);
        }
      }
    } catch (error) {
      console.warn('No se pudo recuperar el carrito');
    }

    setCarritoListo(true);
  }, [productos]);

  // Guardar únicamente identificadores y cantidades.
  useEffect(() => {
    if (!carritoListo || productos.length === 0) return;

    try {
      const cantidades = {};

      for (const { p, qty } of Object.values(cart)) {
        cantidades[String(p.id)] = qty;
      }

      window.localStorage.setItem(
        CLAVE_CARRITO,
        JSON.stringify(cantidades)
      );
    } catch (error) {
      console.warn('No se pudo guardar el carrito');
    }
  }, [cart, carritoListo, productos.length]);

  // Recibe un producto desde su ficha individual.
  useEffect(() => {
    if (productos.length === 0) return;
    const url = new URL(window.location.href);
    const id = url.searchParams.get('agregar');
    if (!id) return;

    // Evita agregarlo dos veces en una misma navegación.
    url.searchParams.delete('agregar');
    window.history.replaceState(
      window.history.state,
      '',
      url.pathname + url.search + url.hash
    );

    const producto = productos.find(
      (p) => String(p.id) === id
    );
    if (!producto) return;

    setCart((actual) => {
      const anterior = Number(
        actual[producto.id]?.qty || 0
      );
      const cantidad = Math.round(
        (anterior + stepOf(producto.unidad)) * 1000
      ) / 1000;

      if (
        cantidad > 10000 ||
        !cantidadValida(cantidad, producto.unidad)
      ) return actual;

      return {
        ...actual,
        [producto.id]: { p: producto, qty: cantidad }
      };
    });
    setOpen(true);
  }, [productos]);
  useEffect(() => {
    if (!filtrosAbiertos) return;
    const cerrar = (e) => {
      if (e.key === 'Escape') setFiltrosAbiertos(false);
    };
    document.addEventListener('keydown', cerrar);
    return () => document.removeEventListener('keydown', cerrar);
  }, [filtrosAbiertos]);

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

  const maximoPrecio = useMemo(() => productos.reduce((max, p) => {
    const v = p.precio_menor == null || p.precio_menor === '' ? NaN : Number(p.precio_menor);
    return Number.isFinite(v) && v > max ? v : max;
  }, 0), [productos]);

  const limitePrecio = Math.max(1, Math.ceil(maximoPrecio / 10) * 10);

  const filtrados = useMemo(() => {
    const texto = normalizar(q.trim());

    const lista = productos.filter((p) => {
      if (linea !== 'all' && p.lslug !== linea) return false;
      if (cat !== 'all' && p.categoria !== cat) return false;
      if (texto && !normalizar(`${p.nombre} ${p.categoria} ${p.linea}`).includes(texto)) return false;

      if (precioMax !== 'todos') {
        const v = p.precio_menor == null || p.precio_menor === '' ? NaN : Number(p.precio_menor);
        if (!Number.isFinite(v) || v > Number(precioMax)) return false;
      }

      return true;
    });

    if (orden === 'nombre') {
      lista.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    }

    if (orden === 'precio-asc' || orden === 'precio-desc') {
      const precio = (p) => p.precio_menor == null || p.precio_menor === '' ? NaN : Number(p.precio_menor);

      lista.sort((a, b) => {
        const va = precio(a);
        const vb = precio(b);

        if (!Number.isFinite(va)) return Number.isFinite(vb) ? 1 : 0;
        if (!Number.isFinite(vb)) return -1;

        return orden === 'precio-asc' ? va - vb : vb - va;
      });
    }

    return lista;
  }, [productos, q, linea, cat, precioMax, orden]);

  const grupos = useMemo(() => {
    const out = [];

    for (const p of filtrados) {
      let l = out.find((x) => x.linea === p.linea);
      if (!l) out.push((l = { linea: p.linea, cats: [] }));

      let c = l.cats.find((x) => x.nombre === p.categoria);
      if (!c) l.cats.push((c = { nombre: p.categoria, items: [] }));

      c.items.push(p);
    }

    return out;
  }, [filtrados]);

  const cantidadFiltros =
    Number(linea !== 'all') +
    Number(cat !== 'all') +
    Number(precioMax !== 'todos');

  const rejilla = 'grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4';

  const limpiar = () => {
    setQ('');
    setLinea('all');
    setCat('all');
    setPrecioMax('todos');
    setOrden('catalogo');
  };

  const pickLinea = (v) => {
    setLinea(v);
    setCat('all');
  };

  const add = (p, d) =>
    setCart((c) => {
      const n = { ...c };
      const qty = Math.round(
        ((c[p.id]?.qty || 0) + d) * 1000
      ) / 1000;
      if (qty <= 0) delete n[p.id];
      else if (
        qty > 10000 ||
        !cantidadValida(qty, p.unidad)
      ) return c;
      else n[p.id] = { p, qty };
      return n;
    });

  const items = Object.values(cart);
  const count = items.length;

  useEffect(() => {
    if (open && count === 0) setOpen(false);
  }, [open, count]);

  useEffect(() => {
    if (!open) return;
    const cerrar = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', cerrar);
    return () => document.removeEventListener('keydown', cerrar);
  }, [open]);

  const detalle = items.map(({ p, qty }) => {
    const info = obtenerPrecioPedido(p, qty, tipo);
    const subtotal = info.precio === null
      ? null
      : redondearDinero(info.precio * qty);
    return { p, qty, ...info, subtotal };
  });

  const sinPrecio = detalle.some((i) => i.precio === null);
  const conPrecio = detalle.some((i) => i.precio !== null);
  const total = redondearDinero(
    detalle.reduce((s, i) => s + (i.subtotal ?? 0), 0)
  );
  const totalTexto = conPrecio ? bs(total) : 'Por confirmar';

  const msg = [
    `🛒 *PEDIDO – ${negocio}*`,
    '',
    'Hola, quisiera realizar el siguiente pedido:',
    '',
    ...detalle.flatMap(({ p, qty, precio, subtotal }, index) => [
      `${index + 1}. *${p.nombre}*`,
      precio === null
        ? `${cantidadDe(qty, p.unidad)} — Precio a consultar`
        : `${cantidadDe(qty, p.unidad)} × ${bs(precio)} = ${bs(subtotal)}`,
      '',
    ]),
    `💰 *TOTAL: ${totalTexto}${sinPrecio && conPrecio ? ' (parcial)' : ''}*`,
    ...(sinPrecio ? [
      '',
      'Hay productos con precio a consultar.',
    ] : []),
    ...(nota.trim() ? [
      '',
      `Nota: ${nota.trim()}`,
    ] : []),
    '',
    '¿Me confirman la disponibilidad? Gracias.',
  ].join('\n');
  const link = `https://wa.me/${wa}?text=${encodeURIComponent(msg)}`;

  async function guardarPedido() {
    if (enviandoRef.current || items.length === 0) return;

    const lista = items.map(({ p, qty }) => ({
      id: p.id,
      qty
    }));
    const clave = JSON.stringify({ lista, tipo });

    if (
      ultimo.current.k === clave &&
      Date.now() - ultimo.current.t < 120000
    ) {
      window.location.assign(link);
      return;
    }

    enviandoRef.current = true;
    setEnviandoPedido(true);
    setErrorPedido('');

    try {
      const res = await fetch('/api/pedido', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: lista, tipo })
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok || !data?.id) {
        const errores = {
          producto_inexistente:
            'Un producto ya no está disponible. Actualiza la tienda y revisa el pedido.',
          producto_repetido:
            'Hay productos duplicados. Revisa tu pedido.',
          cantidad_entera:
            'Revisa las cantidades: algunos productos solo se venden por unidades enteras.',
          items_invalidos:
            'Hay cantidades o productos inválidos.',
          sin_items:
            'Agrega al menos un producto.',
          demasiados:
            'Demasiados intentos. Intenta nuevamente en un minuto.'
        };

        setErrorPedido(
          errores[data?.error] ||
          'No se pudo registrar el pedido. Intenta nuevamente.'
        );
        return;
      }

      ultimo.current = {
        k: clave,
        t: Date.now()
      };

      window.location.assign(link);

    } catch {
      setErrorPedido(
        'No se pudo comprobar el registro. Revisa tu conexión antes de reintentar.'
      );
    } finally {
      enviandoRef.current = false;
      setEnviandoPedido(false);
    }
  }

  const tab = (act) => `whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${act ? 'bg-vino-800 text-white shadow' : 'bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-vino-50'}`;
  const catChip = (act) => (lineas.length > 1 ? chip(act) : tab(act));
  const chip = (act) => `whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold transition ${act ? 'bg-oro-400 text-vino-950' : 'bg-white text-stone-600 ring-1 ring-stone-200'}`;

  return (
    <section id="catalogo" className="scroll-mt-16 bg-crema pb-28 pt-6">
      <div className="mx-auto max-w-6xl space-y-3 px-4 py-3">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar queso, jamón, pollo..."
              className="w-full rounded-2xl border-0 bg-white py-3.5 pl-11 pr-4 text-sm shadow-card outline-none ring-1 ring-stone-200 focus:ring-2 focus:ring-vino-500"
            />
          </div>
          {lineas.length > 1 && (
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            <button onClick={() => pickLinea('all')} className={tab(linea === 'all')}>Todo</button>
            {lineas.map(([s, n]) => (
              <button key={s} onClick={() => pickLinea(s)} className={tab(linea === s)}>{n}</button>
            ))}
          </div>
          )}
          {cats.length > 1 && (
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              <button onClick={() => setCat('all')} className={catChip(cat === 'all')}>Todas</button>
              {cats.map((c) => (
                <button key={c} onClick={() => setCat(c)} className={catChip(cat === c)}>{c}</button>
              ))}
            </div>
          )}
      </div>

      <div className="sticky top-16 z-20 border-b border-vino-900/5 bg-crema/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setFiltrosAbiertos(true)} className="flex min-h-11 items-center gap-2 rounded-xl border border-vino-900/10 bg-white px-4 py-2 text-sm font-semibold text-vino-900 shadow-sm hover:bg-vino-50">
              <SlidersHorizontal size={17} />
              Filtros
              {cantidadFiltros > 0 && (
                <span className="rounded-full bg-vino-800 px-2 py-0.5 text-xs text-white">{cantidadFiltros}</span>
              )}
            </button>

            <label className="relative flex items-center">
              <ArrowDownUp size={16} className="pointer-events-none absolute left-3 text-vino-800" />
              <select
                aria-label="Ordenar productos"
                value={orden}
                onChange={(e) => setOrden(e.target.value)}
                className="min-h-11 max-w-[205px] rounded-xl border border-vino-900/10 bg-white py-2 pl-9 pr-2 text-sm font-semibold text-stone-800 shadow-sm"
              >
                <option value="catalogo">Orden del catálogo</option>
                <option value="nombre">Nombre A–Z</option>
                <option value="precio-asc">Precio: menor a mayor</option>
                <option value="precio-desc">Precio: mayor a menor</option>
              </select>
            </label>
          </div>

        </div>

        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-3">
        <div className="mb-4 flex items-center justify-between gap-3">
          <span aria-live="polite" className="text-sm text-stone-500">
            {filtrados.length} {filtrados.length === 1 ? 'producto' : 'productos'}
          </span>
        </div>
        {(q.trim() || cantidadFiltros > 0) && (
          <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
            <span className="text-stone-600">Filtros activos</span>
            <button type="button" onClick={limpiar} className="font-semibold text-vino-800 underline underline-offset-2">
              Limpiar todo
            </button>
          </div>
        )}

        {productos.length === 0 && (
          <p className="py-16 text-center text-stone-500">Pronto tendremos el catálogo aquí. Mientras tanto, escríbenos por WhatsApp.</p>
        )}
        {productos.length > 0 && filtrados.length === 0 && (
          <div className="py-16 text-center text-stone-500">
            <PackageOpen className="mx-auto mb-3 h-10 w-10 text-vino-300" />
            No encontramos productos con esa búsqueda.
          </div>
        )}
        {orden === 'catalogo' ? grupos.map((l) => (
          <div key={l.linea} className="mb-12">
            {grupos.length > 1 && <h2 className="mb-5 font-serif text-3xl font-extrabold text-vino-800">{l.linea}</h2>}
            {l.cats.map((c) => (
              <div key={l.linea + c.nombre} className="mb-9">
                <h3 className="mb-4 flex items-center gap-3 text-lg font-bold text-stone-800">
                  <span className="h-6 w-1.5 rounded bg-oro-400" /> {c.nombre}
                  <span className="text-sm font-normal text-stone-400">{c.items.length}</span>
                </h3>
                <div className={rejilla}>
                  {c.items.map((p) => (
                    <Card key={p.id} p={p} qty={cart[p.id]?.qty} onAdd={add} sinCat />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )) : (
          <div className={rejilla}>
            {filtrados.map((p) => (
              <Card key={p.id} p={p} qty={cart[p.id]?.qty} onAdd={add} />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {filtrosAbiertos && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFiltrosAbiertos(false)}
            className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:items-center"
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Filtros del catálogo"
              initial={{ y: 70 }}
              animate={{ y: 0 }}
              exit={{ y: 70 }}
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-[88dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
            >
              <div className="flex items-center justify-between border-b border-stone-100 p-5">
                <div>
                  <h3 className="font-serif text-xl font-extrabold text-vino-900">Filtrar productos</h3>
                  <p className="text-xs text-stone-500">Encuentra exactamente lo que buscas</p>
                </div>
                <button type="button" onClick={() => setFiltrosAbiertos(false)} aria-label="Cerrar filtros" className="grid h-10 w-10 place-items-center rounded-full bg-stone-100">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-6 overflow-y-auto p-5">
                <div>
                  <h4 className="mb-3 font-semibold">Categorías</h4>
                  <div className="flex flex-wrap gap-2">
                    {['all', ...cats].map((c) => (
                      <button type="button" key={c} onClick={() => setCat(c)} aria-pressed={cat === c} className={chip(cat === c)}>
                        {cat === c && <Check size={12} className="mr-1 inline" />}
                        {c === 'all' ? 'Todas' : c}
                      </button>
                    ))}
                  </div>
                </div>

                {maximoPrecio > 0 && (
                  <div>
                    <div className="mb-2 flex justify-between gap-3">
                      <h4 className="font-semibold">Precio máximo</h4>
                      <span className="text-sm font-bold text-vino-800">
                        {precioMax === 'todos' ? 'Sin límite' : 'Bs ' + precioMax}
                      </span>
                    </div>

                    <input
                      type="range"
                      aria-label="Precio máximo al por menor"
                      min="0"
                      max={limitePrecio}
                      step="1"
                      value={precioMax === 'todos' ? limitePrecio : Number(precioMax)}
                      onChange={(e) => setPrecioMax(Number(e.target.value) >= limitePrecio ? 'todos' : e.target.value)}
                      className="w-full accent-vino-800"
                    />
                    <div className="flex justify-between text-xs text-stone-500">
                      <span>Bs 0</span>
                      <span>Bs {limitePrecio}</span>
                    </div>
                    <p className="mt-2 text-xs text-stone-500">Se aplica al precio por menor.</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 border-t border-stone-100 p-5">
                <button type="button" onClick={limpiar} className="rounded-xl border border-stone-200 px-4 py-3 text-sm font-semibold">
                  Limpiar
                </button>
                <button type="button" onClick={() => setFiltrosAbiertos(false)} className="flex-1 rounded-xl bg-vino-800 px-4 py-3 text-sm font-bold text-white">
                  Ver {filtrados.length} productos
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {count > 0 && !open && (
          <motion.button
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            onClick={() => setOpen(true)}
            aria-label={`Revisar pedido: ${count} producto${count === 1 ? '' : 's'}, ${totalTexto}`}
            className="fixed bottom-4 left-3 right-3 z-40 flex min-h-14 items-center justify-between gap-3 rounded-2xl bg-vino-900 px-4 py-3 font-bold text-white shadow-lift md:left-auto md:right-6 md:w-96"
          >
            <span className="flex min-w-0 items-center gap-2"><ShoppingBag size={20} className="shrink-0 text-oro-300" /> Mi pedido ({count})</span>
            <span className="shrink-0 rounded-xl bg-oro-400 px-3 py-2 text-sm text-vino-950">{totalTexto}</span>
          </motion.button>
        )}
      </AnimatePresence>


      <AnimatePresence>
        {open && count > 0 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 md:items-center md:p-4"
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Revisar mi pedido"
              className="max-h-[92dvh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-t-3xl bg-white p-4 shadow-2xl md:max-h-[88dvh] md:rounded-3xl md:p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-serif text-2xl font-extrabold text-vino-800">Mi pedido</h3>
                <button onClick={() => setOpen(false)} aria-label="Cerrar pedido" className="grid h-11 w-11 place-items-center rounded-full bg-stone-100"><X size={18} /></button>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-1 rounded-full bg-stone-100 p-1 text-sm font-semibold">
                {[['menor', 'Al por menor'], ['mayor', 'Al por mayor']].map(([v, t]) => (
                  <button key={v} onClick={() => setTipo(v)} aria-pressed={tipo === v} className={`min-h-11 rounded-full px-2 py-2 transition ${tipo === v ? 'bg-vino-800 text-white shadow' : 'text-stone-600'}`}>{t}</button>
                ))}
              </div>

              <ul className="space-y-2">
                {detalle.map(({ p, qty, precio, subtotal, mayorDesde, mayorAplicado }) => (
                  <li key={p.id} className="rounded-2xl bg-crema p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-stone-900">{p.nombre}</p>
                        <p className="mt-1 text-xs text-stone-600">
                          {cantidadDe(qty, p.unidad)} x {precio === null ? 'Consultar precio' : bs(precio)}
                        </p>
                        {tipo === 'mayor' && !mayorAplicado && mayorDesde > 0 && p.precio_mayor != null && qty < mayorDesde && (
                          <p className="mt-1 text-xs text-amber-800">
                            Precio mayor desde {cantidadDe(mayorDesde, p.unidad)}
                          </p>
                        )}
                      </div>
                      <strong className="shrink-0 text-vino-800">
                        {subtotal === null ? 'Consultar' : bs(subtotal)}
                      </strong>
                    </div>
                    <div className="mt-2 flex justify-end gap-2">
                      <button onClick={() => add(p, -stepOf(p.unidad))} aria-label="Quitar" className="grid h-11 w-11 place-items-center rounded-full bg-white shadow"><Minus size={14} /></button>
                      <button onClick={() => add(p, stepOf(p.unidad))} aria-label="Agregar" className="grid h-11 w-11 place-items-center rounded-full bg-white shadow"><Plus size={14} /></button>
                      <button onClick={() => add(p, -qty)} aria-label="Eliminar" className="grid h-11 w-11 place-items-center rounded-full text-red-600"><Trash2 size={16} /></button>
                    </div>
                  </li>
                ))}
              </ul>

              <textarea
                value={nota} onChange={(e) => setNota(e.target.value)} rows={2} maxLength={200}
                aria-label="Nota opcional del pedido"
                placeholder="Nota (opcional): hora de entrega, zona, etc."
                className="mt-4 w-full rounded-2xl border border-stone-200 p-3 text-sm outline-none focus:border-vino-500"
              />
              <div className="mt-3 flex items-center justify-between border-t border-stone-200 py-3">
                <span className="font-semibold text-stone-700">
                  Total {sinPrecio ? 'parcial' : 'estimado'}
                </span>
                <strong className="text-xl text-vino-800">
                  {totalTexto}
                </strong>
              </div>
              <p className="mt-1 text-xs text-stone-500">
                {sinPrecio
                  ? 'Los productos sin precio no se incluyen en el total parcial.'
                  : 'El precio final se confirma por WhatsApp.'}
              </p>

              <button type="button" onClick={guardarPedido} disabled={enviandoPedido}
                className="mt-4 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 font-bold text-white shadow-lg transition hover:bg-green-700">
                <WhatsApp size={22} /> {enviandoPedido
                  ? 'Registrando pedido...'
                  : 'Registrar pedido y abrir WhatsApp'}
              </button>
              {errorPedido && (
                <div role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  <p>{errorPedido}</p>
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block font-bold underline"
                  >
                    Continuar solo por WhatsApp (sin registro confirmado)
                  </a>
                </div>
              )}
              <button onClick={() => { setCart({}); setOpen(false); }} className="mt-2 min-h-11 w-full rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-50">Vaciar pedido</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
