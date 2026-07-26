mod commands;

use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::Manager;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};
use tauri_plugin_log::{Target, TargetKind};

use commands::system::SystemMonitor;

const PANEL_SHORTCUT: &str = "ctrl+alt+n";

fn toggle_panel(app: &tauri::AppHandle) {
    let Some(window) = app.get_webview_window("main") else {
        log::warn!("Panel window not found");
        return;
    };
    let visible = window.is_visible().unwrap_or(false);
    let result = if visible {
        window.hide()
    } else {
        window.show().and_then(|()| window.set_focus())
    };
    if let Err(err) = result {
        log::warn!("Failed to toggle panel: {err}");
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
            commands::system::memory_status
        ])
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
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

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
