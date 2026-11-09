import { admin } from '@/lib/api';
import { listarPedidos, cancelarPedido } from '@/lib/ventas';

export const GET = admin(({ p }) => listarPedidos(p.get('estado')));
export const PATCH = admin(({ body }) => cancelarPedido(body.id));
