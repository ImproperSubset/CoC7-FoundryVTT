# Plan

- **Merge upstream's 9.2 into `hh-main`**, as `.hh/docs/releases.md` says:
  `git merge 9.2` on `hh-main`. It starts on the operator's go-ahead for the
  merge. 9.2 is 39 upstream commits past 8.16, which it descends from, and needs
  Foundry VTT 13 or later (8.16 took 12); upstream removed its Foundry 12 code.
  A trial with `git merge-tree` against `hh-main` conflicts in 8 files, all the
  fork's combat card work: `coc7/apps/chat-combat-melee.js`,
  `coc7/apps/chat-combat-ranged.js`, `coc7/apps/chat-dropdown.js`,
  `coc7/apps/roll-normalize.js`, `static/templates/chat/damage.hbs`,
  `static/templates/chat/melee-initiator.hbs`,
  `static/templates/chat/range-initiator.hbs` and
  `styles/coc7-chat-message.less`. Each is resolved keeping upstream's change
  and the fork's, and `coc7/hooks/init.js` keeps `game.CoC7.sanCheck`, the
  importer helpers and `game.CoC7.actorImporterType`.

  - Checked by the fork's own tests, `npm test`, all passing (90 pass on
    `hh-main` before the merge), then `npm run eslint` with zero errors and zero
    warnings, and the build of `.hh/docs/releases.md`.
  - `CLAUDE.md`'s `/* // FoundryVTT V12 */` marker style is checked against
    9.2's code, since upstream dropped Foundry 12, and changed in the merge's
    commit if upstream no longer uses it.
  - Releasing it as `9.2.hh.1`, and pushing `hh-main`, are the operator's.

- **Review the existing docs**: read the project's existing docs against the
  principles, as a whole set: `CLAUDE.md`, the project's own rules and the
  reference files `CLAUDE.md` names. `docs/` and the READMEs are upstream's
  documentation for people, kept in upstream's form, and not reviewed. Check
  each for a line wrong or stale against the code, the plan or the diary; a line
  restating the code; history, dates or counts; a line describing what is not
  yet built; a passage that belongs where it loads instead; the same thing said
  twice; one of the project's own rules `CLAUDE.md` does not name; and a line
  carrying a decision without its citation.
