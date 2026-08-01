import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Snowflake,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { usePolling } from "../../../hooks/use-polling";
import {
  describePlace,
  getCurrentWeather,
  isPlace,
  searchCities,
  type CurrentWeather,
  type Place,
} from "../../../services/weather-service";
import type { WidgetDefinition } from "../types";
import { useAsyncAction } from "../use-async-action";
import { useWidgetSetting } from "../use-widget-setting";

/** What the service itself refreshes at; asking more often returns the same numbers. */
const POLL_INTERVAL_MS = 15 * 60 * 1000;

interface Condition {
  text: string;
  /** Separate variants for the codes where the sky itself is the picture. */
  day: LucideIcon;
  night: LucideIcon;
}

/**
 * WMO weather codes, grouped to the distinctions worth a different word on a
 * small card. Intensity steps within a group (light/moderate drizzle) collapse
 * together — the temperature beside it carries more than the adjective would.
 */
const CONDITIONS: Record<number, Condition> = {
  0: { text: "Clear", day: Sun, night: Moon },
  1: { text: "Mainly clear", day: Sun, night: Moon },
  2: { text: "Partly cloudy", day: CloudSun, night: CloudMoon },
  3: { text: "Overcast", day: Cloud, night: Cloud },
  45: { text: "Fog", day: CloudFog, night: CloudFog },
  48: { text: "Freezing fog", day: CloudFog, night: CloudFog },
  51: { text: "Drizzle", day: CloudDrizzle, night: CloudDrizzle },
  53: { text: "Drizzle", day: CloudDrizzle, night: CloudDrizzle },
  55: { text: "Drizzle", day: CloudDrizzle, night: CloudDrizzle },
  56: { text: "Freezing drizzle", day: CloudDrizzle, night: CloudDrizzle },
  57: { text: "Freezing drizzle", day: CloudDrizzle, night: CloudDrizzle },
  61: { text: "Rain", day: CloudRain, night: CloudRain },
  63: { text: "Rain", day: CloudRain, night: CloudRain },
  65: { text: "Heavy rain", day: CloudRain, night: CloudRain },
  66: { text: "Freezing rain", day: CloudRain, night: CloudRain },
  67: { text: "Freezing rain", day: CloudRain, night: CloudRain },
  71: { text: "Snow", day: CloudSnow, night: CloudSnow },
  73: { text: "Snow", day: CloudSnow, night: CloudSnow },
  75: { text: "Heavy snow", day: CloudSnow, night: CloudSnow },
  77: { text: "Snow grains", day: Snowflake, night: Snowflake },
  80: { text: "Showers", day: CloudRain, night: CloudRain },
  81: { text: "Showers", day: CloudRain, night: CloudRain },
  82: { text: "Heavy showers", day: CloudRain, night: CloudRain },
  85: { text: "Snow showers", day: CloudSnow, night: CloudSnow },
  86: { text: "Snow showers", day: CloudSnow, night: CloudSnow },
  95: { text: "Thunderstorm", day: CloudLightning, night: CloudLightning },
  96: { text: "Thunderstorm", day: CloudLightning, night: CloudLightning },
  99: { text: "Hailstorm", day: CloudLightning, night: CloudLightning },
};

const UNKNOWN_CONDITION: Condition = { text: "Unknown", day: Cloud, night: Cloud };

const INPUT_CLASS =
  "w-full rounded-[10px] border border-black/10 bg-black/5 px-2 py-1.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:ring-neutral-400 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:ring-neutral-600";

function keepLatest(_previous: CurrentWeather | null, next: CurrentWeather) {
  return next;
}

/**
 * The one place the search can answer for itself, or `null` when it has to
 * ask.
 *
 * Searching a city returns its neighbours too — "Istanbul" also brings back
 * the airport and the old town — and making someone choose between those is
 * noise. But "Springfield" genuinely returns several places all called
 * Springfield, and picking one of those for them would be a guess.
 *
 * So: exactly one result actually named what was typed settles it. Several
 * with that name, or none, goes to the user.
 */
function settle(places: Place[], query: string): Place | null {
  if (places.length === 1) return places[0];

  const wanted = query.toLowerCase();
  const exact = places.filter((place) => place.name.toLowerCase() === wanted);
  return exact.length === 1 ? exact[0] : null;
}

