interface BrandIconArtworkProps {
  size?: number;
}

export function BrandIconArtwork({ size = 512 }: BrandIconArtworkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="512" height="512" rx="112" fill="#000000" />
      <rect x="24" y="24" width="464" height="464" rx="88" stroke="#333333" strokeWidth="4" />
      
      <path
        d="M333 154C294 115 243 102 204 102C115 102 51 179 51 256C51 333 115 410 204 410C243 410 294 397 333 358"
        stroke="#FFFFFF"
        strokeWidth="32"
        strokeLinecap="square"
      />
      <path
        d="M256 154V358"
        stroke="#FFFFFF"
        strokeWidth="32"
        strokeLinecap="square"
      />
    </svg>
  );
}
