use std::time::Duration;

use ashpd::desktop::settings::{ColorScheme, Settings};
use futures_util::StreamExt;
use serde::Serialize;
use tauri::{AppHandle, Emitter};

/// Event the frontend listens for; payload is the same shape as `color_scheme`'s result.
const COLOR_SCHEME_CHANGED_EVENT: &str = "color-scheme-changed";

/// Upper bound on how long startup may wait for the portal's first answer.
/// Comfortably above a normal D-Bus round trip (a few ms) yet far enough below
/// the 1s startup budget in PRODUCT.md that a hung portal cannot hold the panel
/// hostage -- we fall back to no injected value and the frontend guesses.
const STARTUP_READ_TIMEOUT: Duration = Duration::from_millis(400);

#[derive(Serialize, Clone, Copy)]
#[serde(rename_all = "kebab-case")]
pub enum ColorSchemeStatus {
    Dark,
    Light,
    NoPreference,
}

impl From<ColorScheme> for ColorSchemeStatus {
    fn from(scheme: ColorScheme) -> Self {
        match scheme {
            ColorScheme::PreferDark => Self::Dark,
            ColorScheme::PreferLight => Self::Light,
            ColorScheme::NoPreference => Self::NoPreference,
        }
    }
}

/// The desktop's preferred color scheme, via the XDG Settings portal
/// (`org.freedesktop.portal.Settings`) rather than the WebView's own
/// `prefers-color-scheme` guess -- WebKitGTK does not reliably read GNOME's
/// actual setting, nor update it live when the user changes it while the app
/// is running. This is the same portal GTK4/libadwaita apps read internally.
#[tauri::command]
pub async fn color_scheme() -> Result<ColorSchemeStatus, String> {
    read_color_scheme().await
}

async fn read_color_scheme() -> Result<ColorSchemeStatus, String> {
    let settings = Settings::new()
        .await
        .map_err(|err| format!("Settings portal unavailable: {err}"))?;
    settings
        .color_scheme()
        .await
        .map(ColorSchemeStatus::from)
        .map_err(|err| format!("Could not read the color scheme: {err}"))
}

/// Script injected into the page before any of its own scripts run, so the very
/// first render already knows the real system theme.
///
/// Without this the frontend has to guess synchronously and correct itself once
/// the async `color_scheme` command answers -- which is a visible light-to-dark
/// flash on a dark system, because WebKitGTK's own `prefers-color-scheme` does
/// not reflect GNOME's actual setting. Reading the portal here, before the
/// window exists, is the only point early enough to avoid a wrong first frame.
pub fn startup_init_script() -> String {
    let dark = match tauri::async_runtime::block_on(async {
        tokio::time::timeout(STARTUP_READ_TIMEOUT, read_color_scheme()).await
    }) {
        Ok(Ok(status)) => Some(matches!(status, ColorSchemeStatus::Dark)),
        Ok(Err(err)) => {
            log::warn!("Could not read the color scheme at startup: {err}");
            None
        }
        Err(_) => {
            log::warn!("Timed out reading the color scheme at startup");
            None
        }
    };

    match dark {
        Some(dark) => format!("window.__NUCLEUS_SYSTEM_DARK__ = {dark};"),
        // Leave the global undefined so the frontend knows to fall back rather
        // than trusting a value we never actually read.
        None => String::new(),
    }
}

/// Runs for the app's lifetime, forwarding the portal's change signal to the
/// frontend as a Tauri event so "System" theme tracks a live change instead
/// of only picking it up on next launch.
pub fn watch_color_scheme(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        let settings = match Settings::new().await {
            Ok(settings) => settings,
            Err(err) => {
                log::warn!("Settings portal unavailable, color scheme changes won't be tracked live: {err}");
                return;
            }
        };

        let mut changes = match settings.receive_color_scheme_changed().await {
            Ok(stream) => stream,
            Err(err) => {
                log::warn!("Could not watch for color scheme changes: {err}");
                return;
            }
        };

        while let Some(scheme) = changes.next().await {
            let status = ColorSchemeStatus::from(scheme);
            if let Err(err) = app.emit(COLOR_SCHEME_CHANGED_EVENT, status) {
                log::warn!("Could not notify the frontend of a color scheme change: {err}");
            }
        }
    });
}
