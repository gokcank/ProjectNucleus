# Project Nucleus

Modular control center for Linux: a floating panel (global shortcut `ctrl+alt+n` or tray icon) with a widget dashboard, built with Tauri v2 (Rust) + React/TypeScript.

## Build & test
- System deps (Debian/Ubuntu names, see README): `libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev`
- `npm install` · dev: `npm run tauri dev` · frontend build: `npm run build`
- All checks: `npm run check` (ESLint, Prettier check, `cargo fmt --check`, `cargo clippy -- -D warnings`)
- Bundles (as CI): `npm run tauri build -- --bundles deb,appimage`; Snap from `snap/snapcraft.yaml`;
  Flatpak from `flatpak/io.github.gokcank.ProjectNucleus.yml` via `flatpak run org.flatpak.Builder`.
- CI (`.github/workflows/build.yml`) builds all four package formats as artifacts and publishes nowhere.

## Layout
- `src/features/widgets/<id>/<id>-widget.tsx` — one folder per widget; registry in `src/features/widgets/registry.ts`.
- `src-tauri/` — Rust backend; all system access goes through Tauri commands. Window capabilities in `src-tauri/capabilities/`.
- `docs/` — product and architecture documents (see below). `flatpak/`, `snap/` — packaging.

## Read on demand (do not preload)
- `docs/VISION.md` — mission, principles, what Nucleus is and is not.
- `docs/PRODUCT.md` — product spec: goals, target users, core features, non-goals.
- `docs/ARCHITECTURE.md` — layers, frontend/backend structure, state, security and performance rules.
- `docs/UI_GUIDELINES.md` — visual style, glass effects, layout, icons (Lucide only).
- `docs/ROADMAP.md` — phases 0–12 with per-widget status and reasons for removed/deferred widgets.
- `docs/DECISIONS.md` — ADR-001…019; read before adding, removing or reshaping a widget.
- `docs/CONTRIBUTING.md` — coding standards, commit style, definition of done.
- `docs/WIDGET_API.md` — the `WidgetDefinition` contract every widget uses.
- `docs/AI_MODEL.md` — model/effort scenario table.

## Project rules
- Before proposing any work step, also recommend a model and effort level using `docs/AI_MODEL.md`.
- Add a new doc or ADR only when real development needs it, and only after asking the user.
- Test every new widget against ADR-016 first: "does the desktop already do this in fewer steps?"
- Network use only if opt-in, needs no account/key, and degrades quietly offline (ADR-019).
- The frontend never runs system commands; no shell interpolation of user input.
- Widget `id` is the layout persistence key: never change it once shipped.
- The panel hides on focus loss: avoid flows that open child dialogs (password, permission prompts).
- Keep docs in sync with behaviour (ADR-015). Commit messages: `feat:`, `fix:`, `docs:`, `refactor:`, `style:` …
- Publishing (Flathub, Snap Store, GitHub Releases) is manual and needs the user's approval each time.

## Status (as of 2026-11-07)
- Project status: **archived** (set 2026-11-18; source of truth: the brain page).
- Version 1.0.0, tag `v1.0.0` on `main`; 16 widgets; all four packages build in CI.
- Not published anywhere yet. No work since 2026-08-07; a native GTK rewrite exists as a separate project.

## Open items
- Flathub submission, Snap Store upload, GitHub Release with `.deb`/AppImage (each needs approval).
- README badge and "not yet published" texts disagree with the 1.0.0 tag.
- Deferred widgets: Fan, QR Scanner, Speed Test; media widgets (Phase 9) not started.

## More context
Background, decisions and history are in the second brain: `/home/gokcank/ikinci-beyin/projects/project-nucleus.md` (read on demand).
