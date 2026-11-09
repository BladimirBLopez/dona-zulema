import './globals.css';

export const metadata = {
  title: 'Doña Zulema | Fiambres, lácteos y pollo',
  description: 'Quesos, fiambres Sofía, lácteos PIL, pollo y menudencias al por mayor y menor.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="bg-amber-50 text-stone-800">{children}</body>
    </html>
  );
}
