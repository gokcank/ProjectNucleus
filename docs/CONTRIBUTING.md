# 🤝 Project Nucleus

> **Contributing Guide**
>
> **Version:** 1.0
>
> Thank you for contributing to Project Nucleus.
>
> Our goal is not only to build a great application, but also to build it in a way that remains maintainable for years.

---

# Welcome

Contributions of all sizes are welcome.

Examples include:

- Bug fixes
- New features
- Documentation improvements
- Performance optimizations
- UI refinements
- Refactoring
- Accessibility improvements
- Testing

Quality is always preferred over quantity.

---

# Before You Start

Before contributing, please read:

- `docs/VISION.md`
- `docs/PRODUCT.md`
- `docs/ARCHITECTURE.md`
- `docs/UI_GUIDELINES.md`
- `docs/ROADMAP.md`
- `docs/DECISIONS.md`

These documents define the project's direction and should guide every contribution.

---

# Development Philosophy

Project Nucleus follows a few simple principles.

- Working software over perfect architecture.
- Simplicity over complexity.
- Readability over cleverness.
- Performance over visual effects.
- Consistency over personal preference.

When in doubt, choose the simpler solution.

---

# Architecture Rules

Contributors should respect the architectural decisions recorded in `docs/DECISIONS.md`.

Do not introduce major architectural changes without discussion.

Avoid:

- unnecessary abstractions
- overengineering
- tightly coupled modules
- duplicate responsibilities

The project intentionally grows incrementally.

---

# Coding Standards

General guidelines:

- Write readable code.
- Prefer small functions.
- Prefer descriptive names.
- Remove unused code.
- Avoid commented-out code.
- Keep files reasonably small.

Code should explain itself whenever possible.

---

# Project Structure

Place new code where it logically belongs.

Do not create new folders unless they provide a clear organizational benefit.

Avoid dumping unrelated utilities into generic folders.

---

# Documentation

Documentation is part of the product.

Whenever behavior changes:

- Update documentation.
- Update comments if necessary.
- Keep examples current.

Documentation should never become outdated.

---

# AI-Assisted Development

AI tools are welcome.

However:

- Review every generated change.
- Verify correctness.
- Verify security.
- Verify performance.
- Ensure consistency with project documentation.

AI should assist development—not replace engineering judgment.

Generated code is expected to meet the same quality standards as handwritten code.

---

# Commit Guidelines

Write clear commit messages.

Examples:

```text
feat: add clipboard widget

fix: resolve panel animation issue

refactor: simplify settings service

docs: update architecture guide

style: improve dashboard spacing
```

Avoid vague messages such as:

```text
update

changes

fix

misc
```

---

# Pull Requests

A pull request should:

- solve one problem
- remain reasonably small
- include a clear description
- explain architectural decisions when necessary

Large unrelated changes should be split into multiple pull requests.

---

# Issues

Before opening an issue:

- Search for existing reports.
- Provide reproduction steps.
- Include logs when relevant.
- Include screenshots when helpful.

Clear bug reports save time for everyone.

---

# Code Review

Reviews should focus on:

- correctness
- maintainability
- readability
- consistency
- performance
- user experience

Reviews should remain respectful and constructive.

Disagreement is acceptable.

Personal criticism is not.

---

# Performance

Performance is a feature.

Contributors should avoid introducing:

- unnecessary allocations
- excessive rendering
- expensive polling
- avoidable backend calls

Measure first.

Optimize second.

---

# Accessibility

Every new feature should consider accessibility.

Examples:

- keyboard navigation
- focus visibility
- readable contrast
- screen reader compatibility

Accessibility is not optional.

---

# Definition of Done

A task is considered complete only when:

- The feature works as intended.
- The project builds successfully.
- Linting passes.
- Formatting is correct.
- No obvious regressions exist.
- Documentation is updated when required.
- The implementation follows the project's architectural principles.

---

# What We Avoid

Project Nucleus intentionally avoids:

- Premature abstraction
- Feature creep
- Overengineering
- Unnecessary dependencies
- Breaking architectural consistency

If a solution feels overly complex, reconsider it.

---

# Communication

Be respectful.

Assume good intentions.

Discuss ideas openly.

Challenge technical decisions—not people.

Healthy disagreement improves software.

---

# Final Reminder

Project Nucleus is designed to grow slowly and deliberately.

Every contribution should make the project:

- simpler
- more maintainable
- more consistent
- easier to understand

---

# Guiding Principle

> **Build software that your future self—and every future contributor—will enjoy maintaining.**