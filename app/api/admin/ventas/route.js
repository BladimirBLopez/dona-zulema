import { admin } from '@/lib/api';
import { crearVenta, anularVenta, abonar, listarVentas } from '@/lib/ventas';

export const GET = admin(({ p }) => listarVentas({ desde: p.get('desde'), hasta: p.get('hasta'), q: p.get('q'), solo: p.get('solo') }));
export const POST = admin(({ body }) => crearVenta(body));
export const PATCH = admin(({ body }) => {
  if (body.accion === 'anular') return anularVenta(body.id);
  if (body.accion === 'abonar') return abonar(body.id, body.monto, body.metodo);
  return { error: 'accion_invalida' };
});
