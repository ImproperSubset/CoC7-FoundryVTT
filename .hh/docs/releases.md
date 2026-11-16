# Versions and releases

## Versions

- A fork version is the CoC7 release `hh-main` carries, then `hh` and a build
  number: `8.16.hh.4`, then `9.2.hh.1` on 9.2. Foundry VTT compares versions
  part by part, so each counts as newer than the one before and than the CoC7
  release itself. A fix without a new CoC7 release bumps the build number.
- Every build that reaches a server instance carries a `.hh.<build>` version and
  the fork's manifest. A build straight from the branch carries upstream's plain
  version and manifest, so it would look like upstream's release and take
  upstream's updates. `static/system.json` on the branch stays upstream's; the
  release workflow writes the fork's values.
- Foundry instances install the system from the fork's release manifest URL and
  get new releases as Foundry updates. A build from a clone never goes into a
  server instance in place of a release.
- A local Foundry runtime used for testing runs a build of the branch, so the
  fork's changes can be tried without a release (diary decision 2026-11-16:
  local runtimes run the branch). Its upstream manifest offers upstream's
  releases as system updates there; those are declined, and the branch is built
  again instead.

## Releasing

A release is made only when the operator asks for one, once the change has been
tried on the test server, a local Foundry runtime running a build of the branch
(diary decision 2026-11-16: releases only when asked, after a trial).

Release with:

```sh
tag=<version>.hh.<build>
gh release create "${tag}" --target hh-main --title "${tag}" --notes "..."
```

`.github/workflows/fork-release.yml` checks the tag is `static/system.json`'s
version plus `.hh.<build>`, installs with `npm ci` from `package-lock.json`, not
`npm install`, so a release is built from the dependencies that were tested. The
fork tracks `package-lock.json`, which upstream ignores, so the workflow has it
(diary decision 2026-11-16: releases built from the tracked lock file). The
release builds the system and its packs, points `version`, `url`, `manifest` and
`download` in `system.json` at the fork, and attaches `system.json` and
`system.zip`. `gh release create` publishes before the workflow runs, so a
stopped wait still leaves the release published.

## Taking a new upstream release

Each upstream release is merged into `hh-main`, never rebased onto (diary
decision 2026-11-14: upstream releases merged into hh-main):

```sh
git fetch upstream --tags
git switch hh-main
git merge <release>
```

A conflict is resolved keeping both upstream's change and the fork's. A conflict
in `coc7/hooks/init.js` means the system changed the `game.CoC7` object; re-add
the fork's imports and entries. Upstream does not track `package-lock.json`, so
the merge leaves it as it was: after the merge, run `npm install` to bring it in
line with upstream's `package.json`, and commit it with the merge (diary
decision 2026-11-16: releases built from the tracked lock file). The merge is
checked by the fork's own tests, `npm test`, and by `npm run eslint` and a
build. It then ships as `<release>.hh.1`.

Commits taken from upstream between its releases are cherry-picked onto
`hh-main` and ship as the next `.hh.<build>` release; the next release's merge
takes them in.

## Building

- Into a local Foundry VTT data folder: `npm install`, `npm run init`,
  `npm run compendiums-build`, `npm run manuals-build`,
  `npm run roll-requests-build`, `npm run build`.
- `npm run build` (production) copies packs from `binary-packs/`, so
  `npm run compendiums-build` comes first; it empties the build folder and
  rewrites every compendium pack. `npx webpack --mode development` writes the
  code and keeps watching until killed.
- A build goes into a runtime only while its world is stopped. The development
  build skips a pack only when it cannot open the pack's `LOCK` file, which on
  Linux it always can, so it copies the packs even into a world that has them
  open (diary decision 2026-11-16: builds only into a stopped world).
