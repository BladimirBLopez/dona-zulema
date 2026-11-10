'use client';
// negocio-pro
import { useEffect, useState } from 'react';
import { ChevronDown, Plus, Trash2, X } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';
import Marca from '@/components/Marca';
import { avisar } from '@/lib/avisos';
import { Page, PageHeader, Card, Badge, Btn, Skeleton } from '@/components/ui';

const PRESETS = ['Lunes a viernes', 'Lunes a sábado', 'Sábado', 'Domingo'];
const norm = (d) => ({ ...d, logo: d.logo || '', hero: d.hero || '', horarios: d.horarios || [], faq: d.faq || [], marcas: d.marcas || [] });
const digitos = (v) => String(v || '').replace(/\D/g, '');
const waFinal = (v) => { const d = digitos(v); return d.length === 8 ? '591' + d : d; };
const fmtWa = (d) => (d.startsWith('591') && d.length === 11 ? '+591 ' + d.slice(3, 7) + ' ' + d.slice(7) : d ? '+' + d : '');
const img = (u, w) => (u ? u.replace('/upload/', '/upload/f_auto,q_auto,w_' + w + '/') : '');
const https = (v) => !String(v || '').trim() || /^https:\/\//.test(String(v).trim());
const mapaOk = (v) => {
  const raw = String(v || '');
  const m = raw.match(/src="([^"]+)"/);
  return (m ? m[1] : raw).trim().startsWith('https://www.google.com/maps/embed');
};

function errores(n) {
  const e = {};
  const wa = digitos(n.whatsapp);
  if (!String(n.nombre || '').trim()) e.nombre = 'El nombre es obligatorio.';
  if (wa.length < 8 || wa.length > 15) e.whatsapp = 'Escribe un número válido, con código de país (ej. 59175284955).';
  for (const k of ['facebook', 'instagram', 'tiktok']) if (!https(n[k])) e[k] = 'El enlace de ' + k + ' debe empezar con https://';
  if (String(n.mapa || '').trim() && !mapaOk(n.mapa)) e.mapa = 'Pega el código Insertar mapa de Google Maps (empieza con iframe).';
  return e;
}

function Seccion({ titulo, resumen, abierta = false, forzar = false, estado, children }) {
  const [open, setOpen] = useState(abierta);
  useEffect(() => { if (forzar) setOpen(true); }, [forzar]);
  return (
    <Card className="!p-0">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-3 p-4 text-left">
        <div className="min-w-0">
          <p className="font-bold text-stone-900">{titulo}</p>
          {resumen && <p className="truncate text-xs text-stone-500">{resumen}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {estado}
          <ChevronDown size={18} className={'text-stone-400 transition ' + (open ? 'rotate-180' : '')} />
        </div>
      </button>
      {open && <div className="space-y-3 border-t border-stone-100 p-4">{children}</div>}
    </Card>
  );
}

function Campo({ label, ayuda, error, extra, children }) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-2 text-xs font-semibold text-stone-600">
        <span>{label}</span>
        {extra && <span className="font-normal text-stone-400">{extra}</span>}
      </span>
      <div className="mt-1">{children}</div>
      {error ? <p className="mt-1 text-xs font-semibold text-red-600">{error}</p> : ayuda ? <p className="mt-1 text-xs text-stone-500">{ayuda}</p> : null}
    </label>
  );
}

const chip = 'rounded-full bg-white px-3 py-1.5 text-xs font-bold text-stone-700 ring-1 ring-stone-300 disabled:opacity-40';

