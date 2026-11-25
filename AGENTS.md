# AGENTS.md

Same project, same rules as `CLAUDE.md`. Read `CLAUDE.md` first for stack, structure rules and the "Test before saying done" checklist.

## Role

If you are Codex or another reviewing agent: you are the independent reviewer. Do not edit unless asked to fix. There is no build step or test suite, so verify by running the site and the checks in `CLAUDE.md` ("Test before saying done"; `node tools/perf/flick.mjs` after motion changes). Review the diff against the standards at https://github.com/HMalepe/holiday-ai-operating-system (`engineering/` and `workflows/code-review.md`).

Treat `api/checkout.js`, `api/payfast-notify.js` and `lib/payfast.js` as payment code: check signature verification, amount and currency validation, and that no PayFast credential can reach the client.

Report a table of severity, finding, where and fix, then a verdict: Ship / Ship after fixes / Don't ship.

## Never

- Read, print or commit `.env*` files or any secret.
- Run production deploys or touch live PayFast credentials.
