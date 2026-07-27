use ashpd::desktop::Color;
use ashpd::desktop::ResponseError;
use ashpd::Error as PortalError;
use serde::Serialize;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PickedColor {
    hex: String,
    r: u8,
    g: u8,
    b: u8,
}

fn to_channel(value: f64) -> u8 {
    (value.clamp(0.0, 1.0) * 255.0).round() as u8
}

/// Asks the desktop's color-picker portal for a single pixel's color.
///
/// Returns `Ok(None)` when the user dismisses the portal dialog: cancelling is
/// a normal outcome, not a failure the UI should report as an error.
#[tauri::command]
pub async fn pick_color() -> Result<Option<PickedColor>, String> {
    let request = Color::pick()
        .send()
        .await
        .map_err(|err| format!("Color picker portal unavailable: {err}"))?;

    let color = match request.response() {
        Ok(color) => color,
        Err(PortalError::Response(ResponseError::Cancelled)) => return Ok(None),
        Err(err) => return Err(format!("Color pick failed: {err}")),
    };

    let (r, g, b) = (
        to_channel(color.red()),
        to_channel(color.green()),
        to_channel(color.blue()),
    );

    Ok(Some(PickedColor {
        hex: format!("#{r:02x}{g:02x}{b:02x}"),
        r,
        g,
        b,
    }))
}
