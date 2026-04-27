import { ImageResponse } from 'next/og';

import { BrandIconArtwork } from '@/lib/brand-icon-artwork';

export const size = {
  width: 512,
  height: 512,
};

export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#000000',
        }}
      >
        <BrandIconArtwork size={512} />
      </div>
    ),
    size
  );
}
