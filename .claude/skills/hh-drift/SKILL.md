---
name: hh-drift
description: >-
  Check every diary decision still in force against the project's docs, and the
  docs' citations against the diary, and report where they disagree. Changes
  nothing.
disable-model-invocation: true
---
# Check decisions against the docs

Works on the project in the current working directory, which keeps a diary in
`diary/` (format in the `diary` rule). This skill reports and changes nothing:
each finding is for the operator, and fixing one is a task settled with them.
`/hh-wrap` makes the same checks on one session's changes; this one covers the
whole project.

## 1. The mechanical checks

Run `.hh/shared/hh-drift` in a project, or `bin/hh-drift` in hh-rules itself. It
checks that every citation, in docs and code comments alike, names exactly one
existing decision that no later decision replaces, that every `Replaces` line
names an existing decision, that no decision is replaced twice, that no topic
still in force has parentheses, and that each `CC_NO_DOC` line sits in a
decision or a correction and gives a reason. Then run it again with `--carried`,
which lists each decision in force that nothing cites and no `CC_NO_DOC` line
marks. Each prints one finding per line, then a count, and exits 1 when there
are findings. If it is missing, say so and carry on with section 2.

## 2. The decisions in force

- List the decisions, oldest first:
  `command grep -n "^## .*CC_DIARY_DECISION" diary/*.md`. A decision is in force
  unless a later decision's `Replaces` line, or a `Correction to <topic>`
  entry's, names it.
- Treat the `Replaces` links as evidence, not fact. Read the decisions in force
  by subject, and report any two on the same subject where the later one changes
  the earlier with no `Replaces` line: a silent override.

## 3. Each decision against the docs

The docs are `CLAUDE.md` files, the project's own path-scoped rules in
`.claude/rules/`, the `.hh/docs/` files a `CLAUDE.md` names, and the rule files
and skills of hh-rules itself when run there. The rule files rulesync generates
are not the project's docs.

For each decision in force that a doc line cites, check that the line says what
was decided and any reason a later session would need to avoid undoing it, and
that nothing in the docs says otherwise. For each one `--carried` lists, say
whether a doc should carry it, and where, or why it needs none, so the operator
can settle it: a doc line that cites it, or a `Correction to <topic>` entry with
a `CC_NO_DOC` line. In a project, the rules and skills hh-rules provides cite
hh-rules' diary, not the project's, and are not read against it.

## 4. Report

Lead with whether anything was found. Then the findings, grouped as mechanical
(section 1), silent overrides, decisions the docs do not carry, and docs that
contradict a decision, each with its file and line and the decision it concerns.
End with hh-drift's counts: the decisions in force, how many are cited, marked
docless and neither, and the findings (diary decision 2026-11-03: hh-drift
counts decisions in force).