function CityPicker({ onPick }: { onPick: (place: Place) => void }) {
  const [draft, setDraft] = useState("");
  const [searched, setSearched] = useState(false);
  const { result: matches, busy, error, run } = useAsyncAction<Place[]>();

  const search = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setSearched(true);
    run(
      () => searchCities(trimmed),
      { logPrefix: "City search failed:", message: "Couldn't reach the city list." },
      // Done here rather than while rendering, which must stay free of
      // side effects.
      (places) => {
        const settled = settle(places, trimmed);
        if (settled) onPick(settled);
      },
    );
  };

  const showNoMatch = searched && !busy && !error && matches?.length === 0;
  // Whatever `settle` did not resolve on its own is put to the user.
  const choices = matches && !settle(matches, draft.trim()) ? matches : [];

  return (
    <div className="mt-2">
      <input
        type="text"
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value);
          setSearched(false);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") search();
        }}
        placeholder="Enter a city…"
        aria-label="Search for a city"
        className={INPUT_CLASS}
      />

      {busy && <p className="mt-1.5 text-[11px] text-neutral-500">Searching…</p>}
      {error && <p className="mt-1.5 text-[11px] text-red-600 dark:text-red-400">{error}</p>}
      {showNoMatch && (
        <p className="mt-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">No city found.</p>
      )}

      {choices.length > 0 && (
        <ul className="mt-2 space-y-1">
          {choices.map((place) => (
            <li key={`${place.latitude},${place.longitude}`}>
              <button
                type="button"
                onClick={() => onPick(place)}
                className="w-full truncate rounded-[10px] bg-black/5 px-2 py-1.5 text-left text-sm text-neutral-900 hover:bg-black/10 dark:bg-white/5 dark:text-neutral-100 dark:hover:bg-white/10"
              >
                {describePlace(place)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Mounted per city (keyed on its coordinates by the caller), so switching
 * cities restarts the poll against the new place instead of leaving the old
 * one running.
 */
function Reading({ place, wide }: { place: Place; wide: boolean }) {
  const fetcher = useMemo(() => () => getCurrentWeather(place), [place]);
  const [weather] = usePolling<CurrentWeather, CurrentWeather | null>(
    fetcher,
    POLL_INTERVAL_MS,
    "Weather",
    keepLatest,
    null,
  );

  // Nothing yet, or the network was down on the first try. Either way the last
  // known reading stays on screen once there is one -- `usePolling` keeps it.
  if (!weather) {
    return <p className="text-sm text-neutral-500 dark:text-neutral-400">Reading weather…</p>;
  }

  const condition = CONDITIONS[weather.weatherCode] ?? UNKNOWN_CONDITION;
  const Icon = weather.isDay ? condition.day : condition.night;

  return (
    <>
      <div className="flex items-center gap-2">
        <Icon
          className="h-6 w-6 shrink-0 text-neutral-600 dark:text-neutral-300"
          strokeWidth={1.75}
          aria-hidden
        />
        <span className="min-w-0 flex-1 truncate text-sm text-neutral-600 dark:text-neutral-300">
          {condition.text}
        </span>
        <span className="shrink-0 text-xl tabular-nums text-neutral-900 dark:text-neutral-100">
          {Math.round(weather.temperatureC)}°
        </span>
      </div>

      {wide && (
        <p className="mt-1 text-xs tabular-nums text-neutral-500 dark:text-neutral-400">
          Feels {Math.round(weather.apparentC)}° · {weather.humidityPercent}% humidity ·{" "}
          {Math.round(weather.windKmh)} km/h wind
        </p>
      )}
    </>
  );
}

function WeatherContent({ wide }: { wide: boolean }) {
  const [place, setPlace] = useWidgetSetting<Place | null>("weather", "place", null, isPlace);
  const [changing, setChanging] = useState(false);

  if (!place || changing) {
    return (
      <CityPicker
        onPick={(chosen) => {
          setPlace(chosen);
          setChanging(false);
        }}
      />
    );
  }

  return (
    <div className="mt-2">
      <Reading key={`${place.latitude},${place.longitude}`} place={place} wide={wide} />
      <button
        type="button"
        onClick={() => setChanging(true)}
        title="Choose a different city"
        className="mt-0.5 max-w-full truncate text-xs text-neutral-500 underline-offset-2 hover:underline dark:text-neutral-400"
      >
        {describePlace(place)}
      </button>
    </div>
  );
}

export const weatherWidget: WidgetDefinition = {
  id: "weather",
  title: "Weather",
  keywords: ["forecast", "temperature", "rain", "city"],
  icon: CloudSun,
  component: WeatherContent,
};
