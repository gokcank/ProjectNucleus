mod commands;
mod focus;

use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::Manager;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};
use tauri_plugin_log::{Target, TargetKind};

use commands::system::SystemMonitor;

const PANEL_SHORTCUT: &str = "ctrl+alt+n";
/// Gap kept from the screen edges when anchoring the panel to the top-right
/// corner, in physical pixels.
const SCREEN_EDGE_MARGIN: i32 = 12;
/// Logical window width, mirroring `width` in tauri.conf.json. Anchoring runs
/// while the window is still hidden (see `anchor_to_top_right`), before the
/// platform has ever realized it, so its actual size can't be queried yet --
/// `outer_size()` reads back (0, 0) at that point. The known config size,
/// scaled for the monitor, stands in for it instead.
const WINDOW_LOGICAL_WIDTH: f64 = 480.0;

fn toggle_panel(app: &tauri::AppHandle) {
    let Some(window) = app.get_webview_window("main") else {
        log::warn!("Panel window not found");
        return;
    };
    let visible = window.is_visible().unwrap_or(false);
    if visible {
        if let Err(err) = window.hide() {
            log::warn!("Failed to hide panel: {err}");
        }
        return;
    }

    // Reasserting always-on-top on every show, not just at window creation,
    // matters: some window managers (Mutter included) can drop or ignore that
    // state across a hide/show cycle, which otherwise left the panel appearing
    // behind whatever window already had focus (e.g. Firefox) instead of
    // above it.
    if let Err(err) = window.show().and_then(|()| window.set_always_on_top(true)) {
        log::warn!("Failed to show panel: {err}");
        return;
    }
    focus::claim(&window);
}

/// Anchors the panel to the primary monitor's top-right corner. Run once at
/// startup: the window is otherwise placed by the platform default, which is
/// inconsistent and, per ADR-012, not the native placement a Linux tray
/// utility is expected to use.
fn anchor_to_top_right(window: &tauri::WebviewWindow) {
    let Ok(Some(monitor)) = window.primary_monitor() else {
        log::warn!("No primary monitor found; leaving the panel at its default position");
        return;
    };

    let scale = monitor.scale_factor();
    let window_width = (WINDOW_LOGICAL_WIDTH * scale).round() as i32;

    let screen_pos = monitor.position();
    let screen_size = monitor.size();
    let x = screen_pos.x + screen_size.width as i32 - window_width - SCREEN_EDGE_MARGIN;
    let y = screen_pos.y + SCREEN_EDGE_MARGIN;

    if let Err(err) =
        window.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x, y }))
    {
        log::warn!("Failed to anchor the panel to the top-right corner: {err}");
    }
}

fn setup_tray(app: &tauri::App) -> tauri::Result<()> {
    let toggle = MenuItem::with_id(app, "toggle", "Show / Hide", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&toggle, &quit])?;

    let mut tray = TrayIconBuilder::with_id("main")
        .menu(&menu)
        .tooltip("Project Nucleus")
        .on_menu_event(|app, event| match event.id.as_ref() {
            "toggle" => toggle_panel(app),
            "quit" => app.exit(0),
            _ => {}
        });
    if let Some(icon) = app.default_window_icon() {
        tray = tray.icon(icon.clone());
    }
    tray.build(app)?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    std::panic::set_hook(Box::new(|info| {
        log::error!("panic: {info}");
    }));

    tauri::Builder::default()
        .manage(SystemMonitor::new())
        .invoke_handler(tauri::generate_handler![
            commands::system::cpu_status,
            commands::system::memory_status,
            commands::screenshot::take_screenshot,
            commands::audio::volume_status,
            commands::audio::set_volume,
            commands::audio::toggle_mute,
            commands::bluetooth::bluetooth_status,
            commands::bluetooth::set_bluetooth_powered,
            commands::bluetooth::set_device_connected,
            commands::night_light::night_light_status,
            commands::night_light::set_night_light_enabled,
            commands::night_light::set_night_light_temperature,
            commands::power::power_capabilities,
            commands::power::run_power_action,
            commands::power::power_profile_status,
            commands::power::set_power_profile,
            commands::color_picker::pick_color,
            commands::network::network_status,
            commands::network::public_ip,
            commands::appearance::color_scheme
        ])
        // Injected before the page's own scripts so the first render already
        // knows the system theme instead of guessing and correcting itself.
        .plugin(
            tauri::plugin::Builder::<tauri::Wry, ()>::new("appearance")
                .js_init_script(commands::appearance::startup_init_script())
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .targets([
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::LogDir { file_name: None }),
                ])
                .level(log::LevelFilter::Info)
                .build(),
        )
        .setup(|app| {
            log::info!("Project Nucleus starting up");

            if let Some(window) = app.get_webview_window("main") {
                anchor_to_top_right(&window);
            } else {
                log::warn!("Panel window not found during setup");
            }

            match app
                .global_shortcut()
                .on_shortcut(PANEL_SHORTCUT, |app, _shortcut, event| {
                    if event.state() == ShortcutState::Pressed {
                        toggle_panel(app);
                    }
                }) {
                Ok(()) => log::info!("Global shortcut registered: {PANEL_SHORTCUT}"),
                Err(err) => log::warn!("Global shortcut unavailable: {err}"),
            }

            match setup_tray(app) {
                Ok(()) => log::info!("System tray initialized"),
                Err(err) => log::warn!("System tray unavailable: {err}"),
            }

            commands::appearance::watch_color_scheme(app.handle().clone());

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
