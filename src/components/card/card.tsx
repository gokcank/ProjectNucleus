import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface CardProps {
  icon: LucideIcon;
  title: string;
  actions?: ReactNode;
  /** Puts content in the header row instead of below it, for single-line widgets. */
  inline?: boolean;
  /**
   * Card is only a quarter of the dashboard wide. It drops the header icon and
   * tightens its padding there: at full padding, icon plus title plus actions
   * leave the title a few pixels and nothing but a truncated fragment shows.
   */
  narrow?: boolean;
  children: ReactNode;
}

export function Card({ icon: Icon, title, actions, inline, narrow, children }: CardProps) {
  return (
    <section
      className={`overflow-hidden rounded-[18px] border border-black/10 bg-black/[0.03] dark:border-white/10 dark:bg-white/[0.03] ${
        inline ? "p-2.5" : narrow ? "h-full p-2.5" : "h-full p-4"
      }`}
    >
      <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
        {narrow ? null : <Icon className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />}
        {/* Inline cards keep the title at its natural width so the content next
            to it gets the leftover room; elsewhere the title takes the row and
            truncates rather than pushing the actions out of the card. */}
        <span className={`text-xs font-medium ${inline ? "shrink-0" : "min-w-0 flex-1 truncate"}`}>
          {title}
        </span>
        {inline ? <div className="flex flex-1 items-center gap-2">{children}</div> : null}
        {actions ? <div className="flex shrink-0 items-center gap-1">{actions}</div> : null}
      </div>
      {inline ? null : children}
    </section>
  );
}
