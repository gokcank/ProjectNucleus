use std::fs;
use std::path::Path;
use std::process::Command;
use std::sync::OnceLock;

use serde::Serialize;

/// Where the kernel publishes every sensor it has a driver for.
const HWMON_ROOT: &str = "/sys/class/hwmon";

/// How far to look for `tempN_input` within one chip. Real chips stay well
/// below this; the bound only exists so a malformed directory cannot spin.
const MAX_TEMP_INDEX: u8 = 16;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Reading {
    /// Short enough for a narrow card: the part ("CPU", "GPU") or, for
    /// storage, whoever made it ("Samsung"), which is what tells two drives
    /// apart at a glance.
    label: String,
    /// The full model name, for the tooltip and for the extra room a wide
    /// card has. `None` when the kernel offers nothing beyond the label.
    detail: Option<String>,
    celsius: f32,
}

/// Deliberately narrow. The kernel reports nineteen temperatures on a typical
/// desktop, most of them unlabelled motherboard zones and per-core readings
/// that mean nothing at a glance. Nucleus is not a monitoring suite
/// (see `docs/PRODUCT.md`), so only the three anyone actually looks for are
/// carried across.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SensorStatus {
    cpu: Option<Reading>,
    gpu: Option<Reading>,
    drives: Vec<Reading>,
}

fn read_trimmed(path: &Path) -> Option<String> {
    Some(fs::read_to_string(path).ok()?.trim().to_owned())
}

/// hwmon reports thousandths of a degree.
fn read_celsius(path: &Path) -> Option<f32> {
    Some(read_trimmed(path)?.parse::<f32>().ok()? / 1000.0)
}

/// The temperature whose `tempN_label` matches one of `wanted`, compared
/// case-insensitively. Chips name the same sensor differently between
/// vendors, so callers pass every spelling they accept.
fn labelled_temperature(chip: &Path, wanted: &[&str]) -> Option<f32> {
    for index in 1..=MAX_TEMP_INDEX {
        // Indices are not always contiguous -- a drive reporting temp1 and
        // temp3 is normal -- so a gap is skipped rather than treated as the
        // end of the list.
        let Some(label) = read_trimmed(&chip.join(format!("temp{index}_label"))) else {
            continue;
        };
        if wanted.iter().any(|name| label.eq_ignore_ascii_case(name)) {
            return read_celsius(&chip.join(format!("temp{index}_input")));
        }
    }
    None
}

/// For chips that expose a single unlabelled temperature.
fn first_temperature(chip: &Path) -> Option<f32> {
    read_celsius(&chip.join("temp1_input"))
}

/// Storage and graphics chips hang off a device that knows its own model
/// name, which reads far better than "NVMe" on a card listing two drives.
fn device_model(chip: &Path) -> Option<String> {
    let model = read_trimmed(&chip.join("device/model"))?;
    (!model.is_empty()).then_some(model)
}

fn reading(label: impl Into<String>, celsius: f32) -> Reading {
    Reading {
        label: label.into(),
        detail: None,
        celsius,
    }
}

/// The maker's name from a model string -- "Samsung SSD 990 PRO 2TB" becomes
/// "Samsung". Written however the vendor writes it, since "WDC" reads worse
/// evened out than left alone.
///
/// Some drives lead with a part number instead of a name ("CT1000P3PSSD8"),
/// which says nothing more truncated than the full model does. Anything
/// carrying digits is taken as one of those and left to the caller's
/// fallback.
fn maker(model: &str) -> Option<&str> {
    let first = model.split_whitespace().next()?;
    let looks_like_a_name =
        first.chars().any(char::is_alphabetic) && !first.chars().any(char::is_numeric);
    looks_like_a_name.then_some(first)
}

static CPU_MODEL: OnceLock<Option<String>> = OnceLock::new();

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

