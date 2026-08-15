# Changelog

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Manifest V3 extension scaffold on Vite, CRXJS, React and Tailwind.
- Side panel entry point and service worker that opens it from the toolbar icon.
- Manifest built at compile time from environment variables, so the OAuth client ID and the
  extension key stay out of the repository.
- English and French interface, with the language following the browser and overridable from a
  picker in the panel. The choice persists.
- Localised extension name and description through Chrome's `_locales` mechanism.
- Lint, format, type check, test and build pipeline, enforced locally by git hooks and in CI.

### Notes

- TypeScript is pinned to 6.x. TypeScript 7 builds correctly but `typescript-eslint` does not
  support it yet, which would cost type-aware linting.
