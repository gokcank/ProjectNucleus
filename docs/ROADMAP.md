# 🗺️ Project Nucleus

> **Development Roadmap**
>
> **Version:** 1.0
>
> This roadmap defines the planned evolution of Project Nucleus.
>
> It is a living document and may change as the project evolves.

---

# 🎯 Project Goal

Build a modern, modular, and native Linux control center that improves everyday desktop workflows without replacing the desktop environment.

The project will grow incrementally.

Every phase must produce a stable, usable application.

---

# 📍 Current Status

| Item | Status |
|------|--------|
| Project | 🚧 In Development |
| Current Phase | Phases 6–8 complete, then narrowed twice — thirteen widgets that duplicated what GNOME already offers were removed (ADR-016, ADR-017), leaving twelve. Growing again since, one widget at a time, each tested against ADR-016 first: Network throughput, then Temperature, then Disk — fourteen now. Four items were closed with a reason rather than built (QR Scanner, File Search, Speed Test, Fan); see each phase |
| Public Release | Not Yet |
| Widget Engine | Complete |
| Plugin SDK | Planned |

---

# 🧭 Development Philosophy

Project Nucleus follows a milestone-based development process.

Each milestone should:

- Produce working software
- Improve the user experience
- Minimize technical debt
- Avoid unnecessary abstraction
- Prepare for future expansion

Large features should be introduced only when the foundation is ready.

---

# 📦 Phase 0 — Foundation

## Goal

Build a clean and maintainable project foundation.

### Deliverables

- Tauri v2
- Rust backend
- React + TypeScript
- Tailwind CSS v4
- Project structure
- Theme support
- Settings infrastructure
- Logging
- Error handling
- ESLint
- Prettier
- Rustfmt
- Clippy

### Exit Criteria

- Development environment complete
- Project builds successfully
- Clean repository structure

---

# 🪟 Phase 1 — Panel

## Goal

Create the application shell.

### Deliverables

- Floating window
- Rounded corners
- Blur (when supported)
- Soft shadows
- Open / Close animations
- ESC to close
- Click outside to close
- Global shortcut
- System tray integration

### Exit Criteria

The application feels like a polished native Linux utility.

---

# 🏠 Phase 2 — Dashboard

## Goal

Create the first usable interface.

### Deliverables

- Dashboard
- Responsive grid
- Header
- Search placeholder
- Empty state
- Scroll support

> **Search scope:** Search is limited to finding cards, widgets, and Nucleus features within the application. It is not an application launcher, file search, or system-wide search. (See PRODUCT.md non-goals: Nucleus is not a launcher replacement.)

### Exit Criteria

Cards can be displayed consistently.

---

# 🧩 Phase 3 — First Cards

> **Do NOT build the widget engine yet.**

Start with real implementations.

## Initial Cards

