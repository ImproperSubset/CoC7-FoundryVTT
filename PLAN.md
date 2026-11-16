# Plan

- **New duplication**: `test/combat-cards.js:129-142`,
  `test/maneuver.test.js:69-81` and
  `test/melee-response-dropdown.test.js:42-54`, a test set new since def0f082.
  Remove it with `/hh-dedupe`, or keep it with the operator's agreement.
- **New duplication**: `test/chat-combat-ranged.test.js:60-78` and
  `test/combat-cards.js:160-178`, a test set new since def0f082. Remove it with
  `/hh-dedupe`, or keep it with the operator's agreement.
- **New duplication**: `coc7/apps/chat-combat-melee.js:510-527` and
  `coc7/apps/chat-combat-ranged.js:856-873`, a mainline set new since def0f082.
  Remove it with `/hh-dedupe`, or keep it with the operator's agreement.
- **New duplication**: `static/templates/chat/melee-initiator.hbs:131-136` and
  `static/templates/chat/melee-target.hbs:109-114`, a mainline set new since
  def0f082. Remove it with `/hh-dedupe`, or keep it with the operator's
  agreement.

## Later

- **Review the existing docs**: read the project's existing docs against the
  principles, as a whole set: `CLAUDE.md`, the project's own rules and the
  reference files `CLAUDE.md` names. `docs/` and the READMEs are upstream's
  documentation for people, kept in upstream's form, and not reviewed. Check
  each for a line wrong or stale against the code, the plan or the diary; a line
  restating the code; history, dates or counts; a line describing what is not
  yet built; a passage that belongs where it loads instead; the same thing said
  twice; one of the project's own rules `CLAUDE.md` does not name; and a line
  carrying a decision without its citation.
- **Pin cspell**: CLAUDE.md has `npx cspell` run by hand before each commit,
  which fetches an unpinned version. Run it as a pinned hook among the fork's
  own checks in prek.toml, beside eslint, and drop the by-hand step.
