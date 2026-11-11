import { cn } from '@/lib/utils';
import { questUi } from '@/lib/quest-ui';
import type { ReactNode } from 'react';

export function QuestEmpty({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn(questUi.empty, className)}>{children}</div>;
}
