# Changelog

## [0.1.1] - 2026-07-24

### Fixed
- npm publish: pass `--access public` so provenance works on first publish.
- README: document the `status` command; drop the `pi-aesisify` migration note.

## [0.1.0] - 2026-07-24

### Added
- Initial standalone release, extracted from `pi-aesisify` into its own
  [pi](https://pi.dev) package.
- Online prompt-difficulty classifier that auto-sets pi's thinking level each
  turn. Inspired by oh-my-pi's `auto` thinking level.
- `/auto-thinking` command: `on | off | status`.
- Per-turn config under `~/.pi/agent/pi-auto-thinking/config.json` with
  project-local shadowing (`<project>/.pi/pi-auto-thinking/config.json`).
- Rolling decision/fallback logs under `~/.pi/agent/pi-auto-thinking/logs/`.
- Thinking levels derived from pi's `getSupportedThinkingLevels(model)` — never
  hard-coded; clamped into user-configured `minLevel`…`maxLevel` bounds.
- Never throws: on timeout, missing key, or unparseable reply it preserves the
  current level.
