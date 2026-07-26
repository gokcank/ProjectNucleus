import { useState } from "react";
import { Dashboard } from "./features/dashboard/dashboard";
import { useDashboardLayout } from "./features/dashboard/use-dashboard-layout";
import { Settings } from "./features/settings/settings";
import { Panel } from "./layouts/panel";

function App() {
  const [showSettings, setShowSettings] = useState(false);
  // Owned here so both views act on the same layout, and so switching views
  // never rebuilds the dashboard -- a running timer must not reset because
  // someone opened Settings.
  const layout = useDashboardLayout();

  // From Settings, Escape steps back to the dashboard rather than dismissing
  // the whole panel.
  const handleEscape = () => {
    if (!showSettings) return false;
    setShowSettings(false);
    return true;
  };

  return (
    <Panel onEscape={handleEscape}>
      <div className={showSettings ? "hidden" : "h-full"}>
        <Dashboard layout={layout} onOpenSettings={() => setShowSettings(true)} />
      </div>
      {showSettings && <Settings layout={layout} onClose={() => setShowSettings(false)} />}
    </Panel>
  );
}

export default App;