/// The processor's marketing name, read once -- it cannot change while the
/// machine is running. `(R)` and `(TM)` come off with it: legal furniture,
/// not something anyone reads on a dashboard row.
fn cpu_model() -> Option<String> {
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

fn cpu_reading(celsius: f32) -> Reading {
    Reading {
        label: "CPU".to_owned(),
        detail: cpu_model(),
        celsius,
    }
}

/// A row named after whoever made the part, keeping the full model for the
/// tooltip and for wide cards.
fn modelled(model: Option<String>, fallback: &str, celsius: f32) -> Reading {
    match model {
        Some(model) => Reading {
            label: maker(&model).unwrap_or(fallback).to_owned(),
            detail: Some(model),
            celsius,
        },
        None => reading(fallback, celsius),
    }
}

/// Remembers a first failure so a machine without the tool -- every AMD or
/// Intel box -- does not pay for a process spawn on every poll.
static NVIDIA_PRESENT: OnceLock<bool> = OnceLock::new();

/// NVIDIA's proprietary driver publishes nothing to hwmon, so its cards are
/// invisible to the loop above; the vendor tool is the only way to reach
/// them. Every argument is fixed here -- nothing from the frontend reaches
/// the process.
fn query_nvidia() -> Option<Reading> {
    let output = Command::new("nvidia-smi")
        .args([
            "--query-gpu=name,temperature.gpu",
            "--format=csv,noheader,nounits",
        ])
        .output()
        .ok()?;

    if !output.status.success() {
        return None;
    }

    let line = String::from_utf8(output.stdout).ok()?;
    let (name, celsius) = line.lines().next()?.split_once(',')?;
    Some(Reading {
        label: "GPU".to_owned(),
        detail: Some(name.trim().to_owned()),
        celsius: celsius.trim().parse::<f32>().ok()?,
    })
}

fn nvidia_temperature() -> Option<Reading> {
    if NVIDIA_PRESENT.get() == Some(&false) {
        return None;
    }
    let found = query_nvidia();
    let _ = NVIDIA_PRESENT.set(found.is_some());
    found
}

/// Walks every chip the kernel knows about, keeping only the sensors the card
/// shows. Anything unrecognised is skipped rather than guessed at.
fn read_hwmon() -> SensorStatus {
    let mut status = SensorStatus {
        cpu: None,
        gpu: None,
        drives: Vec::new(),
    };

    let Ok(entries) = fs::read_dir(HWMON_ROOT) else {
        return status;
    };

    for entry in entries.flatten() {
        let chip = entry.path();
        let Some(name) = read_trimmed(&chip.join("name")) else {
            continue;
        };

        match name.as_str() {
            // Intel packages the whole die under one label; the per-core
            // readings beside it are the detail this card leaves out.
            "coretemp" => {
                if let Some(celsius) = labelled_temperature(&chip, &["Package id 0"]) {
                    status.cpu = Some(cpu_reading(celsius));
                }
            }
            // AMD's equivalent. Tctl is the control value the fan curve uses
            // and is what its own tooling shows; Tdie is the fallback on
            // parts that report both.
            "k10temp" => {
                if let Some(celsius) = labelled_temperature(&chip, &["Tctl", "Tdie"]) {
                    status.cpu = Some(cpu_reading(celsius));
                }
            }
            // "Composite" is the drive's own summary across its internal
            // sensors, which is the number worth showing.
            "nvme" => {
                if let Some(celsius) = labelled_temperature(&chip, &["Composite"]) {
                    status
                        .drives
                        .push(modelled(device_model(&chip), "Drive", celsius));
                }
            }
            // SATA drives, via the kernel's own SMART reader.
            "drivetemp" => {
                if let Some(celsius) = first_temperature(&chip) {
                    status
                        .drives
                        .push(modelled(device_model(&chip), "Drive", celsius));
                }
            }
            // AMD and Intel graphics come through here; NVIDIA does not, and
            // is handled separately below.
            "amdgpu" | "i915" | "xe" => {
                let celsius = labelled_temperature(&chip, &["edge", "gpu"])
                    .or_else(|| first_temperature(&chip));
                if let Some(celsius) = celsius {
                    status.gpu = Some(Reading {
                        label: "GPU".to_owned(),
                        detail: device_model(&chip),
                        celsius,
                    });
                }
            }
            _ => {}
        }
    }

    // Directory order is not the order the drives are mounted in, so sort for
    // a stable list rather than one that reshuffles between polls. On the full
    // model, since two drives from the same maker share a label.
    status
        .drives
        .sort_by(|left, right| left.detail.cmp(&right.detail));
    status
}

/// A machine with no readable sensors reports empty rather than failing --
/// the same treatment the Battery card gives a desktop with no battery.
#[tauri::command]
pub fn sensor_status() -> Result<SensorStatus, String> {
    let mut status = read_hwmon();
    if status.gpu.is_none() {
        status.gpu = nvidia_temperature();
    }
    Ok(status)
}
