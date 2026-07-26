import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useTheme } from "../../hooks/use-theme";
import type { WidgetLayoutEntry, DashboardLayout } from "../dashboard/use-dashboard-layout";
import { getWidget, type WidgetDefinition } from "../widgets";

const THEMES = ["light", "dark", "system"] as const;

interface SettingsProps {
  layout: DashboardLayout;
  onClose: () => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h2 className="mb-2 text-xs font-semibold tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function Settings({ layout, onClose }: SettingsProps) {
  const { theme, setTheme } = useTheme();

  const widgets = layout.layout
    .map((entry) => ({ entry, definition: getWidget(entry.id) }))
    .filter(
      (item): item is { entry: WidgetLayoutEntry; definition: WidgetDefinition } =>
        item.definition !== undefined,
    );

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2 border-b border-black/5 px-4 py-3 dark:border-white/5">
        <button
          type="button"
          onClick={onClose}
          aria-label="Back to dashboard"
          className="flex h-8 w-8 items-center justify-center rounded-[10px] text-neutral-600 hover:bg-black/5 dark:text-neutral-300 dark:hover:bg-white/5"
        >
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Settings</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <Section title="Appearance">
          <div className="flex gap-2">
            {THEMES.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setTheme(option)}
                aria-pressed={theme === option}
                className={`h-10 flex-1 rounded-[10px] text-sm font-medium capitalize transition-colors ${
                  theme === option
                    ? "bg-neutral-900 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
                    : "bg-black/5 text-neutral-900 hover:bg-black/10 dark:bg-white/5 dark:text-neutral-100 dark:hover:bg-white/10"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Widgets">
          <ul className="space-y-1">
            {widgets.map(({ entry, definition }) => {
              const Icon = definition.icon;
              return (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => layout.toggleHidden(entry.id)}
                    aria-pressed={!entry.hidden}
                    className="flex w-full items-center gap-2 rounded-[10px] bg-black/5 px-2 py-2 text-left text-sm hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
                  >
                    <Icon
                      size={16}
                      className={
                        entry.hidden
                          ? "shrink-0 text-neutral-400 dark:text-neutral-600"
                          : "shrink-0 text-neutral-700 dark:text-neutral-200"
                      }
                    />
                    <span
                      className={`min-w-0 flex-1 truncate ${
                        entry.hidden
                          ? "text-neutral-400 dark:text-neutral-500"
                          : "text-neutral-900 dark:text-neutral-100"
                      }`}
                    >
                      {definition.title}
                    </span>
                    {entry.hidden ? (
                      <EyeOff
                        size={14}
                        className="shrink-0 text-neutral-400 dark:text-neutral-600"
                      />
                    ) : (
                      <Eye size={14} className="shrink-0 text-neutral-500 dark:text-neutral-400" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
            Hidden widgets keep their place and size on the dashboard.
          </p>
        </Section>
      </div>
    </div>
  );
}
