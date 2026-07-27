import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface CardProps {
  icon: LucideIcon;
  title: string;
  actions?: ReactNode;
  /** Puts content in the header row instead of below it, for single-line widgets. */
  inline?: boolean;
  children: ReactNode;
}

export function Card({ icon: Icon, title, actions, inline, children }: CardProps) {
  return (
    <section
      className={`rounded-[18px] border border-black/10 bg-black/[0.03] dark:border-white/10 dark:bg-white/[0.03] ${
        inline ? "p-2.5" : "h-full p-4"
      }`}
    >
      <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
        <Icon className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
        <span className="shrink-0 text-xs font-medium">{title}</span>
        {inline ? <div className="flex flex-1 items-center">{children}</div> : null}
        {actions ? (
          <div className={`flex shrink-0 items-center gap-1 ${inline ? "" : "ml-auto"}`}>
            {actions}
          </div>
        ) : null}
      </div>
      {inline ? null : children}
    </section>
  );
}
