use std::process::Command;

use serde::Serialize;

/// WirePlumber's alias for whatever the user's current output device is, so we
/// never have to track device IDs ourselves.
const DEFAULT_SINK: &str = "@DEFAULT_AUDIO_SINK@";

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VolumeStatus {
    percent: u8,
    muted: bool,
}

/// Runs `wpctl` with a fixed set of arguments. Every argument is produced by
/// this module — nothing from the frontend reaches the process untouched.
fn wpctl(args: &[&str]) -> Result<String, String> {
    let output = Command::new("wpctl")
        .args(args)
        .output()
        .map_err(|err| format!("wpctl unavailable: {err}"))?;

    if !output.status.success() {
        let detail = String::from_utf8_lossy(&output.stderr);
        return Err(format!("wpctl failed: {}", detail.trim()));
    }

    String::from_utf8(output.stdout).map_err(|err| format!("wpctl returned invalid output: {err}"))
}

/// Parses WirePlumber's `Volume: 0.52` / `Volume: 0.52 [MUTED]` output.
fn parse_volume(raw: &str) -> Result<VolumeStatus, String> {
    let rest = raw
        .trim()
        .strip_prefix("Volume:")
        .ok_or("Unexpected wpctl volume output")?;

    let muted = rest.contains("[MUTED]");

    let fraction: f32 = rest
        .split_whitespace()
        .next()
        .ok_or("Missing volume value")?
        .parse()
        .map_err(|_| "Unreadable volume value".to_owned())?;

    // WirePlumber allows boosting above 1.0; clamp so the UI always shows 0-100.
    let percent = (fraction * 100.0).round().clamp(0.0, 100.0) as u8;

    Ok(VolumeStatus { percent, muted })
}

#[tauri::command]
pub fn volume_status() -> Result<VolumeStatus, String> {
    parse_volume(&wpctl(&["get-volume", DEFAULT_SINK])?)
}

#[tauri::command]
pub fn set_volume(percent: u8) -> Result<VolumeStatus, String> {
    let clamped = percent.min(100);
    let fraction = format!("{:.2}", f32::from(clamped) / 100.0);
    wpctl(&["set-volume", DEFAULT_SINK, &fraction])?;
    volume_status()
}

#[tauri::command]
pub fn toggle_mute() -> Result<VolumeStatus, String> {
    wpctl(&["set-mute", DEFAULT_SINK, "toggle"])?;
    volume_status()
}

#[cfg(test)]
mod tests {
    use super::parse_volume;

    #[test]
    fn reads_an_unmuted_volume() {
        let status = parse_volume("Volume: 0.52").unwrap();
        assert_eq!(status.percent, 52);
        assert!(!status.muted);
    }

    #[test]
    fn reads_a_muted_volume() {
        let status = parse_volume("Volume: 0.52 [MUTED]").unwrap();
        assert_eq!(status.percent, 52);
        assert!(status.muted);
    }

    #[test]
    fn clamps_boosted_volume_to_one_hundred() {
        assert_eq!(parse_volume("Volume: 1.40").unwrap().percent, 100);
    }

    #[test]
    fn rejects_unexpected_output() {
        assert!(parse_volume("something else").is_err());
    }
}
