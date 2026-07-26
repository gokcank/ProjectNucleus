# 🏗️ Project Nucleus

> **Architecture Documentation**
>
> **Version:** 1.0
>
> **Status:** Draft

---

# Overview

Project Nucleus follows a modular architecture built around reusable components.

The application is intentionally divided into independent layers to improve maintainability, scalability, and long-term development.

Every layer has a single responsibility.

---

# Architecture Principles

## Modular

Features should be isolated whenever practical.

Changes to one module should have minimal impact on others.

---

## Simple First

Avoid unnecessary abstractions.

Prefer concrete implementations before introducing reusable systems.

> **Build concrete examples first. Extract abstractions later.**

---

## Composition Over Inheritance

Build features by composing small components rather than creating deep inheritance hierarchies.

---

## Separation of Concerns

Business logic, UI, platform integration, and state management should remain independent.

---

## Native Experience

Desktop integration belongs to the backend.

Presentation belongs to the frontend.

---

# High-Level Architecture

```text
+--------------------------------------------------+
|                   React UI                        |
+--------------------------------------------------+
|        Components / Cards / Widgets              |
+--------------------------------------------------+
|              Application State                   |
+--------------------------------------------------+
|                Tauri Commands                    |
+--------------------------------------------------+
|                 Rust Backend                     |
+--------------------------------------------------+
| Linux APIs | Settings | System Services | IPC    |
+--------------------------------------------------+
```

---

# Technology Stack

## Frontend

- React
- TypeScript
- Tailwind CSS v4
- Vite

---

## Backend

- Rust
- Tauri v2

---

## Communication

Frontend and backend communicate exclusively through Tauri commands.

Direct platform access from the frontend is not allowed.

---

# Project Structure

```text
project-nucleus/

├── src/
│
├── src-tauri/
│
├── docs/
│
├── assets/
│
├── public/
│
└── README.md
```

---

# Frontend Structure

```text
src/

app/
components/
features/
layouts/
pages/
hooks/
services/
stores/
types/
utils/
styles/
```

---

# Backend Structure

```text
src-tauri/

commands/
services/
system/
models/
utils/
state/
```

---

# Layer Responsibilities

## UI Layer

Responsible for:

- Rendering
- Animations
- User interaction

Should never contain platform-specific logic.

---

## Feature Layer

Contains independent application features.

Examples:

- Dashboard
- Settings
- Clipboard
- Screenshot

Features should remain isolated.

---

## Service Layer

Handles communication with Rust.

Examples:

- Clipboard Service
- Screenshot Service
- Settings Service

---

## Backend Layer

Responsible for:

- Linux APIs
- File access
- System integration
- Hardware interaction
- Permissions

---

# State Management

Global state should remain as small as possible.

Prefer:

- Local component state
- Feature-specific state
- Shared state only when necessary

Avoid a single massive global store.

---

# Error Handling

Errors should never crash the application.

Every error should be:

- Logged
- User-friendly
- Recoverable whenever possible

---

# Configuration

User configuration should be separated from application code.

Configuration should include:

- Theme
- Widget layout
- Window state
- Preferences

---

# Performance

Performance is a design requirement.

Rules:

- Lazy load when possible.
- Avoid unnecessary re-renders.
- Minimize backend calls.
- Cache expensive operations.
- Keep startup lightweight.

---

# Security

The frontend must never execute arbitrary system commands.

All privileged operations must go through the Rust backend.

Validate every input before execution.

---

# Scalability

The architecture should support:

- New features
- New widgets
- New settings
- Future plugin support

without requiring large refactors.

---

# Future Architecture

The initial releases intentionally avoid introducing a generic widget engine.

Instead:

1. Build real cards.
2. Observe common behavior.
3. Extract shared components.
4. Introduce the widget system only after patterns emerge.

This approach reduces premature abstraction and produces a more maintainable architecture.

---

# Architectural Rules

- One responsibility per module.
- Keep modules independent.
- Prefer composition over inheritance.
- Keep abstractions small.
- Avoid unnecessary complexity.
- Optimize for readability.
- Build working software first.
- Refactor when patterns become obvious.

---

# Final Principle

> **Good architecture is discovered through implementation—not speculation.**