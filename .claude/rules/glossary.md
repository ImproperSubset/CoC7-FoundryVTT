# Glossary

The words Claude and the operator use with each other. This file holds terms
shared across projects; a project's own terms are in the `## Glossary` section
of its `CLAUDE.md` (diary decision 2026-11-01: glossaries).

## How the glossary works

- A glossary entry is part of the interface between Claude and the operator, so
  it is designed together. When Claude wants a new term, or a change to an
  entry, it proposes the term and definition in conversation, discusses them,
  and writes the entry only once the operator agrees.
- Claude uses no project jargon with the operator unless it is in a glossary.
  Otherwise it says the thing in plain words.
- Entries are only terms coined here, or ordinary words used in a narrower
  sense, that come up in conversation with the operator. Standard industry terms
  stay out. Terms used only in Claude's own records, such as the diary's, stay
  in the rules that define them.
- Definitions are plain words, written for the operator.
- An entry says what a term means now. Renames and earlier meanings go in the
  diary (diary decision 2026-11-01: glossary entries hold current meaning only).
- A local glossary may say what an overloaded word means in that project, for
  example "rules" in a board-game project.

## Terms

- **rules pack**: a set of hh-rules rule files for one kind of work, such as
  Python or RPG PDFs, sometimes with commit checks and skills, that a project
  chooses to install.
- **install**: what a project does with an hh-rules rule, skill or rules pack:
  it lists it in its `rulesync.jsonc`, and `/hh-rules` puts the files into the
  project at its pinned tag (diary decision 2026-11-14: install as the word for
  a project's use of hh-rules).
- **plan**: the project's ordered list of tasks the operator wants done, next
  first, `PLAN.md` at the project root. Claude says what it will add before
  adding it, except the lines `/hh-wrap` adds (diary decision 2026-11-24: the
  wrap's lines in the plan's glossary entry).
- **diary**: Claude's dated record in `diary/` of what happened in each session,
  what was decided and why. It is Claude's record; the operator does not need to
  read it.
- **wrap**: running `/hh-wrap` after a stretch of work, so Claude records the
  work in the diary and takes history out of the docs. The session can carry on
  afterwards (diary decision 2026-11-03: when the operator wraps, without a ban
  on reminders).
