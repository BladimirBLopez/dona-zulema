export default function Marca({ N, big = false }) {
  const box = big ? 'mx-auto mb-3 h-14 w-14 text-xl' : 'h-10 w-10 text-lg';
  if (N.logo) {
    return <img src={N.logo.replace('/upload/', '/upload/f_auto,q_auto,w_120,h_120,c_fill/')} alt={N.nombre} className={`block ${box} rounded-full object-cover ring-2 ring-oro-400`} />;
  }
  return <span className={`grid ${box} place-items-center rounded-full bg-oro-400 font-serif font-extrabold text-vino-950`}>{N.nombre.charAt(0)}</span>;
}
