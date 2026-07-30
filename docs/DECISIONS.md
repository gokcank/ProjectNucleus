# 📜 Project Nucleus

> **Architecture Decision Records (ADR)**
>
> **Version:** 1.0
>
> This document records important architectural and product decisions made throughout the project's lifetime.
>
> Once accepted, decisions should not be changed without strong justification.

---

# Purpose

Project Nucleus is expected to evolve over a long period of time.

This document exists to answer one simple question:

> **Why was this decision made?**

Every significant architectural or product decision should be documented here.

---

# Decision Status

Possible statuses:

- Proposed
- Accepted
- Superseded
- Deprecated
- Rejected

---

# ADR-001

## Title

Linux-First Development

### Status

Accepted

### Decision

Project Nucleus will be developed primarily for Linux.

### Rationale

Linux is the primary target platform.

Cross-platform support may be added later, but Linux should never become a secondary concern.

---

# ADR-002

## Title

Tauri v2 + Rust Backend

### Status

Accepted

### Decision

Use Tauri v2 with a Rust backend.

### Rationale

- Native performance
- Small binary size
- Strong Linux support
- Secure architecture
- Modern ecosystem

---

# ADR-003

## Title

React + TypeScript Frontend

### Status

Accepted

### Decision

Use React with TypeScript.

### Rationale

- Mature ecosystem
- Excellent tooling
- Predictable component model
- Strong AI-assisted development support

---

# ADR-004

## Title

Tailwind CSS v4

### Status

Accepted

### Decision

Tailwind CSS v4 is the styling solution.

### Rationale

- Fast development
- Consistent spacing
- Reusable utility classes
- Easy maintenance

---

# ADR-005

## Title

Cards Before Widgets

### Status

Accepted

### Decision

Implement real cards before designing the Widget Engine.

### Rationale

Premature abstraction creates rigid APIs.

Real implementations reveal the correct abstractions.

---

# ADR-006

## Title

Delay the Widget Engine

### Status

Accepted

### Decision

The Widget Engine will not be implemented before Phase 5.

### Rationale

The architecture should emerge from practical usage rather than theoretical design.

---

# ADR-007

## Title

Composition Over Inheritance

### Status

Accepted

### Decision

Favor composition instead of deep inheritance hierarchies.

### Rationale

Composition produces smaller, reusable, and easier-to-maintain components.

---

# ADR-008

## Title

Performance First

### Status

Accepted

### Decision

Performance takes priority over visual effects.

### Rationale

A responsive interface provides more value than expensive visual effects.

Animations and blur are enhancements—not requirements.

---

# ADR-009

## Title

Glass Effects Are Optional

### Status

Accepted

### Decision

Glass effects should degrade gracefully.

### Rationale

Desktop environments differ in rendering capabilities.

Visual effects must never reduce usability or responsiveness.

---

# ADR-010

## Title

Everything Else Should Become a Widget

### Status

Accepted

### Decision

After the Widget Engine is introduced, new functionality should be implemented as widgets whenever practical.

### Rationale

Widgets provide modularity, flexibility, and long-term scalability.

The core application should remain small.

---

# ADR-011

## Title

Keep the Core Small

### Status

Accepted

### Decision

Only essential functionality belongs in the core application.

### Rationale

Keeping the core lightweight reduces maintenance costs and improves long-term stability.

Optional functionality should be implemented as widgets or extensions.

---

# ADR-012

## Title

Native Linux Experience

### Status

Accepted

### Decision

Project Nucleus should follow Linux desktop conventions whenever practical.

### Rationale

Users should feel that Project Nucleus naturally belongs on their desktop rather than behaving like a cross-platform application.

---

# ADR-013

## Title

Incremental Development

### Status

Accepted

### Decision

Every development phase must produce a working application.

### Rationale

Working software provides faster feedback and reduces architectural risk.

---

# ADR-014

## Title

Avoid Feature Creep

### Status

Accepted

### Decision

New features must align with the product vision.

