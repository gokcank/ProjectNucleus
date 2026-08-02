//! Facts about the container the app was started in, which some widgets have
//! to know about because the sandbox changes what they can honestly report.
//!
//! Injected into the page before its own scripts run (the same trick
//! `appearance` uses for the colour scheme) rather than exposed as a command,
//! because widget registration happens synchronously at startup -- an async
//! round trip would let the dashboard compute its layout before the answer
//! arrived.

/// Flatpak sets `FLATPAK_ID` for the app it launches and always mounts
/// `/.flatpak-info`. Either alone is enough; both are checked because the
/// environment variable is the documented contract while the file is what
/// survives a process that scrubs its own environment.
pub fn is_flatpak() -> bool {
    std::env::var_os("FLATPAK_ID").is_some() || std::path::Path::new("/.flatpak-info").exists()
}

pub fn startup_init_script() -> String {
    format!("window.__NUCLEUS_FLATPAK__ = {};", is_flatpak())
}
