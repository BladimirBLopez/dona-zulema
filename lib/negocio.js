export const WA = '59175284955';
export const wa = (t) => `https://wa.me/${WA}?text=${encodeURIComponent(t)}`;

// Llenar con los datos reales del cliente. Si están vacíos, la sección se oculta.
export const NEGOCIO = {
  direccion: '',            // ej: 'Av. Principal #123, Zona Centro, Ciudad'
  horarios: [],             // ej: [['Lunes a sábado', '07:00 - 19:00'], ['Domingo', '08:00 - 13:00']]
  mapaEmbed: '',            // URL de "Compartir > Insertar mapa" en Google Maps (solo el src)
  facebook: '',
  instagram: '',
  tiktok: '',
};
