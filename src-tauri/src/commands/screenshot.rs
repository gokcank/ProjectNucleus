use std::path::{Path, PathBuf};

use ashpd::desktop::screenshot::Screenshot;
use ashpd::desktop::ResponseError;
use ashpd::Error as PortalError;
use serde::Serialize;
use tauri::{AppHandle, Manager};
use url::Url;

/// Longest file stem we accept from the frontend. Generous for a timestamp,
/// short enough to stay well inside any filesystem's name limit.
const MAX_STEM_LEN: usize = 64;

/// How many `-1`, `-2`, ... suffixes to try before giving up on a unique name.
const MAX_NAME_ATTEMPTS: u32 = 100;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedScreenshot {
    path: String,
    file_name: String,
}

/// Keeps only the characters the frontend is expected to produce. Anything else
/// — path separators, `..`, dots, spaces — is dropped rather than escaped, so a
/// malformed or hostile stem can never point outside the destination directory.
fn sanitize_stem(stem: &str) -> Option<String> {
    let cleaned: String = stem
        .chars()
        .filter(|c| c.is_ascii_alphanumeric() || *c == '-' || *c == '_')
        .take(MAX_STEM_LEN)
        .collect();

    if cleaned.is_empty() {
        None
    } else {
        Some(cleaned)
    }
}

/// Picks a not-yet-taken path, so two captures in the same second don't
/// overwrite each other.
fn unique_path(dir: &Path, stem: &str, extension: &str) -> Option<PathBuf> {
    let candidate = dir.join(format!("{stem}.{extension}"));
    if !candidate.exists() {
        return Some(candidate);
    }

    (1..MAX_NAME_ATTEMPTS)
        .map(|n| dir.join(format!("{stem}-{n}.{extension}")))
        .find(|path| !path.exists())
}

/// Asks the desktop's screenshot portal for a capture and copies the result
/// into the user's Pictures directory.
///
/// Returns `Ok(None)` when the user dismisses the portal dialog: cancelling is
/// a normal outcome, not a failure the UI should report as an error.
#[tauri::command]
pub async fn take_screenshot(
    app: AppHandle,
    file_stem: String,
) -> Result<Option<SavedScreenshot>, String> {
    let stem = sanitize_stem(&file_stem).ok_or("Invalid screenshot file name")?;

    let request = Screenshot::request()
        .interactive(true)
        .modal(true)
        .send()
        .await
        .map_err(|err| format!("Screenshot portal unavailable: {err}"))?;

    let response = match request.response() {
        Ok(response) => response,
        Err(PortalError::Response(ResponseError::Cancelled)) => return Ok(None),
        Err(err) => return Err(format!("Screenshot failed: {err}")),
    };

    let source = Url::parse(response.uri().as_str())
        .ok()
        .and_then(|url| url.to_file_path().ok())
        .ok_or("Portal returned an unusable screenshot location")?;

    let extension = source
        .extension()
        .and_then(|value| value.to_str())
        .unwrap_or("png")
        .to_owned();

    let target_dir = app
        .path()
        .picture_dir()
        .map_err(|err| format!("Pictures directory unavailable: {err}"))?;

    std::fs::create_dir_all(&target_dir)
        .map_err(|err| format!("Could not create {}: {err}", target_dir.display()))?;

    let target = unique_path(&target_dir, &stem, &extension)
        .ok_or("Could not find an unused screenshot file name")?;

    std::fs::copy(&source, &target).map_err(|err| format!("Could not save screenshot: {err}"))?;

    let file_name = target
        .file_name()
        .and_then(|value| value.to_str())
        .unwrap_or(&stem)
        .to_owned();

    Ok(Some(SavedScreenshot {
        path: target.to_string_lossy().into_owned(),
        file_name,
    }))
}
