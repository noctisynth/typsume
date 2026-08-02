import { cn } from '@/lib/utils';

interface BrandLogoProps {
  className?: string;
}

export function BrandLogo({ className }: BrandLogoProps) {
  return (
    <img
      alt=""
      aria-hidden="true"
      className={cn('size-8 shrink-0', className)}
      src={`${import.meta.env.BASE_URL}logo.svg`}
    />
  );
}
