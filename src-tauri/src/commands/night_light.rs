use std::process::Command;

use serde::Serialize;

const SCHEMA: &str = "org.gnome.settings-daemon.plugins.color";
const KEY_ENABLED: &str = "night-light-enabled";
const KEY_TEMPERATURE: &str = "night-light-temperature";

/// The range GNOME's own Settings panel offers. The schema itself accepts any
/// u32, so clamping here keeps us to values the desktop actually renders.
const MIN_TEMPERATURE: u32 = 1700;
const MAX_TEMPERATURE: u32 = 4700;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NightLightStatus {
    /// False when the GNOME colour schema is not installed, which the UI
    /// reports as unsupported rather than as an error.
    supported: bool,
    enabled: bool,
    temperature: u32,
}

/// Runs `gsettings` with arguments this module builds itself — nothing from the
/// frontend is passed through as free-form text.
fn gsettings(args: &[&str]) -> Result<String, String> {
    let output = Command::new("gsettings")
        .args(args)
        .output()
        .map_err(|err| format!("gsettings unavailable: {err}"))?;

    if !output.status.success() {
        let detail = String::from_utf8_lossy(&output.stderr);
        return Err(format!("gsettings failed: {}", detail.trim()));
    }

    String::from_utf8(output.stdout)
        .map_err(|err| format!("gsettings returned invalid output: {err}"))
}

/// `gsettings get` prints GVariant literals: `true`, `false`, `uint32 2700`.
fn parse_bool(raw: &str) -> bool {
    raw.trim() == "true"
}

fn parse_temperature(raw: &str) -> Option<u32> {
    raw.trim()
        .strip_prefix("uint32")
        .unwrap_or(raw.trim())
        .trim()
        .parse()
        .ok()
}

#[tauri::command]
pub fn night_light_status() -> Result<NightLightStatus, String> {
    let Ok(enabled_raw) = gsettings(&["get", SCHEMA, KEY_ENABLED]) else {
        return Ok(NightLightStatus {
            supported: false,
            enabled: false,
            temperature: MIN_TEMPERATURE,
        });
    };

    let temperature = gsettings(&["get", SCHEMA, KEY_TEMPERATURE])
        .ok()
        .and_then(|raw| parse_temperature(&raw))
        .unwrap_or(MIN_TEMPERATURE);

    Ok(NightLightStatus {
        supported: true,
        enabled: parse_bool(&enabled_raw),
        temperature,
    })
}

#[tauri::command]
pub fn set_night_light_enabled(enabled: bool) -> Result<NightLightStatus, String> {
    let value = if enabled { "true" } else { "false" };
    gsettings(&["set", SCHEMA, KEY_ENABLED, value])?;
    night_light_status()
}

#[tauri::command]
pub fn set_night_light_temperature(kelvin: u32) -> Result<NightLightStatus, String> {
    let clamped = kelvin.clamp(MIN_TEMPERATURE, MAX_TEMPERATURE);
    gsettings(&["set", SCHEMA, KEY_TEMPERATURE, &clamped.to_string()])?;
    night_light_status()
}

#[cfg(test)]
mod tests {
    use super::{parse_bool, parse_temperature};

    #[test]
    fn reads_boolean_literals() {
        assert!(parse_bool("true\n"));
        assert!(!parse_bool("false\n"));
    }

    #[test]
    fn reads_a_uint32_literal() {
        assert_eq!(parse_temperature("uint32 2700\n"), Some(2700));
    }

    #[test]
    fn reads_a_bare_number() {
        assert_eq!(parse_temperature("3400\n"), Some(3400));
    }

    #[test]
    fn rejects_unreadable_temperature() {
        assert_eq!(parse_temperature("nonsense"), None);
    }
}
