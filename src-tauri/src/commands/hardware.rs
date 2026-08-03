use std::fs;
use std::process::Command;
use std::sync::OnceLock;

use serde::Serialize;
use sysinfo::System;

/// What the firmware writes when the builder left the field blank. Shown as
/// nothing rather than as itself.
const DMI_PLACEHOLDERS: &[&str] = &[
    "To Be Filled By O.E.M.",
    "To be filled by O.E.M.",
    "Default string",
    "System Product Name",
    "Not Specified",
    "Unknown",
    "None",
];

/// Corporate suffixes. "NVIDIA Corporation" is the vendor's legal name;
/// "NVIDIA" is what the row has room for and what anyone reads anyway.
const VENDOR_SUFFIXES: &[&str] = &[
    " Technology Co., Ltd.",
    " Technology Co., Ltd",
    " Co., Ltd.",
    " Co., Ltd",
    " Corporation",
    " Technologies",
    " Computer Inc.",
    " Corp.",
    " Inc.",
    " Ltd.",
    " GmbH",
    " S.A.",
    " AG",
];

/// The classes `lspci` uses for anything that drives a display. A machine with
/// both an integrated and a discrete chip reports one of each, and both are
/// real, so both are listed.
const GRAPHICS_CLASSES: &[&str] = &[
    "VGA compatible controller",
    "3D controller",
    "Display controller",
];

fn read_dmi(field: &str) -> Option<String> {
    let value = fs::read_to_string(format!("/sys/class/dmi/id/{field}"))
        .ok()?
        .trim()
        .to_owned();
    if value.is_empty() || DMI_PLACEHOLDERS.iter().any(|blank| value == *blank) {
        return None;
    }
    Some(value)
}

fn trim_vendor(vendor: &str) -> &str {
    let trimmed = vendor.trim();
    for suffix in VENDOR_SUFFIXES {
        if let Some(shortened) = trimmed.strip_suffix(suffix) {
            return shortened;
        }
    }
    trimmed
}

/// Drops the core count vendors tack onto the end -- "AMD Ryzen 9 5900X
/// 12-Core Processor" is a row's worth of text before it says anything the
/// name has not already said.
fn without_core_count(name: &str) -> String {
    let trimmed = name.strip_suffix(" Processor").unwrap_or(name);
    match trimmed.rsplit_once(' ') {
        Some((head, tail)) if tail.ends_with("-Core") => head.to_owned(),
        _ => trimmed.to_owned(),
    }
}

static CPU_MODEL: OnceLock<Option<String>> = OnceLock::new();

/// The processor's marketing name, read once -- it cannot change while the
/// machine is running. `(R)` and `(TM)` come off with it: legal furniture,
/// not something anyone reads on a dashboard row.
///
/// Lives here rather than beside the temperature reading that also wants it,
/// because what processor this is is a fact about the hardware, not a sensor.
pub fn cpu_model() -> Option<String> {
    CPU_MODEL
        .get_or_init(|| {
            let cpuinfo = fs::read_to_string("/proc/cpuinfo").ok()?;
            let (_, name) = cpuinfo
                .lines()
                .find(|line| line.starts_with("model name"))?
                .split_once(':')?;
            let stripped = name.replace("(R)", "").replace("(TM)", "");
            // Removing those can leave doubled spaces behind.
            let collapsed = stripped.split_whitespace().collect::<Vec<_>>().join(" ");
            let cleaned = without_core_count(&collapsed);
            (!cleaned.is_empty()).then_some(cleaned)
        })
        .clone()
}

/// The quoted columns of one `lspci -mm` line, which is why that flag is used:
/// it quotes every field, so a device name containing spaces stays one field.
fn quoted_fields(line: &str) -> Vec<&str> {
    line.split('"').skip(1).step_by(2).collect()
}

/// `lspci` reports a chip's engineering name with the one people recognise in
/// brackets after it: "GA104 [GeForce RTX 3070]".
fn marketing_name(device: &str) -> &str {
    match (device.find('['), device.rfind(']')) {
        (Some(open), Some(close)) if close > open + 1 => device[open + 1..close].trim(),
        _ => device.trim(),
    }
}

