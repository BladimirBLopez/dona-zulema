'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Menu as MenuIcon, X } from 'lucide-react';
import WhatsApp from '@/components/WhatsApp';

export default function Menu({ items, pedido }) {
  const [open, setOpen] = useState(false);
  const botonRef = useRef(null);
  const cerrarRef = useRef(null);

  const cerrar = () => {
    setOpen(false);
    botonRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;

    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    cerrarRef.current?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') cerrar();
    };

    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = anterior;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);
  return (
    <>
      <button ref={botonRef} type="button" onClick={() => setOpen(true)} aria-label="Abrir menú" aria-expanded={open} aria-controls="menu-tienda" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-oro-400">
        <MenuIcon size={22} />
      </button>
      {open && createPortal(
        <div className="fixed inset-0 z-[70]">
          <button type="button" aria-label="Cerrar menú" onClick={cerrar} className="absolute inset-0 h-full w-full bg-black/60 backdrop-blur-[2px]" />
          <nav id="menu-tienda" aria-label="Navegación principal" className="absolute inset-y-0 left-0 h-[100dvh] w-80 max-w-[88vw] overflow-y-auto bg-vino-950 p-5 text-white shadow-2xl">
            <div className="mb-5 flex items-center justify-between gap-3 border-b border-white/10 pb-4">
              <p className="text-lg font-extrabold">Explorar tienda</p>
              <button ref={cerrarRef} type="button" onClick={cerrar} aria-label="Cerrar menú" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10 hover:bg-white/20">
                <X size={22} />
              </button>
            </div>
            <ul className="space-y-1">
              {items.map(([t, h]) => (
                <li key={h}>
                  <a href={h} onClick={cerrar} className="flex min-h-12 items-center rounded-xl px-4 py-3 font-semibold hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-oro-400">{t}</a>
                </li>
              ))}
            </ul>
            <a href={pedido} target="_blank" rel="noopener noreferrer" onClick={cerrar} className="mt-6 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-bold transition hover:bg-green-700">
              <WhatsApp size={20} /> Pedir por WhatsApp
            </a>
          </nav>
        </div>,
        document.body
      )}
    </>
  );
}
