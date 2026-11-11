import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  children?: React.ReactNode;
}

export function SectionHeader({ title, subtitle, className, children }: SectionHeaderProps) {
  return (
    <div className={cn('mb-1 flex flex-col justify-between gap-3 md:flex-row md:items-end', className)}>
      <div className="min-w-0 space-y-1">
        <h2 className="text-xl font-black leading-tight tracking-tight text-zinc-900 dark:text-white md:text-2xl">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">{subtitle}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-3">
          {children}
        </div>
      )}
    </div>
  );
}
