import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface CardProps {
  icon: LucideIcon;
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function Card({ icon: Icon, title, actions, children }: CardProps) {
  return (
    <section className="h-full rounded-[18px] border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
        <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
        <span className="text-xs font-medium">{title}</span>
        {actions ? <div className="ml-auto flex items-center gap-1">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}