### Rationale

Project Nucleus is a control center—not an all-in-one desktop replacement.

Every feature should have a clear purpose.

---

# ADR-015

## Title

Documentation Is Part of the Product

### Status

Accepted

### Decision

Major architectural and product changes must be reflected in the documentation.

### Rationale

Documentation should remain synchronized with implementation to improve maintainability and AI-assisted development.

---

# ADR-016

## Title

Remove Widgets That Duplicate the Desktop

### Status

Accepted

### Decision

Nine shipped widgets were removed: Wi-Fi, Bluetooth, Volume, Brightness, Night
Light, Power Menu, Power Profile, Calendar, and Calculator.

### Rationale

Each of them already exists one click or one keystroke away in GNOME itself —
the first seven in the quick settings panel in the top bar, Calendar behind the
top bar clock, Calculator in the overview. Reaching the same control through
Nucleus is strictly slower: open the panel, find the card, then act.

`VISION.md` asks every feature to justify its existence, and these could not:
they were not filling a gap, they were adding a second, longer path to
something the desktop already does well. That is the definition of the feature
creep ADR-014 warns about, and it had accumulated without anyone deciding to
let it.

### Consequences

- Phase 7 (System Widgets) is almost entirely gone. Battery is the exception,
  and only because it reports peripheral batteries — a wireless mouse or
  headset — which the quick settings panel does not show.
- The dashboard is smaller and its remaining cards share a clearer theme:
  things the desktop does *not* already surface (CPU, RAM, Clipboard history,
  Notes, Quick Links, Todo, Pomodoro, Network detail, Colour Picker, QR
  Generator, Screenshot, Screen Recorder).
- Stored layouts referencing a removed widget are dropped automatically by
  `reconcile()` in `use-dashboard-layout.ts`; no migration was needed.
- This test — "does the desktop already do this in fewer steps?" — should be
  applied to new widget proposals before they are built, not after.

---

# ADR-017

## Title

Narrowing the Scope, Second Pass

### Status

Accepted

### Decision

Four more shipped widgets were removed: Clock, Screenshot, Screen Recorder and
QR Code.

### Rationale

ADR-016's test applied again. Three of the four have a direct, faster
equivalent already on the desktop:

- **Clock** — the top bar shows the time permanently, with no click at all.
  A stronger duplicate than anything in ADR-016, which at least cost a click.
- **Screenshot** — Print Screen is bound to GNOME's own tool by default.
- **Screen Recorder** — Ctrl+Alt+Shift+R is bound to GNOME's own recorder, and
  the card was calling that very service anyway.

**QR Code is the exception, and it is worth being clear about it.** GNOME ships
no built-in way to turn text into a QR code, so it does not fail the duplication
test the way the others do. It was removed as a deliberate scope decision by the
project owner, not because the desktop already covered it. If the scope ever
widens again, this is the one from these two rounds worth reconsidering first.

### Consequences

- Phase 8 (Utility Widgets) is left with Color Picker alone.
- Phase 3's original trio (Clock, CPU, RAM) is down to CPU and RAM. The MVP
  list in `ROADMAP.md` was rewritten to match, since most of what it named no
  longer exists.
- Two dependencies became unused and were dropped: `url` (Cargo) and
  `qrcode-generator` (npm). `ashpd`'s `screenshot` feature was **kept** —
  Color Picker's `Color::pick` sits behind that same flag, which was confirmed
  by removing it and watching the build fail.
- Twelve widgets remain. Together with ADR-016 this removed thirteen of
  twenty-five, and the frontend bundle went from 110 KB to 94 KB gzipped.

---

# Adding New Decisions

New ADRs should follow this template:

```md
# ADR-XXX

## Title

...

### Status

Proposed | Accepted | Superseded | Deprecated | Rejected

### Decision

...

### Rationale

...

### Consequences

...
```

---

# Guiding Principle

> **Good decisions outlive good code.**

Architectural decisions should be deliberate, documented, and easy to understand.