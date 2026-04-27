import { ImageResponse } from 'next/og';

import { BrandIconArtwork } from '@/lib/brand-icon-artwork';

export const size = {
  width: 180,
  height: 180,
};

export const contentType = 'image/png';

export default function AppleIcon() {
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
        <BrandIconArtwork size={180} />
      </div>
    ),
    size
  );
}
