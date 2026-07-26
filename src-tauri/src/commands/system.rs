use std::sync::Mutex;

use serde::Serialize;
use sysinfo::System;
use tauri::State;

/// Shared sysinfo handle. CPU usage is measured as the delta between two
/// refreshes, so reusing one instance across calls is required for
/// meaningful readings.
pub struct SystemMonitor(pub Mutex<System>);

impl SystemMonitor {
    pub fn new() -> Self {
        Self(Mutex::new(System::new()))
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CpuStatus {
    pub usage_percent: f32,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MemoryStatus {
    pub used_bytes: u64,
    pub total_bytes: u64,
}

#[tauri::command]
pub fn cpu_status(monitor: State<'_, SystemMonitor>) -> Result<CpuStatus, String> {
    let mut system = monitor.0.lock().map_err(|err| err.to_string())?;
    system.refresh_cpu_usage();
    Ok(CpuStatus {
        usage_percent: system.global_cpu_usage(),
    })
}

#[tauri::command]
pub fn memory_status(monitor: State<'_, SystemMonitor>) -> Result<MemoryStatus, String> {
    let mut system = monitor.0.lock().map_err(|err| err.to_string())?;
    system.refresh_memory();
    Ok(MemoryStatus {
        used_bytes: system.used_memory(),
        total_bytes: system.total_memory(),
    })
}
