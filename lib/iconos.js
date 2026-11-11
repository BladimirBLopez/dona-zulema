import { ImageResponse } from 'next/og';
import { gallitoPng } from './gallito-data';

export function iconoPng(lado, relleno = 0.7) {
  const d = Math.round(lado * relleno);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#061943'
        }}
      >
        <img
          src={gallitoPng}
          alt=""
          width={d}
          height={d}
          style={{ objectFit: 'contain' }}
        />
      </div>
    ),
    { width: lado, height: lado }
  );
}
