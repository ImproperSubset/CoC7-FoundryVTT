# CoC7-FoundryVTT, the ImproperSubset fork

This is the ImproperSubset fork of the CoC7 system for Foundry VTT. It carries
the fork's own commits on top of upstream's releases, and releases them under
its own versions and manifest. `CLAUDE.local.md`, untracked, holds what is
private to the operator's machines.

The fork exposes `game.CoC7.sanCheck`, the importer helpers on `game.CoC7` and
`game.CoC7.actorImporterType` for the operator's modules, which call them; each
merge of an upstream release keeps them. `game.CoC7.developLuck(message)` is one
of them: it applies `actor.developLuck()`'s gain to a rolled Luck check card's
d100, at most once per card, and returns whether it did (diary decision
2026-11-16: a Luck improvement from a rolled Luck check card).

## Branches

- `hh-main` is the fork's one working branch: upstream's latest release with the
  fork's commits on top. Each new upstream release is merged into it, with the
  fork's own tests as the check, and a release's source is kept by its tag
  (diary decision 2026-11-14: upstream releases merged into hh-main).
- The fork's `develop` and `master` mirror upstream and are never changed.
- A pull request to upstream targets `develop`, so a branch going into one
  carries only its own commits, rebased onto `develop`. `actor-importer-types`
  is such a candidate: the importer commits alone on the 8.16 release.
- A pushed branch is never rewritten in place: rename it on GitHub, or push its
  tip as a new branch, then push the replacement under the old name.

Versions, releases and taking a new upstream release are in
`.hh/docs/releases.md`.

## Writing code

- The fork's own path-scoped rule `.claude/rules/coc7-foundryvtt-code.md`, the
  maintainer's style and where UI strings go, loads when a source file, template
  or language file is read or edited; read it before writing code (diary
  decision 2026-11-19: the fork's code style in a path-scoped rule).
- Before every commit: `npx eslint --fix` on the changed files only (never the
  whole tree), then `npm run eslint` with zero errors and zero warnings,
  `npx cspell` on the changed files against `cspell.json`, `npm test`, and
  `git diff` to confirm only our lines changed and `.editorconfig` line endings
  and final newlines hold.

## Tests

The tests are `test/**/*.js`: `node:test` files run by `npm test`, and the
helpers they share. Everything else is mainline code (diary decision 2026-11-14:
test file globs).

## Glossary

Terms used only in this project; shared terms are in the `glossary` rule.

- **Upstream**: the Miskatonic-Investigative-Society CoC7 repository, the
  `upstream` remote, whose releases the fork merges.
- **`.hh.<build>` release**: a fork release, versioned as the CoC7 release it
  carries, then `hh` and a build number, such as `8.16.hh.8`.
