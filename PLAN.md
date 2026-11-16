# Plan

- **Loose end**: whether the server's ssh alias goes in
  `~/.config/hh-rules/identity.toml`, so a commit naming it is refused; asked of
  the operator after hh-advise found it in a diary line, unanswered. Settled by
  the operator's answer.
- **Loose end**: issue #5, a cost summary in the spell sheet's header from the
  cost list, is open and not in the plan; asked of the operator whether to start
  it, unanswered. Settled by the operator scheduling or declining it.
- **Loose end**: hh-advise's review of the Keeper hold (81f451bd, 4cf10dfe), on
  this session's report, had not come back at the wrap. Settled by its findings
  being dealt with.
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
