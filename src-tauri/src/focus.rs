//! Claiming input focus for the panel when it is summoned.
//!
//! Showing a window is not the same as focusing it. Mutter (and other window
//! managers) apply focus-stealing prevention: an activation request that isn't
//! backed by a recent user-interaction timestamp is downgraded to "shown but
//! not focused". The panel is summoned by a global shortcut or the tray menu,
//! neither of which flows through GTK's event loop, so no such timestamp is
//! attached and the request is sometimes refused.
//!
//! That leaves the panel in a broken state: it is on screen but has no focus,
//! so the click-outside-to-dismiss behavior in the frontend never triggers --
//! it listens for focus loss, and a window that never gained focus can't lose
//! it. The user has to click the panel once, then click away, to dismiss it.
//!
//! The fix is to say what is actually true: the panel is being summoned by a
//! deliberate user action right now. `_NET_WM_USER_TIME` is the property the
//! window manager reads to make that judgement, so it is set to a fresh
//! timestamp straight from the X server before activating.

/// Brings the panel to the front and claims input focus for it.
#[cfg(target_os = "linux")]
pub fn claim(window: &tauri::WebviewWindow) {
    use gtk::glib::Cast;
    use gtk::prelude::{GtkWindowExt, WidgetExt};

    let gtk_window = match window.gtk_window() {
        Ok(gtk_window) => gtk_window,
        Err(err) => {
            log::warn!("Could not reach the panel's GTK window to claim focus: {err}");
            fallback(window);
            return;
        }
    };

    // Normally exists once the window has been shown, but the panel starts
    // hidden (see anchor_to_top_right in lib.rs) so its very first show can
    // race this: `show()` has been called but GTK hasn't realized the
    // underlying window yet. Realizing explicitly, rather than giving up and
    // falling back, is what makes that first summon claim focus too.
    if gtk_window.window().is_none() {
        gtk_window.realize();
    }
    let Some(gdk_window) = gtk_window.window() else {
        log::warn!("The panel has no underlying window even after realizing; falling back to a plain focus request");
        fallback(window);
        return;
    };

    // Fails on Wayland, where there is no X11 window and no equivalent
    // property to set -- a client there simply cannot demand focus.
    let Ok(x11_window) = gdk_window.downcast::<gdkx11::X11Window>() else {
        fallback(window);
        return;
    };

    let timestamp = gdkx11::functions::x11_get_server_time(&x11_window);
    x11_window.set_user_time(timestamp);
    gtk_window.present_with_time(timestamp);
}

#[cfg(not(target_os = "linux"))]
pub fn claim(window: &tauri::WebviewWindow) {
    fallback(window);
}

fn fallback(window: &tauri::WebviewWindow) {
    if let Err(err) = window.set_focus() {
        log::warn!("Failed to focus the panel: {err}");
    }
}
