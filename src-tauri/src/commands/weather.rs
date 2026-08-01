use std::process::Command;

use serde::{Deserialize, Serialize};

/// Open-Meteo needs no account and no key, which is the whole reason it was
/// chosen: nothing about this card belongs in `local.properties`.
const GEOCODING_ENDPOINT: &str = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_ENDPOINT: &str = "https://api.open-meteo.com/v1/forecast";

const REQUEST_TIMEOUT_SECS: &str = "8";

/// A city name long enough to be real but short enough that nothing
/// interesting can be smuggled inside it.
const MAX_QUERY_LEN: usize = 80;

/// Enough to tell three Springfields apart without turning the card into a
/// search results page.
const MAX_RESULTS: usize = 4;

/// Everything else is percent-encoded. Keeping the set this small is the
/// point: the query is the one part of the address that comes from typing,
/// so it is not allowed to contribute an `&`, an `=`, or a `?` to it.
fn is_unreserved(byte: u8) -> bool {
    byte.is_ascii_alphanumeric() || matches!(byte, b'-' | b'.' | b'_' | b'~')
}

fn percent_encode(value: &str) -> String {
    let mut encoded = String::with_capacity(value.len());
    for byte in value.as_bytes() {
        if is_unreserved(*byte) {
            encoded.push(*byte as char);
        } else {
            encoded.push_str(&format!("%{byte:02X}"));
        }
    }
    encoded
}

/// The same shape as the Network card's public address lookup: a fixed set of
/// arguments handed straight to the process, never to a shell, so there is no
/// command for user input to break out into.
fn fetch(url: &str) -> Result<String, String> {
    let output = Command::new("curl")
        .args([
            "--silent",
            "--show-error",
            "--max-time",
            REQUEST_TIMEOUT_SECS,
            "--url",
            url,
        ])
        .output()
        .map_err(|err| format!("curl unavailable: {err}"))?;

    if !output.status.success() {
        let detail = String::from_utf8_lossy(&output.stderr);
        return Err(format!(
            "Could not reach the weather service: {}",
            detail.trim()
        ));
    }

    String::from_utf8(output.stdout)
        .map_err(|err| format!("Weather service returned invalid output: {err}"))
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Place {
    name: String,
    /// State or province. Present for most places, and the only thing telling
    /// the three Springfields apart.
    region: Option<String>,
    country: Option<String>,
    latitude: f64,
    longitude: f64,
}

#[derive(Deserialize)]
struct GeocodingResult {
    name: String,
    latitude: f64,
    longitude: f64,
    country: Option<String>,
    admin1: Option<String>,
}

/// A search that matches nothing comes back without the `results` key at all
/// rather than with an empty list, so this stays optional.
#[derive(Deserialize)]
struct GeocodingResponse {
    results: Option<Vec<GeocodingResult>>,
}

#[tauri::command]
pub fn search_cities(query: String) -> Result<Vec<Place>, String> {
    let trimmed = query.trim();
    if trimmed.is_empty() {
        return Ok(Vec::new());
    }
    if trimmed.chars().count() > MAX_QUERY_LEN {
        return Err("That name is too long to look up".to_owned());
    }

    let url = format!(
        "{GEOCODING_ENDPOINT}?name={}&count={MAX_RESULTS}&language=en&format=json",
        percent_encode(trimmed)
    );
    let body = fetch(&url)?;

    let response: GeocodingResponse = serde_json::from_str(&body)
        .map_err(|err| format!("Could not read the city list: {err}"))?;

    Ok(response
        .results
        .unwrap_or_default()
        .into_iter()
        .map(|result| Place {
            name: result.name,
            region: result.admin1,
            country: result.country,
            latitude: result.latitude,
            longitude: result.longitude,
        })
        .collect())
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CurrentWeather {
    temperature_c: f64,
    apparent_c: f64,
    humidity_percent: u8,
    wind_kmh: f64,
    /// WMO code. Left raw so the one place that turns it into words and an
    /// icon is the card itself.
    weather_code: u8,
    /// Reported by the service rather than guessed from the clock, which
    /// would be wrong near sunrise and at high latitudes.
    is_day: bool,
}

#[derive(Deserialize)]
struct CurrentBlock {
    temperature_2m: f64,
    apparent_temperature: f64,
    relative_humidity_2m: u8,
    weather_code: u8,
    wind_speed_10m: f64,
    is_day: u8,
}

#[derive(Deserialize)]
struct ForecastResponse {
    current: CurrentBlock,
}

#[tauri::command]
pub fn current_weather(latitude: f64, longitude: f64) -> Result<CurrentWeather, String> {
    if !(-90.0..=90.0).contains(&latitude) || !(-180.0..=180.0).contains(&longitude) {
        return Err("That location is not on the map".to_owned());
    }

    let url = format!(
        "{FORECAST_ENDPOINT}?latitude={latitude}&longitude={longitude}\
         &current=temperature_2m,apparent_temperature,relative_humidity_2m,\
weather_code,wind_speed_10m,is_day&timezone=auto"
    );
    let body = fetch(&url)?;

    let response: ForecastResponse =
        serde_json::from_str(&body).map_err(|err| format!("Could not read the weather: {err}"))?;
    let current = response.current;

    Ok(CurrentWeather {
        temperature_c: current.temperature_2m,
        apparent_c: current.apparent_temperature,
        humidity_percent: current.relative_humidity_2m,
        wind_kmh: current.wind_speed_10m,
        weather_code: current.weather_code,
        is_day: current.is_day == 1,
    })
}
