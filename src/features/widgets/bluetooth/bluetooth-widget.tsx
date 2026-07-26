import { Bluetooth, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  getBluetoothStatus,
  setBluetoothPowered,
  setDeviceConnected,
  type BluetoothStatus,
} from "../../../services/bluetooth-service";
import { logWarn } from "../../../services/logger-service";
import type { WidgetDefinition } from "../types";

function BluetoothContent() {
  const [status, setStatus] = useState<BluetoothStatus | null>(null);
  const [failed, setFailed] = useState(false);
  /** Address of the device currently connecting or disconnecting, if any. */
  const [busyAddress, setBusyAddress] = useState<string | null>(null);

  // Read on mount and whenever the panel becomes visible. Not polled: devices
  // only change when someone acts on them, and each read is a D-Bus round trip.
  useEffect(() => {
    let cancelled = false;

    const refresh = () => {
      if (document.hidden) return;
      getBluetoothStatus()
        .then((next) => {
          if (!cancelled) setStatus(next);
        })
        .catch((err: unknown) => {
          logWarn(`Bluetooth unavailable: ${String(err)}`);
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
    setBluetoothPowered(!status.powered)
      .then(setStatus)
      .catch((err: unknown) => {
        logWarn(`Could not change Bluetooth power: ${String(err)}`);
        setFailed(true);
      });
  };

  const toggleDevice = (address: string, connected: boolean) => {
    setBusyAddress(address);
    setDeviceConnected(address, !connected)
      .then(setStatus)
      .catch((err: unknown) => {
        logWarn(`Could not change device connection: ${String(err)}`);
      })
      .finally(() => setBusyAddress(null));
  };

  if (failed) {
    return (
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        Bluetooth control unavailable.
      </p>
    );
  }

  if (!status) {
    return (
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">Reading Bluetooth...</p>
    );
  }

  if (!status.available) {
    return (
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">No Bluetooth adapter.</p>
    );
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={togglePower}
        aria-pressed={status.powered}
        className={`flex h-10 w-full items-center justify-center gap-2 rounded-[10px] text-sm font-medium ${
          status.powered
            ? "bg-neutral-900 text-neutral-100 hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
            : "bg-black/5 text-neutral-900 hover:bg-black/10 dark:bg-white/5 dark:text-neutral-100 dark:hover:bg-white/10"
        }`}
      >
        <Bluetooth size={16} />
        {status.powered ? "On" : "Off"}
      </button>

      {status.powered && status.devices.length === 0 && (
        <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">No paired devices.</p>
      )}

      {status.powered && status.devices.length > 0 && (
        <ul className="mt-2 space-y-1">
          {status.devices.map((device) => (
            <li key={device.address}>
              <button
                type="button"
                onClick={() => toggleDevice(device.address, device.connected)}
                disabled={busyAddress !== null}
                title={device.address}
                className="flex w-full items-center gap-2 rounded-[10px] bg-black/5 px-2 py-1.5 text-left text-sm text-neutral-900 hover:bg-black/10 disabled:opacity-50 dark:bg-white/5 dark:text-neutral-100 dark:hover:bg-white/10"
              >
                <span className="min-w-0 flex-1 truncate">{device.name}</span>
                {busyAddress === device.address ? (
                  <Loader2
                    size={14}
                    className="shrink-0 animate-spin text-neutral-500 dark:text-neutral-400"
                  />
                ) : (
                  <span className="shrink-0 text-xs text-neutral-500 dark:text-neutral-400">
                    {device.connected ? "Connected" : "Connect"}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export const bluetoothWidget: WidgetDefinition = {
  id: "bluetooth",
  title: "Bluetooth",
  icon: Bluetooth,
  defaultWide: true,
  component: BluetoothContent,
};
