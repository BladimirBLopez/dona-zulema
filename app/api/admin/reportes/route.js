import { admin } from '@/lib/api';
import { reporte } from '@/lib/ventas';

export const GET = admin(({ p }) => reporte(p.get('desde'), p.get('hasta')));
