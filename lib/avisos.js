import { toast } from 'sonner';

export const avisar = {
  ok: (t, d) => toast.success(t, d ? { description: d } : undefined),
  error: (t, d) => toast.error(t, d ? { description: d } : undefined),
  info: (t, d) => toast(t, d ? { description: d } : undefined),
};

let escuchar = null;

export function _registrar(fn) {
  escuchar = fn;
  return () => { if (escuchar === fn) escuchar = null; };
}

export function confirmar(opciones = {}) {
  return new Promise((res) => {
    if (!escuchar) return res(window.confirm(opciones.titulo || '¿Seguro?'));
    escuchar({ ...opciones, res });
  });
}
