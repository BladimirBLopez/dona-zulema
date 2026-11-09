'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Search, Plus, Minus, X, Trash2, Check, MessageCircle, ArrowLeft, ChevronDown } from 'lucide-react';
import { api, errMsg } from '@/lib/cliente';
import { bs, qty, hoyBO, reciboTexto, waLink } from '@/lib/fmt';

const METODOS = [['efectivo', 'Efectivo'], ['qr', 'QR'], ['transferencia', 'Transf.'], ['fiado', 'Fiado']];
const BILLETES = [10, 20, 50, 100, 200];
const n = (v) => Number(v) || 0;
const r2 = (x) => Math.round((x + Number.EPSILON) * 100) / 100;
const r3 = (x) => Math.round(x * 1000) / 1000;
const esKg = (u) => ['kg', 'kilo', 'kilos'].includes(String(u || '').toLowerCase());
const paso = (u) => (esKg(u) ? 0.5 : 1);
const rapidas = (u) => (esKg(u) ? [0.25, 0.5, 1, 2] : [1, 2, 3, 5]);
const marca = (v, u) => (esKg(u) && v === 0.25 ? '¼' : esKg(u) && v === 0.5 ? '½' : String(v));
const titulo = (s) => String(s || '').split(' ').filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
const crearClave = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
const formVacio = () => ({ metodo: 'efectivo', descuento: '', nombre: '', tel: '', pagado: '', entrega: 'efectivo', nota: '', fecha: hoyBO(), recibe: '' });

function precioDe(p, cant, tipo) {
  const menor = p.precio_menor != null ? Number(p.precio_menor) : null;
  const mayor = p.precio_mayor != null ? Number(p.precio_mayor) : null;
  const desde = p.mayor_desde != null && Number(p.mayor_desde) > 0 ? Number(p.mayor_desde) : null;
  const esp = mayor != null && (tipo === 'mayor' || (desde != null && cant >= desde));
  const v = esp ? mayor : (menor ?? mayor);
  return { precio: v == null ? 0 : v, esp };
}

function aplicar(l, tipo) {
  if (l.manual || !l.p) return l;
  const { precio } = precioDe(l.p, l.modo === 'monto' ? 0 : n(l.cantidad), tipo);
  return { ...l, precio: String(precio) };
}

function medir(l) {
  const p = r2(n(l.precio));
  if (l.modo === 'monto') {
    const m = r2(n(l.monto));
    return { cant: p > 0 ? r3(m / p) : 0, sub: m };
  }
  const c = n(l.cantidad);
  return { cant: c, sub: r2(c * p) };
}

const chip = (a) => `rounded-full px-4 py-1.5 text-sm font-semibold transition ${a ? 'bg-vino-800 text-white' : 'bg-white text-stone-600 ring-1 ring-stone-200'}`;
const mini = (a) => `rounded-full px-3 py-1 text-xs font-bold transition ${a ? 'bg-vino-800 text-white' : 'bg-white text-stone-700 ring-1 ring-stone-300'}`;

