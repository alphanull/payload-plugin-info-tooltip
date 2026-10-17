# Changelog

All notable changes to this project will be documented in this file.

This project adheres to [Semantic Versioning](https://semver.org) and follows the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format.

---

## [1.0.1] - 2026-10-17

### Fixed

- The README now shows on npm.

## [1.0.0] - 2026-10-17

### Added

- This marks the first release of **@alphanull/payload-plugin-info-tooltip**.
- Shows `admin.custom.infoTooltip` as an info icon next to the field label.
- Accepts the same values as `admin.description`: a string, a locale object, or a function `({ t, i18n }) => string`.
- Optionally turns every `admin.description` into a tooltip (`useDescriptions: true`), with a per-field opt-out.
- Covers fields inside Lexical (link fields, blocks, inline blocks, nested editors), with no change to your `lexicalEditor` calls.
- Optional icon on list-view column headings.
- Works with keyboard and screen readers, with an option to drop the extra tab stop.
- `LabelWithInfo` and `InfoTooltip` for labels you write yourself, and a `labelComponent` option to swap labels by rule.
- Themeable through CSS variables, using Payload 4 tokens with Payload 3 fallbacks.
- Tested with Payload 3.90.2, 3.91.0, 4.0.0-beta.0, and 4.0.0-beta.2.
