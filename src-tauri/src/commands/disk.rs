use serde::Serialize;
use sysinfo::Disks;

/// Filesystems that live on another machine. Free space on them is somebody
/// else's business, and reading it can block on a network round trip -- see
/// the scope note in `docs/ROADMAP.md`.
const NETWORK_FILESYSTEMS: &[&str] = &[
    "nfs",
    "nfs4",
    "cifs",
    "smb",
    "smbfs",
    "smb3",
    "sshfs",
    "fuse.sshfs",
    "davfs",
    "fuse.davfs",
    "ncpfs",
    "afs",
    "9p",
];

/// The firmware's own partition. Half a gigabyte of plumbing nobody makes
/// decisions about, so it would only ever be a row to skip past.
const BOOT_MOUNT_PREFIX: &str = "/boot";

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Volume {
    /// Short enough for a narrow card. "System" for the root filesystem,
    /// otherwise the folder it is mounted under -- which is the label the
    /// owner gave the drive, since removable volumes mount at
    /// `/media/<user>/<label>`.
    name: String,
    /// The full mount path, for the tooltip.
    mount_point: String,
    /// Sorted first and emphasised: the volume the machine runs from.
    is_system: bool,
    total_bytes: u64,
    available_bytes: u64,
}

/// Only volumes that are mounted are listed. A drive set to mount at startup
/// is already mounted by the time anyone opens the panel, so it arrives here
/// on its own; one left unmounted on purpose is one the owner has told the
/// desktop not to surface, and the card follows that.
fn is_listable(mount_point: &str, file_system: &str, read_only: bool) -> bool {
    if mount_point == BOOT_MOUNT_PREFIX || mount_point.starts_with(&format!("{BOOT_MOUNT_PREFIX}/"))
    {
        return false;
    }
    // Free space on something you cannot write to is not a number anyone acts
    // on, and every self-mounting application bundle lands here: a running
    // AppImage mounts its own read-only image under /tmp and reports itself
    // 100% full, which the card would otherwise flag as a drive about to run
    // out. Nucleus's own AppImage will do exactly this once it ships.
    if read_only {
        return false;
    }
    !NETWORK_FILESYSTEMS
        .iter()
        .any(|network| file_system.eq_ignore_ascii_case(network))
}

/// "System" for the root filesystem, otherwise the last part of the mount
/// path. Falls back to the whole path for anything mounted somewhere without
/// one, which the tooltip repeats in full anyway.
fn volume_name(mount_point: &str) -> String {
    if mount_point == "/" {
        return "System".to_owned();
    }
    mount_point
        .rsplit('/')
        .find(|part| !part.is_empty())
        .unwrap_or(mount_point)
        .to_owned()
}

#[tauri::command]
pub fn disk_status() -> Result<Vec<Volume>, String> {
    // sysinfo already drops the noise: loop devices behind snap packages,
    // in-memory filesystems, and the firmware's own variable store. On this
    // machine that is twenty-five entries down to three.
    let disks = Disks::new_with_refreshed_list();

    let mut volumes: Vec<Volume> = disks
        .list()
        .iter()
        .filter_map(|disk| {
            let mount_point = disk.mount_point().to_string_lossy().into_owned();
            let file_system = disk.file_system().to_string_lossy();

            // A volume reporting no size at all has nothing to say.
            if disk.total_space() == 0
                || !is_listable(&mount_point, &file_system, disk.is_read_only())
            {
                return None;
            }

            Some(Volume {
                name: volume_name(&mount_point),
                is_system: mount_point == "/",
                mount_point,
                total_bytes: disk.total_space(),
                available_bytes: disk.available_space(),
            })
        })
        .collect();

    // The system volume leads; the rest go alphabetically, so the list does
    // not reshuffle between polls the way mount order can.
    volumes.sort_by(|left, right| {
        right
            .is_system
            .cmp(&left.is_system)
            .then_with(|| left.name.cmp(&right.name))
    });

    Ok(volumes)
}