export default function NuevaVenta() {
  const [productos, setProductos] = useState(null);
  const [negocio, setNegocio] = useState('');
  const [clientes, setClientes] = useState([]);
  const [q, setQ] = useState('');
  const [tipo, setTipo] = useState('menor');
  const [lineas, setLineas] = useState([]);
  const [abierto, setAbierto] = useState(false);
  const [mas, setMas] = useState(false);
  const [f, setF] = useState(formVacio());
  const [libre, setLibre] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [hecho, setHecho] = useState(null);
  const [pedidoId, setPedidoId] = useState(null);
  const intento = useRef({ sig: '', clave: '' });

  useEffect(() => {
    (async () => {
      const [pr, ng, vs] = await Promise.all([api('/api/admin/productos'), api('/api/admin/negocio'), api('/api/admin/ventas')]);
      const lista = pr.data?.productos || [];
      setProductos(lista);
      setNegocio(ng.data?.nombre || '');
      const mapa = new Map();
      for (const v of Array.isArray(vs.data) ? vs.data : []) {
        const nom = String(v.cliente_nombre || '').trim();
        if (!nom) continue;
        const k = nom.toLowerCase();
        const ya = mapa.get(k);
        if (!ya) mapa.set(k, { nombre: nom, tel: v.cliente_tel || '' });
        else if (!ya.tel && v.cliente_tel) ya.tel = v.cliente_tel;
      }
      setClientes([...mapa.values()].slice(0, 100));
      const pid = new URLSearchParams(location.search).get('pedido');
      if (pid) {
        const pe = await api('/api/admin/pedidos?estado=pendiente');
        const ped = (Array.isArray(pe.data) ? pe.data : []).find((x) => String(x.id) === pid);
        if (ped) {
          setPedidoId(ped.id);
          setF((x) => ({ ...x, nombre: ped.cliente_nombre || '' }));
          setLineas(ped.items.map((it) => {
            const prod = lista.find((x) => String(x.id) === String(it.producto_id));
            return aplicar({
              producto_id: String(it.producto_id || ''), nombre: it.nombre, unidad: it.unidad || 'kg', p: prod || null,
              cantidad: String(it.cantidad), precio: String(it.precio ?? 0), manual: !prod, modo: 'peso', monto: '',
            }, 'menor');
          }));
        }
      }
    })();
  }, []);

  async function recargar() {
    const r = await api('/api/admin/productos');
    if (r.ok) setProductos(r.data?.productos || []);
  }

  const lista = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (productos || []).filter((p) => !t || (p.nombre + ' ' + (p.categoria || '')).toLowerCase().includes(t)).slice(0, 60);
  }, [productos, q]);

  const enCarrito = (id) => lineas.find((l) => l.producto_id === String(id));

  function sumar(p, d) {
    setLineas((ls) => {
      const i = ls.findIndex((l) => l.producto_id === String(p.id));
      if (i < 0) {
        if (d <= 0) return ls;
        return [...ls, aplicar({ producto_id: String(p.id), nombre: p.nombre, unidad: p.unidad || 'kg', p, cantidad: String(paso(p.unidad)), precio: '0', manual: false, modo: 'peso', monto: '' }, tipo)];
      }
      const l = ls[i];
      const base = l.modo === 'monto' ? medir(l).cant : n(l.cantidad);
      const nueva = r3(base + d);
      if (nueva <= 0) return ls.filter((_, x) => x !== i);
      return ls.map((z, x) => (x === i ? aplicar({ ...l, modo: 'peso', cantidad: String(nueva) }, tipo) : z));
    });
  }

  const setL = (i, cambios) => setLineas((ls) => ls.map((l, x) => (x === i ? aplicar({ ...l, ...cambios }, tipo) : l)));
  const setPrecio = (i, v) => setLineas((ls) => ls.map((l, x) => (x === i ? { ...l, precio: v, manual: true } : l)));
  const cambiarModo = (i, m) => setLineas((ls) => ls.map((l, x) => {
    if (x !== i || l.modo === m) return l;
    const { cant, sub } = medir(l);
    return aplicar(m === 'monto' ? { ...l, modo: 'monto', monto: sub ? String(sub) : '' } : { ...l, modo: 'peso', cantidad: cant ? String(cant) : '' }, tipo);
  }));
  const cambiarTipo = (t) => { setTipo(t); setLineas((ls) => ls.map((l) => aplicar(l, t))); };

  const elegirNombre = (v) => {
    const c = clientes.find((x) => x.nombre.toLowerCase() === v.trim().toLowerCase());
    setF((x) => ({ ...x, nombre: v, tel: x.tel || (c ? c.tel : '') }));
  };

  const medidas = lineas.map(medir);
  const bruto = r2(medidas.reduce((a, m) => a + m.sub, 0));
  const desc = Math.min(bruto, Math.max(0, n(f.descuento)));
  const total = r2(bruto - desc);
  const pagadoIni = f.metodo === 'fiado' ? Math.min(total, Math.max(0, n(f.pagado))) : total;
  const recibe = n(f.recibe);
  const vuelto = f.metodo === 'efectivo' && recibe > total ? r2(recibe - total) : 0;
  const falta = f.metodo === 'efectivo' && f.recibe !== '' && recibe < total ? r2(total - recibe) : 0;
  const sugeridos = (() => {
    const s = BILLETES.filter((b) => b > total).slice(0, 4);
    return s.length ? s : total > 0 ? [Math.ceil((total + 0.01) / 100) * 100] : [];
  })();

  async function confirmar() {
    setErr('');
    if (!lineas.length) return setErr('Agrega al menos un producto.');
    for (let i = 0; i < lineas.length; i++) {
      const l = lineas[i];
      const m = medidas[i];
      if (!(n(l.precio) > 0)) return setErr('"' + l.nombre + '" no tiene precio. Escríbelo en su casilla.');
      if (!(m.cant > 0) || !(m.sub > 0)) return setErr('Revisa la cantidad o el monto de "' + l.nombre + '".');
    }
    if (f.metodo === 'fiado' && !f.nombre.trim()) return setErr('Para fiado escribe el nombre del cliente.');
    const nombre = titulo(f.nombre);
    const body = {
      items: lineas.map((l, i) => {
        const m = medidas[i];
        return {
          producto_id: l.producto_id || null, nombre: l.nombre, unidad: l.unidad, cantidad: m.cant, precio: r2(n(l.precio)),
          lista: l.p ? precioDe(l.p, m.cant, tipo).precio : r2(n(l.precio)), monto: l.modo === 'monto' ? m.sub : null,
        };
      }),
      metodo: f.metodo, metodo_pago: f.entrega, tipo, descuento: desc, pagado: f.pagado, cliente_nombre: nombre, cliente_tel: f.tel, nota: f.nota,
      fecha: f.fecha && f.fecha !== hoyBO() ? f.fecha : null, pedido_id: pedidoId,
    };
    const sig = JSON.stringify(body);
    if (intento.current.sig !== sig) intento.current = { sig, clave: crearClave() };
    body.clave = intento.current.clave;
    setBusy(true);
    const r = await api('/api/admin/ventas', 'POST', body);
    setBusy(false);
    if (!r.ok) return setErr(errMsg(r.data));
    setHecho({
      id: r.data.id, total: r.data.total, pagado: pagadoIni, descuento: desc, metodo: f.metodo,
      cliente_nombre: nombre, cliente_tel: f.tel, fecha: new Date().toISOString(),
      items: lineas.map((l, i) => ({ nombre: l.nombre, unidad: l.unidad, cantidad: medidas[i].cant, precio: r2(n(l.precio)), subtotal: medidas[i].sub })),
    });
    setAbierto(false);
    intento.current = { sig: '', clave: '' };
  }

  function otra() {
    setHecho(null); setLineas([]); setF(formVacio()); setPedidoId(null); setQ(''); setErr(''); setMas(false);
    intento.current = { sig: '', clave: '' };
    history.replaceState(null, '', '/admin/ventas/nueva');
    recargar();
  }

  if (!productos) return <p className="p-8 text-center text-stone-500">Cargando...</p>;

  if (hecho) {
    return (
      <main className="px-4 pt-10 text-center">
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-green-100 text-green-600"><Check size={40} /></span>
        <h1 className="mt-4 text-2xl font-bold text-stone-900">{'Venta #' + hecho.id + ' registrada'}</h1>
        <p className="mt-1 text-4xl font-extrabold text-stone-900">{bs(hecho.total)}</p>
        {hecho.total - hecho.pagado > 0.001 && <p className="mt-1 font-semibold text-amber-700">{'Queda por cobrar ' + bs(hecho.total - hecho.pagado)}</p>}
        <div className="mx-auto mt-8 flex max-w-sm flex-col gap-3">
          <a href={waLink(hecho.cliente_tel, reciboTexto(hecho, negocio))} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-full bg-green-500 py-3 font-bold text-white"><MessageCircle size={18} /> Enviar recibo por WhatsApp</a>
          <button onClick={otra} className="rounded-full bg-vino-800 py-3 font-bold text-white">Nueva venta</button>
          <Link href="/admin/ventas" className="rounded-full bg-white py-3 font-semibold text-stone-700 ring-1 ring-stone-200">Ver ventas</Link>
        </div>
      </main>
    );
  }

  const items = lineas.length;

  return (
    <main className="px-4 pb-32 pt-4">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/admin/ventas" aria-label="Volver" className="grid h-9 w-9 place-items-center rounded-full bg-white shadow-card"><ArrowLeft size={18} /></Link>
        <h1 className="text-xl font-bold text-stone-900">{'Nueva venta' + (pedidoId ? ' · pedido #' + pedidoId : '')}</h1>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <button onClick={() => cambiarTipo('menor')} className={chip(tipo === 'menor')}>Al menor</button>
        <button onClick={() => cambiarTipo('mayor')} className={chip(tipo === 'mayor')}>Al mayor</button>
        <button onClick={() => setLibre({ nombre: '', precio: '' })} className="ml-auto rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-stone-600 ring-1 ring-stone-200">+ Ítem libre</button>
      </div>

      {libre && (
        <div className="mb-3 flex gap-2 rounded-2xl bg-white p-3 shadow-card">
          <input placeholder="Descripción" value={libre.nombre} onChange={(e) => setLibre({ ...libre, nombre: e.target.value })} />
          <input type="number" inputMode="decimal" placeholder="Bs" value={libre.precio} onChange={(e) => setLibre({ ...libre, precio: e.target.value })} style={{ width: '6rem' }} />
          <button onClick={() => {
            if (!libre.nombre.trim() || !(n(libre.precio) > 0)) return;
            setLineas((ls) => [...ls, { producto_id: '', nombre: libre.nombre.trim(), unidad: 'u', p: null, cantidad: '1', precio: String(n(libre.precio)), manual: true, modo: 'peso', monto: '' }]);
            setLibre(null);
          }} className="rounded-xl bg-vino-800 px-4 font-bold text-white">OK</button>
        </div>
      )}

      <div className="relative mb-3">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar producto..." style={{ paddingLeft: '2.75rem' }} />
      </div>

      <ul className="space-y-2">
        {lista.map((p) => {
          const l = enCarrito(p.id);
          const st = p.stock != null ? Number(p.stock) : null;
          const base = precioDe(p, 0, tipo).precio;
          const desde = p.mayor_desde != null && Number(p.mayor_desde) > 0 && p.precio_mayor != null ? Number(p.mayor_desde) : null;
          return (
            <li key={p.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-card">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{p.nombre}</p>
                <p className="text-xs text-stone-500">
                  {base > 0 ? bs(base) + '/' + p.unidad : <span className="font-semibold text-red-600">Sin precio</span>}
                  {st != null && <span className={st <= 0 ? 'font-semibold text-red-600' : ''}>{' · stock ' + qty(st)}</span>}
                </p>
                {desde != null && <p className="text-[11px] font-semibold text-amber-700">{'Desde ' + qty(desde) + ' ' + p.unidad + ': ' + bs(p.precio_mayor) + '/' + p.unidad}</p>}
              </div>
              {l ? (
                <div className="flex items-center gap-1 rounded-full bg-vino-800 p-1 text-white">
                  <button onClick={() => sumar(p, -paso(p.unidad))} aria-label="Quitar" className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/15"><Minus size={15} /></button>
                  <span className="min-w-[2.5rem] text-center text-sm font-bold">{qty(l.modo === 'monto' ? medir(l).cant : n(l.cantidad))}</span>
                  <button onClick={() => sumar(p, paso(p.unidad))} aria-label="Agregar" className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/15"><Plus size={15} /></button>
                </div>
              ) : (
                <button onClick={() => sumar(p, paso(p.unidad))} aria-label={'Agregar ' + p.nombre} className="grid h-10 w-10 place-items-center rounded-full bg-vino-800 text-white"><Plus size={18} /></button>
              )}
            </li>
          );
        })}
        {lista.length === 0 && <li className="py-10 text-center text-stone-500">No hay productos con esa búsqueda.</li>}
      </ul>

      <div className="fixed inset-x-0 bottom-16 z-40 px-4 md:bottom-4 md:left-64">
        <button disabled={!items} onClick={() => { setErr(''); setAbierto(true); }}
          className="mx-auto flex w-full max-w-4xl items-center justify-between rounded-full bg-vino-800 px-6 py-3.5 font-bold text-white shadow-lift disabled:bg-stone-400">
          <span>{items ? items + (items === 1 ? ' producto' : ' productos') : 'Sin productos'}</span>
          <span>{'Cobrar ' + bs(total)}</span>
        </button>
      </div>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 md:items-center" onClick={() => setAbierto(false)}>
          <div onClick={(e) => e.stopPropagation()} className="flex max-h-[94vh] w-full max-w-lg flex-col rounded-t-3xl bg-white md:rounded-3xl">
            <div className="flex items-center justify-between px-5 pb-2 pt-5">
              <h2 className="text-xl font-bold text-stone-900">Cobrar</h2>
              <button onClick={() => setAbierto(false)} aria-label="Cerrar" className="grid h-9 w-9 place-items-center rounded-full bg-stone-100"><X size={18} /></button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-5 pb-3">
              <ul className="space-y-2">
                {lineas.map((l, i) => {
                  const m = medidas[i];
                  const auto = l.p ? precioDe(l.p, m.cant, tipo) : null;
                  const cambiado = auto && l.manual && Math.abs(auto.precio - n(l.precio)) > 0.001;
                  const st = l.p && l.p.stock != null ? Number(l.p.stock) : null;
                  return (
                    <li key={l.producto_id + '-' + i} className="rounded-2xl bg-stone-50 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold">{l.nombre}</p>
                        <button onClick={() => setLineas((ls) => ls.filter((_, x) => x !== i))} aria-label="Quitar" className="text-red-600"><Trash2 size={16} /></button>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                        {auto && auto.esp && !l.manual && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">Precio por mayor</span>}
                        {cambiado && <span className="rounded-full bg-stone-200 px-2 py-0.5 text-stone-700">{'Precio cambiado (lista ' + bs(auto.precio) + ')'}</span>}
                        {cambiado && <button onClick={() => setL(i, { manual: false })} className="text-vino-800 underline">Volver a lista</button>}
                      </div>
                      <div className="mt-2 flex gap-2">
                        <button onClick={() => cambiarModo(i, 'peso')} className={mini(l.modo === 'peso')}>{esKg(l.unidad) ? 'Peso' : 'Cantidad'}</button>
                        <button onClick={() => cambiarModo(i, 'monto')} className={mini(l.modo === 'monto')}>Monto</button>
                      </div>
                      {l.modo === 'peso' && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {rapidas(l.unidad).map((v) => (
                            <button key={v} onClick={() => setL(i, { cantidad: String(v) })} className={mini(n(l.cantidad) === v)}>{marca(v, l.unidad)}</button>
                          ))}
                        </div>
                      )}
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {l.modo === 'peso' ? (
                          <label className="text-xs text-stone-500">{'Cantidad (' + l.unidad + ')'}
                            <input type="number" inputMode="decimal" step="any" min="0" value={l.cantidad} onChange={(e) => setL(i, { cantidad: e.target.value })} />
                          </label>
                        ) : (
                          <label className="text-xs text-stone-500">Monto Bs
                            <input type="number" inputMode="decimal" step="0.01" min="0" value={l.monto} onChange={(e) => setL(i, { monto: e.target.value })} />
                          </label>
                        )}
                        <label className="text-xs text-stone-500">{'Precio Bs/' + l.unidad}
                          <input type="number" inputMode="decimal" step="0.01" min="0" value={l.precio} onChange={(e) => setPrecio(i, e.target.value)} />
                        </label>
                      </div>
                      <p className="mt-2 text-right text-sm font-bold text-stone-900">{qty(m.cant) + ' ' + l.unidad + ' × ' + bs(n(l.precio)) + ' = ' + bs(m.sub)}</p>
                      {st != null && m.cant > st && <p className="mt-1 text-xs font-semibold text-amber-700">{'Solo hay ' + qty(st) + ' ' + l.unidad + ' en stock'}</p>}
                    </li>
                  );
                })}
              </ul>

              <div className="grid grid-cols-4 gap-2">
                {METODOS.map(([v, t]) => (
                  <button key={v} onClick={() => setF({ ...f, metodo: v })} className={`rounded-xl py-2.5 text-sm font-semibold ${f.metodo === v ? 'bg-vino-800 text-white' : 'bg-stone-100 text-stone-700'}`}>{t}</button>
                ))}
              </div>

              {f.metodo === 'efectivo' && (
                <div className="rounded-2xl bg-stone-50 p-3">
                  <p className="text-xs font-semibold text-stone-500">El cliente paga con</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <button onClick={() => setF({ ...f, recibe: String(total) })} className={mini(f.recibe !== '' && recibe === total)}>Exacto</button>
                    {sugeridos.map((b) => (
                      <button key={b} onClick={() => setF({ ...f, recibe: String(b) })} className={mini(recibe === b)}>{'Bs ' + b}</button>
                    ))}
                  </div>
                  <input className="mt-2" type="number" inputMode="decimal" step="0.01" min="0" placeholder="Otro monto" value={f.recibe} onChange={(e) => setF({ ...f, recibe: e.target.value })} />
                  {vuelto > 0 && <p className="mt-2 text-center text-lg font-extrabold text-green-700">{'Vuelto: ' + bs(vuelto)}</p>}
                  {falta > 0 && <p className="mt-2 text-center text-sm font-bold text-amber-700">{'Falta ' + bs(falta)}</p>}
                </div>
              )}

              {f.metodo === 'fiado' && (
                <div className="space-y-2 rounded-2xl bg-amber-50 p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <input list="clientes" placeholder="Cliente (obligatorio)" value={f.nombre} onChange={(e) => elegirNombre(e.target.value)} />
                    <input type="tel" inputMode="tel" placeholder="WhatsApp (opcional)" value={f.tel} onChange={(e) => setF({ ...f, tel: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="text-xs text-stone-500">Entrega inicial (Bs)
                      <input type="number" inputMode="decimal" step="0.01" min="0" value={f.pagado} onChange={(e) => setF({ ...f, pagado: e.target.value })} />
                    </label>
                    <label className="text-xs text-stone-500">Entrega con
                      <select value={f.entrega} onChange={(e) => setF({ ...f, entrega: e.target.value })}>
                        <option value="efectivo">Efectivo</option>
                        <option value="qr">QR</option>
                        <option value="transferencia">Transf.</option>
                      </select>
                    </label>
                  </div>
                </div>
              )}

              <button onClick={() => setMas(!mas)} className="flex w-full items-center justify-between rounded-xl bg-stone-50 px-4 py-2.5 text-sm font-semibold text-stone-700">
                <span>Más opciones</span>
                <ChevronDown size={16} className={mas ? 'rotate-180 transition' : 'transition'} />
              </button>
              {mas && (
                <div className="space-y-2 rounded-2xl bg-stone-50 p-3">
                  <label className="block text-xs text-stone-500">Descuento (Bs)
                    <input type="number" inputMode="decimal" step="0.01" min="0" value={f.descuento} onChange={(e) => setF({ ...f, descuento: e.target.value })} placeholder="0" />
                  </label>
                  {f.metodo !== 'fiado' && (
                    <div className="grid grid-cols-2 gap-2">
                      <input list="clientes" placeholder="Cliente (opcional)" value={f.nombre} onChange={(e) => elegirNombre(e.target.value)} />
                      <input type="tel" inputMode="tel" placeholder="WhatsApp (opcional)" value={f.tel} onChange={(e) => setF({ ...f, tel: e.target.value })} />
                    </div>
                  )}
                  <input placeholder="Nota (opcional)" value={f.nota} onChange={(e) => setF({ ...f, nota: e.target.value })} />
                  <label className="block text-xs text-stone-500">Fecha de la venta
                    <input type="date" max={hoyBO()} value={f.fecha} onChange={(e) => setF({ ...f, fecha: e.target.value })} />
                  </label>
                </div>
              )}
              <datalist id="clientes">
                {clientes.map((c) => <option key={c.nombre} value={c.nombre} />)}
              </datalist>
            </div>

            <div className="space-y-2 border-t border-stone-100 p-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-stone-500">{desc > 0 ? 'Subtotal ' + bs(bruto) + ' · descuento −' + bs(desc) : items + (items === 1 ? ' producto' : ' productos')}</p>
                  <p className="text-3xl font-extrabold text-stone-900">{bs(total)}</p>
                </div>
                {f.metodo === 'fiado' && <p className="text-right text-sm font-bold text-amber-700">{'Queda: ' + bs(r2(total - pagadoIni))}</p>}
              </div>
              {err && <p className="text-center text-sm font-semibold text-red-600">{err}</p>}
              <button onClick={confirmar} disabled={busy} className="w-full rounded-full bg-vino-800 py-3.5 font-bold text-white disabled:opacity-50">
                {busy ? 'Guardando...' : 'Confirmar venta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
