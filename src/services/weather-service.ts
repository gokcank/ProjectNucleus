import { invoke } from "@tauri-apps/api/core";

export interface Place {
  name: string;
  /** State or province — what tells three Springfields apart. */
  region: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
}

export interface CurrentWeather {
  temperatureC: number;
  apparentC: number;
  humidityPercent: number;
  windKmh: number;
  /** Raw WMO code; the widget turns it into words and an icon. */
  weatherCode: number;
  isDay: boolean;
}

export function searchCities(query: string): Promise<Place[]> {
  return invoke<Place[]>("search_cities", { query });
}

export function getCurrentWeather(place: Place): Promise<CurrentWeather> {
  return invoke<CurrentWeather>("current_weather", {
    latitude: place.latitude,
    longitude: place.longitude,
  });
}

/** Guard for the stored place, which must survive a malformed settings file. */
export function isPlace(value: unknown): value is Place {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.name === "string" &&
    typeof candidate.latitude === "number" &&
    typeof candidate.longitude === "number"
  );
}

/** "Springfield, Illinois, United States", skipping whatever is missing. */
export function describePlace(place: Place): string {
  return [place.name, place.region, place.country].filter(Boolean).join(", ");
}
