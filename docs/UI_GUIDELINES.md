# 🎨 Project Nucleus

> **UI Guidelines**
>
> **Version:** 1.0
>
> **Status:** Draft

---

# Philosophy

Project Nucleus should feel like a first-party Linux application.

The interface must prioritize usability, clarity, and speed over visual complexity.

Every visual decision should support the user's workflow.

---

# Design Goals

The UI should feel:

- Native
- Modern
- Calm
- Lightweight
- Responsive
- Professional

The interface should never feel flashy or distracting.

---

# Visual Style

Project Nucleus follows a modern desktop aesthetic based on layered surfaces.

Visual characteristics include:

- Floating panels
- Rounded corners
- Subtle transparency
- Background blur (when supported)
- Thin semi-transparent borders
- Soft shadows
- Comfortable spacing
- Restrained animations

Glass effects should improve depth and readability.

They should never become the focus of the interface.

---

# Glassmorphism Guidelines

Glass is an enhancement—not a requirement.

## Preferred

- Frosted glass backgrounds
- Low-opacity surfaces
- Soft blur
- Thin borders
- Layered depth
- Soft shadows

## Avoid

- Heavy blur
- Neon glow
- RGB lighting
- Excessive transparency
- Overlapping visual noise
- Decorative effects without purpose

If glass negatively impacts performance or readability, use solid surfaces instead.

---

# Layout

The application uses a card-based dashboard.

```
Panel
│
├── Header
│
├── Dashboard
│   ├── Card
│   ├── Card
│   ├── Card
│   └── Card
│
└── Footer (optional)
```

Cards are the primary building blocks of the interface.

---

# Grid System

- Responsive layout
- Consistent spacing
- Uniform alignment
- No overlapping cards

Cards should resize naturally while preserving readability.

---

# Spacing

Use a consistent spacing scale.

| Size | Value |
|------|------:|
| XS | 4px |
| SM | 8px |
| MD | 12px |
| LG | 16px |
| XL | 24px |
| XXL | 32px |

Avoid arbitrary spacing values.

---

# Border Radius

Use soft corners.

| Component | Radius |
|-----------|--------|
| Buttons | 10px |
| Inputs | 10px |
| Cards | 18px |
| Panels | 24px |
| Dialogs | 24px |

Avoid sharp corners.

---

# Shadows

Use shadows to communicate elevation.

Shadows should remain subtle.

Never use dramatic shadows.

---

# Borders

Glass surfaces should use thin borders.

Typical border:

- 1px
- Semi-transparent
- Low contrast

Borders separate layers without becoming visually dominant.

---

# Typography

Use a clean sans-serif font.

Recommended:

- Inter
- System UI font

Typography hierarchy:

- Display
- Heading
- Title
- Body
- Caption

Avoid decorative fonts.

---

# Icons

Use **Lucide Icons** throughout the application.

Rules:

- Outline style only
- Consistent size
- Consistent stroke width
- Icons support text—they never replace it

Avoid mixing icon libraries.

---

# Color System

Support both:

- Light Theme
- Dark Theme

Accent color should be configurable.

Semantic colors:

- Success
- Warning
- Error
- Information

Avoid using color as the only indicator.

---

# Cards

Cards are the core UI component.

Every card should contain only the information necessary for its purpose.

A typical card consists of:

- Header
- Content
- Actions (optional)
- Status (optional)

Cards should never become mini applications.

---

# Buttons

Buttons should clearly communicate priority.

Types:

- Primary
- Secondary
- Ghost
- Destructive

Primary actions should be limited.

Avoid multiple competing primary buttons.

---

# Inputs

Forms should remain simple.

Rules:

- Clear labels
- Helpful placeholders
- Immediate validation
- Keyboard friendly

---

# Animations

Animations should communicate state changes.

Recommended durations:

| Type | Duration |
|-------|----------|
| Fast | 150ms |
| Normal | 200ms |
| Slow | 250ms |

Preferred easing:

- ease-out

Avoid long animations.

The interface should always feel responsive.

Animations must never delay availability: the panel should become visible and interactive within the 100 ms target, while opening animations may continue afterwards.

---

# Accessibility

Project Nucleus should be usable without a mouse.

Requirements:

- Full keyboard navigation
- Visible focus indicators
- Screen reader compatibility
- High contrast support
- Minimum touch target of 40×40px

Accessibility is a requirement—not an enhancement.

---

# Performance

Visual effects must never reduce responsiveness.

If necessary:

- Reduce blur
- Reduce transparency
- Disable animations
- Prefer simpler rendering

Performance always takes priority over aesthetics.

---

# Responsive Design

The interface should gracefully adapt to:

- Small laptops
- Large monitors
- Different display scaling
- Different desktop environments

No fixed layouts.

---

# Design Rules

Always:

- Keep interfaces clean.
- Prioritize content.
- Use whitespace intentionally.
- Maintain visual consistency.
- Design for daily use.

Never:

- Overload the interface.
- Add unnecessary controls.
- Animate everything.
- Use effects without purpose.
- Sacrifice usability for appearance.

---

# User Experience Principles

Every interaction should feel:

- Fast
- Predictable
- Intentional
- Lightweight

Users should rarely need documentation to understand the interface.

---

# Golden Rules

> Less, but better.

> Consistency over creativity.

> Speed over decoration.

> Content over chrome.

> Performance over visual effects.

> Every element should have a purpose.