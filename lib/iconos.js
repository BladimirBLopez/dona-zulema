import { ImageResponse } from 'next/og';

export function iconoPng(lado, relleno = 0.7) {
  const d = Math.round(lado * relleno);
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#3b0909' }}>
        <div style={{ width: d, height: d, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: '#fcd34d', color: '#3b0909', fontSize: Math.round(d * 0.62), fontWeight: 800 }}>D</div>
      </div>
    ),
    { width: lado, height: lado }
  );
}