- Clock *(removed later — see ADR-017: GNOME's top bar shows the time without any click at all)*
- CPU
- RAM

> **Monitoring scope:** CPU, RAM, and similar cards show basic, at-a-glance status only. Nucleus is not a system monitoring suite (see PRODUCT.md non-goals); detailed graphs, per-process views, and historical data are out of scope.

Minor code duplication is acceptable.

### Goal

Understand common behavior before introducing abstractions.

### Exit Criteria

At least three production-quality cards exist.

---

# 🏗️ Phase 4 — Card Framework

Now extract the common behavior.

### Deliverables

- Base Card
- Shared Layout
- Shared Header
- Shared Actions
- Card Styling
- Drag & Drop
- Resize
- Layout Persistence

### Exit Criteria

All existing cards use the Card Framework.

---

# 🧠 Phase 5 — Widget Engine

Cards evolve into widgets.

### Deliverables

- Widget registration
- Widget lifecycle
- Widget settings
- Widget persistence
- Widget discovery
- Widget API

### Design Principle

> Everything else should be a widget.

### Exit Criteria

New functionality can be added without modifying the core dashboard.

---

# ⚙️ Phase 6 — Productivity Widgets

Examples

- ✅ Clipboard
- ✅ Notes
- ✅ Timer
- ✅ Stopwatch
- ✅ Quick Links
- ✅ Todo
- ✅ Pomodoro
- ❌ Calculator *(built, then removed — see ADR-016: GNOME's own calculator is one keystroke away in the overview)*
- ❌ Calendar *(built, then removed — see ADR-016: clicking the top bar clock already opens the same month view)*

---

# 🖥️ Phase 7 — System Widgets

Examples

- ✅ Battery *(kept: shows charge for peripherals too — a wireless mouse or headset — which the quick settings panel does not)*
- ✅ Temperature *(processor, graphics and drives. Passes the ADR-016 test outright: GNOME surfaces temperature nowhere, so there is no faster path to duplicate)*
- ✅ Disk *(free and total space per mounted volume. Read-only by decision — see ADR-018 for why mount and unmount buttons were turned down. Network shares are filtered out; so is the firmware boot partition. Only mounted volumes are listed, since a drive set to mount at startup is already mounted by the time the panel opens — the one case this misses is a drive that was meant to mount and failed, accepted to keep the card small)*
- Fan *(deliberately deferred: on the development machine the kernel publishes no fan readings at all. The fans hang off the motherboard's own controller chip, whose I/O addresses the firmware reserves, so the kernel refuses to let its driver bind by default. Making them readable is a machine configuration change — an out-of-tree driver, a boot parameter, or both — not something an unprivileged app can do; Nucleus can only read what the kernel already publishes. The card code would be the same either way, so revisit on a setup where fan readings actually appear)*
- ❌ Wi-Fi *(built, then removed — see ADR-016)*
- ❌ Bluetooth *(built, then removed — see ADR-016)*
- ❌ Volume *(built, then removed — see ADR-016)*
- ❌ Brightness *(built, then removed — see ADR-016)*
- ❌ Night Light *(built, then removed — see ADR-016)*
- ❌ Power Menu *(built, then removed — see ADR-016)*
- ❌ Power Profile *(built, then removed — see ADR-016)*

> Almost all of this phase turned out to duplicate GNOME's own quick settings
> panel, which is already one click away in the top bar. See ADR-016 for the
> reasoning and what was kept. Battery, Temperature and Disk are what remain,
> and all three are here for the same reason: they answer something the
> desktop does not answer at a glance.

---

# 🧰 Phase 8 — Utility Widgets

Examples

- ✅ Color Picker
- ❌ Screenshot *(built, then removed — see ADR-017: Print Screen already does this)*
- ❌ Screen Recorder *(built, then removed — see ADR-017: Ctrl+Alt+Shift+R already does this, and the card called that same service)*
- ❌ QR Generator *(built, then removed — see ADR-017: the one removal in that round without a GNOME equivalent, dropped as a scope decision)*
- QR Scanner *(deliberately deferred: the WebView layer Tauri ships does not enable camera streams at all, so the cheap route would mean reaching into internals Tauri does not support; the supported route — camera portal plus a PipeWire stream and a decoder — is the heaviest integration in this phase. Neither can be verified without a camera. Revisit on a machine that has one, or when there is a real need)*
- File Search *(deliberately dropped: GNOME's own overview already searches the same index a card would query, so a card could only ever be the slower route — open the panel, find the card, type. Per VISION.md every feature has to justify its existence, and this one duplicates a single keystroke)*

---

# 🎵 Phase 9 — Media Widgets

Examples

- Audio Devices
- Microphone
- Camera
- Media Controls
- OBS Integration
- Spotify Integration

---

# 🌐 Phase 10 — Network Widgets

Examples

- ✅ Network Status *(shipped together with IP Information as one "Network" widget — connection type, SSID, local and public address answer the same question; live throughput added later, since GNOME's quick settings shows neither speed nor total usage)*
- VPN
- Hotspot
- DNS
- Ping
- ✅ IP Information *(see above)*
- Speed Test *(deliberately deferred: a real bandwidth test needs either a new dependency or a 10-30s bandwidth-heavy run, neither of which fits the "quick glance" goal)*

---

# 🔌 Phase 11 — Extension SDK

Allow third-party developers to create widgets.

### Deliverables

- Public SDK
- Widget API
- Documentation
- Example widgets
- Version compatibility
- Safe loading

---

# 🚀 Phase 12 — Release Preparation

### Tasks

- Performance optimization
- Memory optimization
- Accessibility improvements
- Localization
- Documentation
- Automated testing
- CI/CD
- Flatpak package
- AppImage package
- DEB package

### Exit Criteria

Stable Release Candidate (RC)

---

# 📋 MVP Scope

The first public release is expected after the Widget Engine (Phase 5).

Some widgets planned for the MVP may initially be implemented using the Card Framework and later migrated to the Widget Engine if necessary.

The exact release scope may evolve based on implementation progress.

Included:

- Dashboard
- Card Framework
- CPU
- RAM
- Clipboard
- Notes
- Settings

> This list originally included Clock, Calculator, Screenshot and basic system
> controls. All of them were removed in ADR-016 and ADR-017 as duplicates of
> what GNOME already offers.

Everything else belongs to future releases.

---

# 🚫 Out of Scope (For Now)

The following features are intentionally postponed:

- AI assistants
- Cloud synchronization
- User accounts
- Online services
- Widget marketplace
- Windows support
- macOS support

These may be considered after a stable Linux release.

---

# 💡 Future Ideas

Potential future enhancements:

- Community Widget Marketplace
- AI-powered widgets
- Cross-device synchronization
- KDE Plasma integration
- GNOME Shell integration
- Wayland-specific enhancements
- Mobile companion application
- Additional system status widgets (GPU, disk usage, network speed) — only if
  a real need arises; not planned as a pre-built catalog (ADR-005/006)

These ideas are exploratory and not committed.

---

# 📈 Success Criteria

Project Nucleus succeeds when:

- It starts quickly.
- It feels native on Linux.
- It consumes minimal resources.
- Users can customize it without complexity.
- New features can be added without major architectural changes.

---

# 🧭 Guiding Principles

> Build working software first.

> Build concrete examples before abstractions.

> Keep the core small.

> Everything else should be a widget.

> Every release should deliver real value.