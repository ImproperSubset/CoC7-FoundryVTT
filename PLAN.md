# Plan

- **Release 9.2.hh.1**: push `hh-main` and release it as `9.2.hh.1`, as
  `.hh/docs/releases.md` says, on the operator's go-ahead for the push and the
  release. It needs Foundry VTT 13 or later on each instance before the instance
  takes the update. Checked by the release workflow's run and the instance's
  `system.json` showing `9.2.hh.1` and the fork's manifest; the combat cards
  (melee and ranged pool buttons with their checkboxes, the Pulp Prone dice, the
  Build tag, the response card's talents) are tried in a world, since no test
  renders a template.

- **Review the existing docs**: read the project's existing docs against the
  principles, as a whole set: `CLAUDE.md`, the project's own rules and the
  reference files `CLAUDE.md` names. `docs/` and the READMEs are upstream's
  documentation for people, kept in upstream's form, and not reviewed. Check
  each for a line wrong or stale against the code, the plan or the diary; a line
  restating the code; history, dates or counts; a line describing what is not
  yet built; a passage that belongs where it loads instead; the same thing said
  twice; one of the project's own rules `CLAUDE.md` does not name; and a line
  carrying a decision without its citation.
