import './globals.css';
import { Playfair_Display, Inter } from 'next/font/google';

const serif = Playfair_Display({ subsets: ['latin'], variable: '--font-serif', weight: ['700', '800'] });
const sans = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata = {
  title: 'Doña Zulema | Quesos, fiambres, lácteos y pollo',
  description: 'Quesos, fiambres Sofía, lácteos PIL, pollo y menudencias al por mayor y menor.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${serif.variable} ${sans.variable} scroll-smooth`}>
      <body className="bg-[#fbf6ec] text-stone-800 antialiased" style={{ fontFamily: 'var(--font-sans), system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
