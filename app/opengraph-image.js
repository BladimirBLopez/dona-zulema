import { ImageResponse } from 'next/og';

export const alt = 'Doña Zulema';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#3b0909,#8f1f1f)', color: '#fff' }}>
        <div style={{ display: 'flex', fontSize: 34, color: '#fcd34d', letterSpacing: 8 }}>QUESERÍA · FIAMBRERÍA · POLLERÍA</div>
        <div style={{ display: 'flex', fontSize: 120, fontWeight: 800, marginTop: 20 }}>Doña Zulema</div>
        <div style={{ display: 'flex', fontSize: 40, marginTop: 20, color: '#fde68a' }}>Al por mayor y menor · Pedidos por WhatsApp</div>
      </div>
    ),
    size
  );
}
