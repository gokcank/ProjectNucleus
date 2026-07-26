import { useTheme } from "./hooks/use-theme";

const THEMES = ["light", "dark", "system"] as const;

function App() {
  const { theme, setTheme } = useTheme();

  return (
    <main className="flex h-screen items-center justify-center bg-neutral-100 dark:bg-neutral-900">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          Project Nucleus
        </h1>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">Foundation — Phase 0</p>
        <div className="mt-6 flex justify-center gap-2">
          {THEMES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setTheme(option)}
              className={`rounded-lg px-3 py-1.5 text-sm capitalize transition-colors ${
                theme === option
                  ? "bg-neutral-900 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
                  : "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}

export default App;
