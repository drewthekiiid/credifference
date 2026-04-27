import { cn } from '@/lib/utils';

interface BrandMarkProps {
  size?: 'sm' | 'md' | 'lg';
  framed?: boolean;
  className?: string;
}

const sizeClasses: Record<NonNullable<BrandMarkProps['size']>, string> = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
};

export function BrandMark({
  size = 'md',
  framed = true,
  className,
}: BrandMarkProps) {
  return (
    <div className={cn('relative shrink-0 flex items-center justify-center', sizeClasses[size], className)}>
      {framed && (
        <div className="absolute inset-0 border border-[var(--border-strong)] bg-[var(--panel-strong)] shadow-[var(--shadow-card)]" style={{ borderRadius: '22%' }} />
      )}
      <svg viewBox="0 0 40 40" className="relative h-1/2 w-1/2" aria-hidden="true">
        <path
          d="M26 12C23 9 19 8 16 8C9 8 4 14 4 20C4 26 9 32 16 32C19 32 23 31 26 28"
          fill="none"
          stroke="var(--text)"
          strokeWidth="2.5"
          strokeLinecap="square"
        />
        <path
          d="M20 12V28"
          fill="none"
          stroke="var(--text)"
          strokeWidth="2.5"
          strokeLinecap="square"
        />
      </svg>
    </div>
  );
}
