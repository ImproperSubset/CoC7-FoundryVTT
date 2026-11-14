# Plan

- **Wrap finding**: `PLAN.md` and `diary/2026-11-14.md` say, in this public
  repository, how many Foundry instances run the system, which Foundry version
  they run, and that one hosts a live campaign; no host, path or address is
  named. Proposed: the operator decides whether such facts belong only in
  `CLAUDE.local.md`; if so, the plan line is reworded, and the diary, being
  append-only and pushed, stays.

- **New duplication**: `static/templates/chat/melee-initiator.hbs:71-88` and
  `static/templates/chat/melee-target.hbs:85-101`, a mainline exact set new
  since 3b821288. Remove it with `/hh-dedupe`, or keep it with the operator's
  agreement.

- **New duplication**: `static/templates/chat/melee-initiator.hbs:32-48` and
  `static/templates/chat/melee-target.hbs:33-48`, a mainline exact set new since
  3b821288. Remove it with `/hh-dedupe`, or keep it with the operator's
  agreement.

- **New duplication**: `static/templates/chat/range-initiator.hbs:87-92` and
  `static/templates/chat/range-initiator.hbs:95-100`, a mainline exact set new
  since 3b821288. Remove it with `/hh-dedupe`, or keep it with the operator's
  agreement.

- **Try 9.2.hh.1 in a world**: install the `9.2.hh.1` release on an instance
  through Foundry's update, on the operator's go-ahead, since one instance hosts
  a live campaign. Both instances run Foundry 14 and install the system from the
  fork's manifest, so the release shows there as an update. Checked by the
  instance's `system.json` showing `9.2.hh.1` and the fork's manifest, and by
  trying the combat cards in a world (melee and ranged pool buttons with their
  checkboxes, the Pulp Prone dice, the Build tag, the response card's talents),
  since no test renders a template.

- **Review the existing docs**: read the project's existing docs against the
  principles, as a whole set: `CLAUDE.md`, the project's own rules and the
  reference files `CLAUDE.md` names. `docs/` and the READMEs are upstream's
  documentation for people, kept in upstream's form, and not reviewed. Check
  each for a line wrong or stale against the code, the plan or the diary; a line
  restating the code; history, dates or counts; a line describing what is not
  yet built; a passage that belongs where it loads instead; the same thing said
  twice; one of the project's own rules `CLAUDE.md` does not name; and a line
  carrying a decision without its citation.
