# Plan

- **Try 9.2.hh.1 in a world**: install the `9.2.hh.1` release on an instance
  through Foundry's update, on the operator's go-ahead, since one instance hosts
  a live campaign. Both instances run Foundry 14 and install the system from the
  fork's manifest, so the release shows there as an update. Checked by the
  instance's `system.json` showing `9.2.hh.1` and the fork's manifest, and by
  trying the combat cards in a world (melee and ranged pool buttons with their
  checkboxes, the Pulp Prone dice, the Build tag, the response card's talents),
  since no test renders a template.

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
