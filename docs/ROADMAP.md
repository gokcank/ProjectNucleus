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
| Current Phase | Phases 6–8 — Productivity, System & Utility Widgets (all three in progress in parallel; see each phase for exact status) |
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

- Clock
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
- ✅ Calculator
- ✅ Notes
- ✅ Timer
- ✅ Stopwatch
- ✅ Quick Links
- ✅ Todo
- ✅ Pomodoro
- ✅ Calendar *(month view only — showing appointments would mean hooking into the desktop's calendar service, beyond the at-a-glance goal)*

---

# 🖥️ Phase 7 — System Widgets

Examples

- Wi-Fi
- ✅ Bluetooth
- ✅ Volume
- ✅ Brightness
- ✅ Battery
- ✅ Night Light
- ✅ Power Menu
- ✅ Power Profile *(not in the original example list — added once it shipped, per ADR-015)*

---

# 🧰 Phase 8 — Utility Widgets

Examples

- ✅ Screenshot
- Screen Recorder
- ✅ Color Picker
- QR Generator
- QR Scanner
- File Search

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

- ✅ Network Status *(shipped together with IP Information as one "Network" widget — connection type, SSID, local and public address answer the same question)*
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
- Clock
- CPU
- RAM
- Calculator
- Clipboard
- Screenshot
- Basic System Controls
- Settings

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