import { cn } from '../lib/utils';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  children?: React.ReactNode;
}

export function SectionHeader({ title, subtitle, className, children }: SectionHeaderProps) {
  return (
    <div className={cn("flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6", className)}>
      <div>
        <h2 className="text-2xl font-black tracking-tighter text-zinc-900 dark:text-white leading-none">
          {title}
        </h2>
        {subtitle && (
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-2">
            {subtitle}
          </p>
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
