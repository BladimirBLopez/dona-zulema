import Shell from './shell';

export const metadata = { title: 'Admin', robots: { index: false, follow: false }, manifest: '/api/manifest' };

export default function AdminLayout({ children }) {
  return <Shell>{children}</Shell>;
}
