'use client';
import ImageUpload from '@/components/ImageUpload';
import { useEffect, useState } from 'react';

const inp = 'w-full rounded border p-2';
const Box = ({ t, children }) => (
  <section className="mb-6 space-y-3 rounded-xl bg-white p-4 shadow">
    <h2 className="font-bold text-[#7a1414]">{t}</h2>{children}
  </section>
);
const L = ({ t, children }) => (<label className="block text-sm font-medium">{t}<div className="mt-1">{children}</div></label>);

export default function Negocio() {
  const [n, setN] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      const r = await fetch('/api/admin/negocio');
      if (r.status === 401) { location.href = '/admin'; return; }
      setN(await r.json());
    })();
  }, []);

  if (!n) return <p className="p-6">Cargando...</p>;
  const set = (k, v) => setN({ ...n, [k]: v });
  const setRow = (k, i, j, v) => set(k, n[k].map((r, x) => (x === i ? r.map((c, y) => (y === j ? v : c)) : r)));
  const addRow = (k) => set(k, [...n[k], ['', '']]);
  const delRow = (k, i) => set(k, n[k].filter((_, x) => x !== i));

  async function guardar(e) {
    e.preventDefault();
    setMsg('Guardando...');
    const r = await fetch('/api/admin/negocio', { method: 'POST', body: JSON.stringify(n) });
    setMsg(r.ok ? 'Guardado. El sitio se actualiza en 1 minuto.' : 'Error al guardar');
    if (r.ok) setN(await (await fetch('/api/admin/negocio')).json());
  }

  return (
    <form onSubmit={guardar} className="mx-auto max-w-2xl p-4">
      <h1 className="mb-4 text-2xl font-bold text-[#7a1414]">Datos del negocio</h1>

      <Box t="Logo">
        <ImageUpload value={n.logo} label="Logo del negocio" onChange={(u) => set("logo", u)} />
        <ImageUpload value={n.hero} label="Foto de portada (se ve detrás del título)" onChange={(u) => set("hero", u)} />
      </Box>

      <Box t="General">
        <L t="Nombre"><input className={inp} value={n.nombre} onChange={(e) => set('nombre', e.target.value)} /></L>
        <L t="Slogan (arriba del título)"><input className={inp} value={n.slogan} onChange={(e) => set('slogan', e.target.value)} /></L>
        <L t="Título de portada"><input className={inp} value={n.titulo} onChange={(e) => set('titulo', e.target.value)} /></L>
        <L t="Texto de portada"><textarea rows={3} className={inp} value={n.subtitulo} onChange={(e) => set('subtitulo', e.target.value)} /></L>
        <L t="WhatsApp (con código de país, solo números)"><input inputMode="numeric" className={inp} value={n.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} /></L>
        <L t="Marcas que trabajan (separadas por coma)"><input className={inp} value={n.marcas.join(', ')} onChange={(e) => set('marcas', e.target.value.split(','))} /></L>
      </Box>

      <Box t="Ubicación">
        <L t="Dirección"><input className={inp} value={n.direccion} onChange={(e) => set('direccion', e.target.value)} /></L>
        <L t="Mapa: pega el código “Insertar mapa” de Google Maps">
          <textarea rows={3} className={inp} placeholder='<iframe src="https://www.google.com/maps/embed?..."></iframe>' value={n.mapa} onChange={(e) => set('mapa', e.target.value)} />
        </L>
      </Box>

      <Box t="Horarios">
        {n.horarios.map((h, i) => (
          <div key={i} className="flex gap-2">
            <input className={inp} placeholder="Lunes a sábado" value={h[0]} onChange={(e) => setRow('horarios', i, 0, e.target.value)} />
            <input className={inp} placeholder="07:00 - 19:00" value={h[1]} onChange={(e) => setRow('horarios', i, 1, e.target.value)} />
            <button type="button" onClick={() => delRow('horarios', i)} className="px-2 text-red-700">✕</button>
          </div>
        ))}
        <button type="button" onClick={() => addRow('horarios')} className="text-sm font-semibold text-blue-700">+ Agregar horario</button>
      </Box>

      <Box t="Redes sociales (enlace completo con https://)">
        <L t="Facebook"><input className={inp} value={n.facebook} onChange={(e) => set('facebook', e.target.value)} /></L>
        <L t="Instagram"><input className={inp} value={n.instagram} onChange={(e) => set('instagram', e.target.value)} /></L>
        <L t="TikTok"><input className={inp} value={n.tiktok} onChange={(e) => set('tiktok', e.target.value)} /></L>
      </Box>

      <Box t="Bloque para mayoristas">
        <L t="Título"><input className={inp} value={n.mayor_titulo} onChange={(e) => set('mayor_titulo', e.target.value)} /></L>
        <L t="Texto"><input className={inp} value={n.mayor_texto} onChange={(e) => set('mayor_texto', e.target.value)} /></L>
      </Box>

      <Box t="Preguntas frecuentes">
        {n.faq.map((f, i) => (
          <div key={i} className="space-y-1 rounded border p-2">
            <input className={inp} placeholder="Pregunta" value={f[0]} onChange={(e) => setRow('faq', i, 0, e.target.value)} />
            <textarea rows={2} className={inp} placeholder="Respuesta" value={f[1]} onChange={(e) => setRow('faq', i, 1, e.target.value)} />
            <button type="button" onClick={() => delRow('faq', i)} className="text-sm text-red-700">Quitar</button>
          </div>
        ))}
        <button type="button" onClick={() => addRow('faq')} className="text-sm font-semibold text-blue-700">+ Agregar pregunta</button>
      </Box>

      <div className="sticky bottom-0 -mx-4 border-t bg-[#fbf6ec] p-3">
        <button className="w-full rounded bg-[#7a1414] py-3 font-bold text-white">Guardar cambios</button>
        {msg && <p className="mt-2 text-center text-sm text-green-700">{msg}</p>}
      </div>
    </form>
  );
}
