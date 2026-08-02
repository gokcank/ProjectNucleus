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

/// Where snapd bind-mounts the real machine inside a strictly confined snap.
const SNAP_HOST_PREFIX: &str = "/var/lib/snapd/hostfs";

/// The path the machine's own filesystem sits behind, when there is one.
///
/// A snap sees roughly 1300 mounts, nearly all of them its own scaffolding:
/// its root reads as a 16 GB temporary filesystem and a dozen bind mounts of
/// the same drive appear as separate volumes. What it also gets, and Flatpak
/// does not, is the untouched host tree under this prefix -- the real root
/// reports its real size there. Reading through it and stripping the prefix
/// turns that noise back into the same list the unpackaged app shows.
pub fn host_filesystem_prefix() -> Option<&'static str> {
    let confined =
        std::env::var_os("SNAP").is_some() && std::path::Path::new(SNAP_HOST_PREFIX).is_dir();
    confined.then_some(SNAP_HOST_PREFIX)
}

pub fn startup_init_script() -> String {
    format!("window.__NUCLEUS_FLATPAK__ = {};", is_flatpak())
}
