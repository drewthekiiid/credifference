import { cn } from '@/lib/utils';
import { BrandMark } from '@/components/BrandMark';

interface BrandLockupProps {
  eyebrow?: string;
  subtitle?: string;
  description?: string;
  hero?: boolean;
  centered?: boolean;
  className?: string;
}

export function BrandLockup({
  eyebrow,
  subtitle,
  description,
  hero = false,
  centered = false,
  className,
}: BrandLockupProps) {
  return (
    <div className={cn('space-y-6', centered && 'text-center', className)}>
      <div className={cn('flex items-center gap-5', centered && 'justify-center')}>
        <BrandMark size={hero ? 'lg' : 'md'} />

        <div className="space-y-1.5">
          {eyebrow ? <p className="editorial-kicker">{eyebrow}</p> : null}
          <h1
            className={cn(
              'lux-title font-display leading-none tracking-normal font-normal',
              hero ? 'text-5xl md:text-6xl lg:text-[4.5rem]' : 'text-3xl md:text-4xl'
            )}
          >
            Credifference
          </h1>
        </div>
      </div>

      {subtitle ? (
        <p
          className={cn(
            'font-display leading-tight text-(--text) tracking-normal font-light',
            hero ? 'text-3xl md:text-4xl lg:text-5xl' : 'text-2xl'
          )}
        >
          {subtitle}
        </p>
      ) : null}

      {description ? (
        <p
          className={cn(
            'max-w-xl text-base leading-relaxed muted-copy font-light',
            centered && 'mx-auto',
            hero ? 'md:text-lg' : 'text-sm md:text-base'
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
