# pi-auto-thinking

[![npm version](https://img.shields.io/npm/v/pi-auto-thinking.svg)](https://www.npmjs.com/package/pi-auto-thinking)
[![Tests](https://github.com/aesisify/pi-auto-thinking/actions/workflows/test.yml/badge.svg)](https://github.com/aesisify/pi-auto-thinking/actions/workflows/test.yml)
[![license: MIT](https://img.shields.io/npm/l/pi-auto-thinking.svg)](./LICENSE)

A [pi](https://pi.dev) extension that auto-sets the thinking level each turn via
an **online prompt-difficulty classifier**. The idea is borrowed from
[oh-my-pi](https://github.com/can1357/oh-my-pi)'s `auto` thinking level.

Each interactive turn, before the agent runs, a small **classifier model** rates
the prompt `low | medium | high | xhigh`, clamps it into your configured bounds,
and sets the thinking level for that turn. Trivial prompts stay cheap; hard ones
get reasoning budget. Short continuations (`continue`, `yes`, `ok`) return `keep`
and leave the level unchanged. On any failure (timeout, no key, unparseable
reply) it preserves the current level and never throws.

The valid thinking levels are never hard-coded — they come from pi's
`getSupportedThinkingLevels(model)`, so the classifier only ever picks among
levels the active model actually offers.

## Install

```bash
pi install npm:pi-auto-thinking
```

Or from git:

```bash
pi install git:github.com/aesisify/pi-auto-thinking
```

> Published with SLSA provenance — verify with `npm audit signatures`.

## Configure

Config lives under a `pi-auto-thinking/` folder in your pi config root.
Project-local config shadows user-global.

- User:     `~/.pi/agent/pi-auto-thinking/config.json`
- Project:  `<project>/.pi/pi-auto-thinking/config.json`

```json
{
  "enabled": true,
  "classifier": "ollama/qwen2.5:3b",
  "classifierLevel": "off",
  "minLevel": "low",
  "maxLevel": "xhigh",
  "timeoutMs": 8000,
  "maxTokens": 512
}
```

`ollama/qwen2.5:3b` is recommended for a local [ollama](https://ollama.com)
classifier — small and fast enough to rate each prompt near instantly, with no
per-turn cost. Pull it with `ollama pull qwen2.5:3b`. Any cloud model
(`anthropic/claude-haiku-4-5`, `openai/gpt-5-mini`, …) works too.

| field             | default   | notes                                                 |
| ----------------- | --------- | ---------------------------------------------------- |
| `enabled`         | `true`    | Master switch. `false` disables the classifier.      |
| `classifier`      | _(none)_  | `"provider/model"` — pi convention. Unset ⇒ inactive.|
| `minLevel`        | `low`     | Floor.                                               |
| `maxLevel`        | `xhigh`   | Ceiling.                                             |
| `timeoutMs`       | `4000`    | Per-turn classification budget before fallback.      |
| `maxTokens`       | `4096`    | Reasoning-safe cap (headroom for thinking-on models).|
| `classifierLevel` | `off`     | Reasoning effort for the classifier call.            |

## Commands

```
/auto-thinking          # status (default): active, classifier, bounds, last decision
/auto-thinking status   # explicit status
/auto-thinking on|off   # toggle for this session
```

Config is re-read each turn; run pi's built-in `/reload` to re-initialize after editing.

A footer statusline shows `auto→high` (last decision) or `auto:off`.

## Logs

Decision/fallback events are written to rolling log files:

- `~/.pi/agent/pi-auto-thinking/logs/<date>.log`

Rotation: daily, max 5 MB per file, keep 14 days.

## Tests

Node-native (`node:test`), no framework. Requires Node ≥22.6 (unit) / ≥22.7 (integration).

```bash
npm test                 # unit tests (pure functions + config/logger/paths)
npm run test:integration # extension wiring via a loader + shims
npm run test:all         # both
```

## License

[MIT](./LICENSE) © aesisify
