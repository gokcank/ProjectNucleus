import { Loader2, Wifi, WifiHigh, WifiLow, WifiZero, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { logWarn } from "../../../services/logger-service";
import {
  connectWifi,
  getWifiStatus,
  setWifiEnabled,
  type WifiStatus,
} from "../../../services/wifi-service";
import type { WidgetDefinition } from "../types";

/** Four steps, matching the four Wi-Fi glyphs Lucide provides. */
function signalIcon(strength: number): LucideIcon {
  if (strength >= 75) return Wifi;
  if (strength >= 50) return WifiHigh;
  if (strength >= 25) return WifiLow;
  return WifiZero;
}

function WifiContent() {
  const [status, setStatus] = useState<WifiStatus | null>(null);
  const [failed, setFailed] = useState(false);
  /** SSID currently being joined, if any. */
  const [busySsid, setBusySsid] = useState<string | null>(null);

  // Read on mount and whenever the panel becomes visible. Not polled: a scan
  // is expensive, and the list only matters while someone is looking at it.
  useEffect(() => {
    let cancelled = false;

    const refresh = () => {
      if (document.hidden) return;
      getWifiStatus()
        .then((next) => {
          if (!cancelled) setStatus(next);
        })
        .catch((err: unknown) => {
          logWarn(`Wi-Fi unavailable: ${String(err)}`);
          if (!cancelled) setFailed(true);
        });
    };

    refresh();
    document.addEventListener("visibilitychange", refresh);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  const togglePower = () => {
    if (!status) return;
    setWifiEnabled(!status.enabled)
      .then(setStatus)
      .catch((err: unknown) => {
        logWarn(`Could not switch Wi-Fi: ${String(err)}`);
        setFailed(true);
      });
  };

  const join = (ssid: string) => {
    setBusySsid(ssid);
    connectWifi(ssid)
      .then(setStatus)
      .catch((err: unknown) => {
        logWarn(`Could not join network: ${String(err)}`);
      })
      .finally(() => setBusySsid(null));
  };

  if (failed) {
    return (
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        Wi-Fi control unavailable.
      </p>
    );
  }

  if (!status) {
    return <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">Reading Wi-Fi...</p>;
  }

  if (!status.supported) {
    return (
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">No wireless device.</p>
    );
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={togglePower}
        aria-pressed={status.enabled}
        className={`flex h-10 w-full items-center justify-center gap-2 rounded-[10px] text-sm font-medium ${
          status.enabled
            ? "bg-neutral-900 text-neutral-100 hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
            : "bg-black/5 text-neutral-900 hover:bg-black/10 dark:bg-white/5 dark:text-neutral-100 dark:hover:bg-white/10"
        }`}
      >
        <Wifi size={16} />
        {status.enabled ? "On" : "Off"}
      </button>

      {status.enabled && status.networks.length === 0 && (
        <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">No networks in range.</p>
      )}

      {status.enabled && status.networks.length > 0 && (
        <ul className="mt-2 space-y-1">
          {status.networks.map((network) => {
            const Icon = signalIcon(network.strength);
            // Only saved networks can be joined from here -- entering a
            // password is deliberately not part of this card, so an unknown
            // network is listed for reference but not offered as an action.
            const joinable = network.saved && !network.active;

            return (
              <li key={network.ssid}>
                <button
                  type="button"
                  onClick={() => join(network.ssid)}
                  disabled={!joinable || busySsid !== null}
                  title={
                    network.saved ? undefined : "Not saved — join it from system settings once"
                  }
                  // Dimmed only when there are no credentials for it, so an
                  // unreachable row reads as unreachable. The connected row is
                  // non-interactive too, but it is the one worth seeing most.
                  className={`flex w-full items-center gap-2 rounded-[10px] bg-black/5 px-2 py-1.5 text-left text-sm text-neutral-900 enabled:hover:bg-black/10 disabled:cursor-default dark:bg-white/5 dark:text-neutral-100 dark:enabled:hover:bg-white/10 ${
                    network.saved ? "" : "opacity-55"
                  }`}
                >
                  <Icon size={14} className="shrink-0 text-neutral-500 dark:text-neutral-400" />
                  <span className="min-w-0 flex-1 truncate">{network.ssid}</span>
                  {busySsid === network.ssid ? (
                    <Loader2
                      size={14}
                      className="shrink-0 animate-spin text-neutral-500 dark:text-neutral-400"
                    />
                  ) : (
                    <span className="shrink-0 text-xs text-neutral-500 dark:text-neutral-400">
                      {network.active ? "Connected" : network.saved ? "Connect" : "Not saved"}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export const wifiWidget: WidgetDefinition = {
  id: "wifi",
  title: "Wi-Fi",
  // Nobody types the hyphen, and "wifi" doesn't match "Wi-Fi" on its own.
  keywords: ["wifi", "wireless"],
  icon: Wifi,
  defaultWide: true,
  component: WifiContent,
};
