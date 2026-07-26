use std::collections::HashMap;

use serde::Serialize;
use zbus::zvariant::OwnedValue;
use zbus::{proxy, Connection};

#[proxy(
    interface = "org.freedesktop.login1.Manager",
    default_service = "org.freedesktop.login1",
    default_path = "/org/freedesktop/login1"
)]
trait LoginManager {
    /// `interactive` lets logind fall back to a polkit prompt when the action
    /// is not permitted outright.
    fn suspend(&self, interactive: bool) -> zbus::Result<()>;
    fn reboot(&self, interactive: bool) -> zbus::Result<()>;
    fn power_off(&self, interactive: bool) -> zbus::Result<()>;

    /// Each returns "yes", "no", "challenge" or "na".
    fn can_suspend(&self) -> zbus::Result<String>;
    fn can_reboot(&self) -> zbus::Result<String>;
    fn can_power_off(&self) -> zbus::Result<String>;
}

#[proxy(
    interface = "org.freedesktop.UPower.PowerProfiles",
    default_service = "org.freedesktop.UPower.PowerProfiles",
    default_path = "/org/freedesktop/UPower/PowerProfiles"
)]
trait PowerProfiles {
    #[zbus(property)]
    fn active_profile(&self) -> zbus::Result<String>;

    #[zbus(property)]
    fn set_active_profile(&self, profile: &str) -> zbus::Result<()>;

    #[zbus(property)]
    fn profiles(&self) -> zbus::Result<Vec<HashMap<String, OwnedValue>>>;
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PowerCapabilities {
    can_suspend: bool,
    can_reboot: bool,
    can_power_off: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PowerProfileStatus {
    /// False when power-profiles-daemon is not running, which is a normal
    /// configuration rather than an error.
    supported: bool,
    active: String,
    available: Vec<String>,
}

/// logind answers "yes", "challenge" (allowed after a polkit prompt), "no" or
/// "na". Both "yes" and "challenge" mean the action is worth offering.
fn is_permitted(answer: &str) -> bool {
    matches!(answer, "yes" | "challenge")
}

async fn system_bus() -> Result<Connection, String> {
    Connection::system()
        .await
        .map_err(|err| format!("System bus unavailable: {err}"))
}

async fn login_manager(connection: &Connection) -> Result<LoginManagerProxy<'_>, String> {
    LoginManagerProxy::new(connection)
        .await
        .map_err(|err| format!("Power service unavailable: {err}"))
}

#[tauri::command]
pub async fn power_capabilities() -> Result<PowerCapabilities, String> {
    let connection = system_bus().await?;
    let manager = login_manager(&connection).await?;

    Ok(PowerCapabilities {
        can_suspend: manager
            .can_suspend()
            .await
            .map(|answer| is_permitted(&answer))
            .unwrap_or(false),
        can_reboot: manager
            .can_reboot()
            .await
            .map(|answer| is_permitted(&answer))
            .unwrap_or(false),
        can_power_off: manager
            .can_power_off()
            .await
            .map(|answer| is_permitted(&answer))
            .unwrap_or(false),
    })
}

/// Only the three actions named here are accepted; anything else is rejected
/// before it can reach logind.
#[tauri::command]
pub async fn run_power_action(action: String) -> Result<(), String> {
    let connection = system_bus().await?;
    let manager = login_manager(&connection).await?;

    let result = match action.as_str() {
        "suspend" => manager.suspend(true).await,
        "reboot" => manager.reboot(true).await,
        "powerOff" => manager.power_off(true).await,
        other => return Err(format!("Unknown power action: {other}")),
    };

    result.map_err(|err| format!("Power action failed: {err}"))
}

#[tauri::command]
pub async fn power_profile_status() -> Result<PowerProfileStatus, String> {
    let connection = system_bus().await?;

    let Ok(proxy) = PowerProfilesProxy::new(&connection).await else {
        return Ok(PowerProfileStatus {
            supported: false,
            active: String::new(),
            available: Vec::new(),
        });
    };

    let Ok(active) = proxy.active_profile().await else {
        return Ok(PowerProfileStatus {
            supported: false,
            active: String::new(),
            available: Vec::new(),
        });
    };

    let available = proxy
        .profiles()
        .await
        .map(|profiles| {
            profiles
                .iter()
                .filter_map(|entry| String::try_from(entry.get("Profile")?.clone()).ok())
                .collect()
        })
        .unwrap_or_default();

    Ok(PowerProfileStatus {
        supported: true,
        active,
        available,
    })
}

#[tauri::command]
pub async fn set_power_profile(profile: String) -> Result<PowerProfileStatus, String> {
    let connection = system_bus().await?;
    let proxy = PowerProfilesProxy::new(&connection)
        .await
        .map_err(|err| format!("Power profiles unavailable: {err}"))?;

    // Only profiles the daemon itself advertises are accepted.
    let available: Vec<String> = proxy
        .profiles()
        .await
        .map(|profiles| {
            profiles
                .iter()
                .filter_map(|entry| String::try_from(entry.get("Profile")?.clone()).ok())
                .collect()
        })
        .unwrap_or_default();

    if !available.contains(&profile) {
        return Err(format!("Unknown power profile: {profile}"));
    }

    proxy
        .set_active_profile(&profile)
        .await
        .map_err(|err| format!("Could not change power profile: {err}"))?;

    power_profile_status().await
}

#[cfg(test)]
mod tests {
    use super::is_permitted;

    #[test]
    fn treats_yes_and_challenge_as_permitted() {
        assert!(is_permitted("yes"));
        assert!(is_permitted("challenge"));
    }

    #[test]
    fn treats_no_and_na_as_denied() {
        assert!(!is_permitted("no"));
        assert!(!is_permitted("na"));
    }
}