static GRAPHICS: OnceLock<Vec<String>> = OnceLock::new();

/// Reads the graphics chips once. Unlike the temperature card's use of
/// `nvidia-smi`, this asks the kernel's own device list, so it works the same
/// on AMD and Intel machines and without any proprietary driver installed.
fn graphics() -> Vec<String> {
    GRAPHICS
        .get_or_init(|| {
            let Ok(output) = Command::new("lspci").arg("-mm").output() else {
                return Vec::new();
            };
            if !output.status.success() {
                return Vec::new();
            }
            let listing = String::from_utf8_lossy(&output.stdout).into_owned();

            listing
                .lines()
                .filter_map(|line| {
                    let fields = quoted_fields(line);
                    let (class, vendor, device) = (fields.first()?, fields.get(1)?, fields.get(2)?);
                    if !GRAPHICS_CLASSES.contains(class) {
                        return None;
                    }
                    Some(format!(
                        "{} {}",
                        trim_vendor(vendor),
                        marketing_name(device)
                    ))
                })
                .collect()
        })
        .clone()
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HardwareInfo {
    /// Vendor and board or laptop model, e.g. "Gigabyte B660M DS3H DDR4".
    model: Option<String>,
    cpu: Option<String>,
    /// Logical processors -- threads, not cores, which is what the machine
    /// actually schedules on and what `lscpu` and GNOME's own About panel
    /// count.
    cpu_threads: usize,
    graphics: Vec<String>,
    memory_bytes: u64,
    operating_system: Option<String>,
    kernel: Option<String>,
    host_name: Option<String>,
}

/// The `PRETTY_NAME` line out of an `os-release` file: `Ubuntu 24.04.4 LTS`.
fn pretty_name(os_release: &str) -> Option<String> {
    let value = os_release
        .lines()
        .find_map(|line| line.strip_prefix("PRETTY_NAME="))?
        .trim()
        .trim_matches('"');
    (!value.is_empty()).then(|| value.to_owned())
}

/// Which distribution this is.
///
/// Read from `os-release` rather than through `sysinfo`, because inside a snap
/// `sysinfo` answers for the base the snap runs on -- "Ubuntu Core 24" on a
/// machine actually running Ubuntu 24.04. The host's own file is reachable
/// under the confinement prefix, so that is preferred when there is one.
fn distribution() -> Option<String> {
    let host_file = super::runtime::host_filesystem_prefix()
        .map(|prefix| format!("{prefix}/etc/os-release"))
        .and_then(|path| fs::read_to_string(path).ok())
        .and_then(|contents| pretty_name(&contents));
    if host_file.is_some() {
        return host_file;
    }

    fs::read_to_string("/etc/os-release")
        .ok()
        .and_then(|contents| pretty_name(&contents))
        .or_else(|| match (System::name(), System::os_version()) {
            (Some(name), Some(version)) => Some(format!("{name} {version}")),
            (name, version) => name.or(version),
        })
}

/// Nothing here changes while the machine is running, so the card reads it
/// once instead of polling.
#[tauri::command]
pub fn hardware_info() -> Result<HardwareInfo, String> {
    let mut system = System::new();
    system.refresh_cpu_all();
    system.refresh_memory();

    let vendor = read_dmi("sys_vendor");
    let product = read_dmi("product_name");
    let model = match (vendor, product) {
        // Some vendors already repeat themselves in the product name.
        (Some(vendor), Some(product)) => {
            let short = trim_vendor(&vendor);
            if product.starts_with(short) {
                Some(product)
            } else {
                Some(format!("{short} {product}"))
            }
        }
        (vendor, product) => vendor.or(product),
    };

    let operating_system = distribution();

    Ok(HardwareInfo {
        model,
        cpu: cpu_model(),
        cpu_threads: system.cpus().len(),
        graphics: graphics(),
        memory_bytes: system.total_memory(),
        operating_system,
        kernel: System::kernel_version(),
        host_name: System::host_name(),
    })
}