export default function Negocio() {
  const [n, setN] = useState(null);
  const [base, setBase] = useState('');
  const [fallo, setFallo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [marcaTxt, setMarcaTxt] = useState('');

  async function cargar() {
    setFallo(false);
    try {
      const r = await fetch('/api/admin/negocio');
      if (r.status === 401) { location.href = '/admin'; return; }
      const d = norm(await r.json());
      setN(d);
      setBase(JSON.stringify(d));
    } catch { setFallo(true); }
  }
  useEffect(() => { cargar(); }, []);

  const sucio = n !== null && JSON.stringify(n) !== base;
  useEffect(() => {
    if (!sucio) return;
    const f = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', f);
    return () => window.removeEventListener('beforeunload', f);
  }, [sucio]);

  if (fallo) {
    return (
      <Page>
        <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          No se pudieron cargar los datos del negocio.
          <div className="mt-3"><Btn variant="danger" onClick={cargar}>Reintentar</Btn></div>
        </div>
      </Page>
    );
  }
  if (!n) {
    return (
      <Page>
        <div className="space-y-3"><Skeleton className="h-44" /><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" /></div>
      </Page>
    );
  }

  const set = (k, v) => setN((x) => ({ ...x, [k]: v }));
  const setRow = (k, i, j, v) => setN((x) => ({ ...x, [k]: x[k].map((r, a) => (a === i ? r.map((c, b) => (b === j ? v : c)) : r)) }));
  const addRow = (k, fila = ['', '']) => setN((x) => ({ ...x, [k]: [...x[k], fila] }));
  const delRow = (k, i) => setN((x) => ({ ...x, [k]: x[k].filter((_, a) => a !== i) }));

  function agregarMarca() {
    const v = marcaTxt.trim().slice(0, 40);
    if (!v) return;
    if (n.marcas.some((m) => m.toLowerCase() === v.toLowerCase())) return setMarcaTxt('');
    if (n.marcas.length >= 12) return avisar.error('Máximo 12 marcas', undefined, 'marcas');
    set('marcas', [...n.marcas, v]);
    setMarcaTxt('');
  }

  const err = errores(n);
  const claves = Object.keys(err);
  const wa = waFinal(n.whatsapp);
  const redes = ['facebook', 'instagram', 'tiktok'].filter((k) => String(n[k] || '').trim()).length;

  async function guardar() {
    if (claves.length) return avisar.error(err[claves[0]], undefined, 'negocio');
    setGuardando(true);
    avisar.cargando('Guardando...', 'negocio');
    try {
      const cuerpo = { ...n, whatsapp: wa, marcas: n.marcas.map((m) => m.trim()).filter(Boolean) };
      const r = await fetch('/api/admin/negocio', { method: 'POST', body: JSON.stringify(cuerpo) });
      if (!r.ok) {
        avisar.error('No se pudo guardar', undefined, 'negocio');
      } else {
        avisar.ok('Datos guardados', 'El sitio se actualiza en 1 minuto.', 'negocio');
        const d = norm(await (await fetch('/api/admin/negocio')).json());
        setN(d);
        setBase(JSON.stringify(d));
      }
    } catch {
      avisar.error('Sin conexión', 'Revisa tu internet e intenta de nuevo.', 'negocio');
    }
    setGuardando(false);
  }

  const rojo = <Badge tone="rojo">Revisar</Badge>;

  return (
    <Page className="pb-44">
      <PageHeader title="Negocio" sub="Lo que ven tus clientes en la tienda.">
        <Btn variant="ghost" href="/" target="_blank" rel="noopener noreferrer">Ver tienda</Btn>
      </PageHeader>

      <div className="space-y-3">
        <Card className="overflow-hidden !p-0">
          <div className="relative h-40 bg-vino-900 bg-cover bg-center" style={n.hero ? { backgroundImage: 'url("' + img(n.hero, 900) + '")' } : undefined}>
            <div className="absolute inset-0 bg-black/55" />
            <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-bold text-stone-700">Así se ve tu portada</span>
            <div className="relative flex h-full flex-col justify-end p-4 text-white">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-oro-300">{n.slogan}</p>
              <p className="text-lg font-bold leading-tight">{n.titulo}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4">
            <Marca N={{ nombre: (n.nombre || '').trim() || 'Negocio', logo: n.logo }} />
            <div className="min-w-0">
              <p className="truncate font-bold text-stone-900">{n.nombre}</p>
              <p className="text-xs text-stone-500">{fmtWa(wa) || 'Sin WhatsApp'}</p>
            </div>
          </div>
        </Card>

        <Seccion titulo="Identidad" resumen={n.nombre} abierta forzar={!!err.nombre} estado={err.nombre ? rojo : null}>
          <Campo label="Nombre del negocio" error={err.nombre} extra={(n.nombre || '').length + '/60'}>
            <input maxLength={60} value={n.nombre} onChange={(e) => set('nombre', e.target.value)} />
          </Campo>
          <div>
            <ImageUpload value={n.logo} label="Logo del negocio" onChange={(u) => set('logo', u)} />
            {n.logo && <button type="button" onClick={() => set('logo', '')} className="mt-1 text-xs font-bold text-red-600 underline">Quitar logo</button>}
          </div>
          <div>
            <ImageUpload value={n.hero} label="Foto de portada (se ve detrás del título)" onChange={(u) => set('hero', u)} />
            {n.hero && <button type="button" onClick={() => set('hero', '')} className="mt-1 text-xs font-bold text-red-600 underline">Quitar portada</button>}
          </div>
        </Seccion>

        <Seccion titulo="Portada y textos" resumen={n.titulo}>
          <Campo label="Slogan (arriba del título)" extra={(n.slogan || '').length + '/100'}>
            <input maxLength={100} value={n.slogan} onChange={(e) => set('slogan', e.target.value)} />
          </Campo>
          <Campo label="Título de portada" extra={(n.titulo || '').length + '/120'}>
            <input maxLength={120} value={n.titulo} onChange={(e) => set('titulo', e.target.value)} />
          </Campo>
          <Campo label="Texto de portada" extra={(n.subtitulo || '').length + '/300'}>
            <textarea rows={3} maxLength={300} value={n.subtitulo} onChange={(e) => set('subtitulo', e.target.value)} />
          </Campo>
        </Seccion>

        <Seccion titulo="Contacto y ubicación" resumen={fmtWa(wa) || 'Sin WhatsApp'} abierta forzar={!!(err.whatsapp || err.mapa)} estado={err.whatsapp || err.mapa ? rojo : null}>
          <Campo label="WhatsApp" error={err.whatsapp} ayuda={digitos(n.whatsapp).length === 8 ? 'Se guardará con el código de Bolivia: ' + fmtWa(wa) : 'Con código de país y solo números. Los pedidos llegan a este número.'}>
            <input inputMode="numeric" placeholder="59175284955" value={n.whatsapp} onChange={(e) => set('whatsapp', digitos(e.target.value).slice(0, 15))} />
          </Campo>
          <Campo label="Dirección" extra={(n.direccion || '').length + '/200'}>
            <input maxLength={200} value={n.direccion} onChange={(e) => set('direccion', e.target.value)} />
          </Campo>
          <Campo label="Mapa de Google Maps" error={err.mapa} ayuda="En Google Maps toca Compartir, luego Insertar mapa, copia el código y pégalo aquí.">
            <textarea rows={3} placeholder='<iframe src="https://www.google.com/maps/embed?..."></iframe>' value={n.mapa} onChange={(e) => set('mapa', e.target.value)} />
          </Campo>
          {n.mapa && !err.mapa && <p className="text-xs font-semibold text-green-700">Mapa válido ✓</p>}
        </Seccion>

        <Seccion titulo="Horarios" resumen={n.horarios.length ? n.horarios.length + (n.horarios.length === 1 ? ' horario' : ' horarios') : 'Sin horarios'}>
          {n.horarios.map((h, i) => (
            <div key={i} className="flex items-center gap-2">
              <input maxLength={40} placeholder="Lunes a sábado" value={h[0]} onChange={(e) => setRow('horarios', i, 0, e.target.value)} />
              <input maxLength={40} placeholder="07:00 - 19:00" value={h[1]} onChange={(e) => setRow('horarios', i, 1, e.target.value)} />
              <button type="button" onClick={() => delRow('horarios', i)} aria-label="Quitar horario" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-50 text-red-600"><Trash2 size={16} /></button>
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button key={p} type="button" disabled={n.horarios.length >= 14} onClick={() => addRow('horarios', [p, ''])} className={chip}>{'+ ' + p}</button>
            ))}
            <button type="button" disabled={n.horarios.length >= 14} onClick={() => addRow('horarios')} className={chip}>+ Otro</button>
          </div>
          <p className="text-xs text-stone-500">Las filas incompletas no se guardan.</p>
        </Seccion>

        <Seccion titulo="Redes sociales" resumen={redes ? redes + (redes === 1 ? ' red' : ' redes') : 'Sin redes'} forzar={!!(err.facebook || err.instagram || err.tiktok)} estado={err.facebook || err.instagram || err.tiktok ? rojo : null}>
          <Campo label="Facebook" error={err.facebook}><input inputMode="url" placeholder="https://facebook.com/..." value={n.facebook} onChange={(e) => set('facebook', e.target.value)} /></Campo>
          <Campo label="Instagram" error={err.instagram}><input inputMode="url" placeholder="https://instagram.com/..." value={n.instagram} onChange={(e) => set('instagram', e.target.value)} /></Campo>
          <Campo label="TikTok" error={err.tiktok}><input inputMode="url" placeholder="https://tiktok.com/@..." value={n.tiktok} onChange={(e) => set('tiktok', e.target.value)} /></Campo>
        </Seccion>

        <Seccion titulo="Marcas que trabajan" resumen={n.marcas.length ? n.marcas.join(', ') : 'Sin marcas'}>
          <div className="flex flex-wrap gap-2">
            {n.marcas.map((m, i) => (
              <span key={m + i} className="inline-flex items-center gap-1 rounded-full bg-stone-100 py-1 pl-3 pr-1 text-sm font-semibold text-stone-700">
                {m}
                <button type="button" onClick={() => set('marcas', n.marcas.filter((_, x) => x !== i))} aria-label={'Quitar ' + m} className="grid h-6 w-6 place-items-center rounded-full hover:bg-stone-200"><X size={14} /></button>
              </span>
            ))}
            {!n.marcas.length && <p className="text-sm text-stone-500">Todavía no agregaste marcas.</p>}
          </div>
          <div className="flex gap-2">
            <input maxLength={40} placeholder="Escribe una marca" value={marcaTxt} onChange={(e) => setMarcaTxt(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); agregarMarca(); } }} />
            <button type="button" onClick={agregarMarca} className="shrink-0 rounded-xl bg-vino-800 px-4 text-sm font-bold text-white">Agregar</button>
          </div>
        </Seccion>

        <Seccion titulo="Bloque para mayoristas" resumen={n.mayor_titulo}>
          <Campo label="Título" extra={(n.mayor_titulo || '').length + '/120'}>
            <input maxLength={120} value={n.mayor_titulo} onChange={(e) => set('mayor_titulo', e.target.value)} />
          </Campo>
          <Campo label="Texto" extra={(n.mayor_texto || '').length + '/200'}>
            <textarea rows={2} maxLength={200} value={n.mayor_texto} onChange={(e) => set('mayor_texto', e.target.value)} />
          </Campo>
        </Seccion>

        <Seccion titulo="Preguntas frecuentes" resumen={n.faq.length ? n.faq.length + (n.faq.length === 1 ? ' pregunta' : ' preguntas') : 'Sin preguntas'}>
          {n.faq.map((f, i) => (
            <div key={i} className="space-y-2 rounded-2xl bg-stone-50 p-3">
              <input maxLength={150} placeholder="Pregunta" value={f[0]} onChange={(e) => setRow('faq', i, 0, e.target.value)} />
              <textarea rows={2} maxLength={600} placeholder="Respuesta" value={f[1]} onChange={(e) => setRow('faq', i, 1, e.target.value)} />
              <button type="button" onClick={() => delRow('faq', i)} className="inline-flex items-center gap-1 text-xs font-bold text-red-600"><Trash2 size={14} /> Quitar pregunta</button>
            </div>
          ))}
          <button type="button" disabled={n.faq.length >= 20} onClick={() => addRow('faq')} className={chip + ' inline-flex items-center gap-1'}><Plus size={14} /> Agregar pregunta</button>
          <p className="text-xs text-stone-500">Las preguntas incompletas no se guardan.</p>
        </Seccion>
      </div>

      {sucio && (
        <div className="fixed inset-x-0 bottom-16 z-40 px-4 md:bottom-4 md:left-64">
          <div className="mx-auto flex max-w-4xl items-center gap-2 rounded-full bg-white p-2 pl-5 shadow-lift ring-1 ring-stone-200">
            <p className="min-w-0 flex-1 truncate text-sm font-semibold text-stone-700">Cambios sin guardar</p>
            <button type="button" disabled={guardando} onClick={() => setN(JSON.parse(base))} className="shrink-0 rounded-full bg-stone-100 px-4 py-2.5 text-sm font-bold text-stone-700 disabled:opacity-50">Descartar</button>
            <button type="button" disabled={guardando} onClick={guardar} className="shrink-0 rounded-full bg-vino-800 px-6 py-2.5 text-sm font-bold text-white disabled:opacity-50">{guardando ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </div>
      )}
    </Page>
  );
}
