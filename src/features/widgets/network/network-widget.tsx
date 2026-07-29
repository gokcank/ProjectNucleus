import { Cable, Globe, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { logWarn } from "../../../services/logger-service";
import {
  getNetworkStatus,
  getPublicIp,
  type NetworkStatus,
} from "../../../services/network-service";
import type { WidgetDefinition } from "../types";
import { useAsyncAction } from "../use-async-action";

/** Icon and headline for each connection type the backend reports. */
function describe(status: NetworkStatus | null) {
  if (!status) return { Icon: Globe, label: "…" };
  if (!status.connected) return { Icon: WifiOff, label: "Offline" };
  switch (status.connectionType) {
    case "wifi":
      return { Icon: Wifi, label: status.ssid ?? "Wi-Fi" };
    case "ethernet":
      return { Icon: Cable, label: "Ethernet" };
    default:
      return { Icon: Globe, label: "Connected" };
  }
}

function NetworkContent() {
  const [status, setStatus] = useState<NetworkStatus | null>(null);
  const { result: publicIp, busy: fetchingIp, error: ipError, run } = useAsyncAction<string>();

  // Reads once on mount and again whenever the panel becomes visible.
  // Deliberately not polled: this is a D-Bus read of state that only changes
  // when the user's connection does, and the panel is short-lived anyway.
  useEffect(() => {
    let cancelled = false;

    const refresh = () => {
      if (document.hidden) return;
      getNetworkStatus()
        .then((next) => {
          if (!cancelled) setStatus(next);
        })
        .catch((err: unknown) => {
          logWarn(`Network status unavailable: ${String(err)}`);
        });
    };

    refresh();
    document.addEventListener("visibilitychange", refresh);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  const lookUpPublicIp = () => {
    run(getPublicIp, {
      logPrefix: "Public IP lookup failed:",
      message: "Couldn't reach the address service.",
    });
  };

  // Fetched once on mount rather than on every refresh: unlike the rest of this
  // card, each lookup is a real request leaving the machine, so repeating it is
  // the user's call via the button below.
  useEffect(lookUpPublicIp, []); // eslint-disable-line react-hooks/exhaustive-deps -- once on mount

  const { Icon, label } = describe(status);

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-neutral-500 dark:text-neutral-400" aria-hidden />
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {label}
        </span>
      </div>

      <dl className="mt-2 space-y-1 text-xs">
        <div className="flex items-baseline gap-2">
          <dt className="w-12 shrink-0 text-neutral-500 dark:text-neutral-400">Local</dt>
          <dd className="min-w-0 flex-1 truncate tabular-nums text-neutral-700 dark:text-neutral-200">
            {status?.localIp ?? "—"}
          </dd>
        </div>
        <div className="flex items-baseline gap-2">
          <dt className="w-12 shrink-0 text-neutral-500 dark:text-neutral-400">Public</dt>
          <dd className="min-w-0 flex-1 truncate tabular-nums text-neutral-700 dark:text-neutral-200">
            {publicIp ?? (fetchingIp ? "…" : "—")}
          </dd>
          <button
            type="button"
            onClick={lookUpPublicIp}
            disabled={fetchingIp}
            aria-label="Look up public address again"
            title="Check again"
            className="shrink-0 rounded-md p-1 text-neutral-400 hover:bg-black/5 hover:text-neutral-600 disabled:opacity-40 dark:hover:bg-white/5 dark:hover:text-neutral-300"
          >
            <RefreshCw size={12} className={fetchingIp ? "animate-spin" : undefined} />
          </button>
        </div>
      </dl>

      {ipError && <p className="mt-1.5 text-[11px] text-red-600 dark:text-red-400">{ipError}</p>}
    </div>
  );
}

export const networkWidget: WidgetDefinition = {
  id: "network",
  title: "Network",
  keywords: ["ip", "wifi", "ethernet", "address", "connection"],
  icon: Wifi,
  component: NetworkContent,
};
