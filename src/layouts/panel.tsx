import type { ReactNode } from "react";

export function Panel({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen w-screen p-6">
      <div className="panel-enter h-full w-full overflow-hidden rounded-3xl border border-black/10 bg-white/95 shadow-xl dark:border-white/10 dark:bg-neutral-900/95">
        {children}
      </div>
    </div>
  );
}
