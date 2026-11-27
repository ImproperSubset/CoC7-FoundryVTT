---
name: hh-push-down
description: >-
  Audit the project's AI guidance files, its CLAUDE.md and rules, for guidance
  placed higher than the work it applies to, which belongs further down as a
  rule triggered by file patterns or as a skill, and for stray material the
  principles keep out of docs. Reports labelled findings; applies only what the
  operator agrees.
disable-model-invocation: true
---
# Push specificity down

Works on the project in the current working directory. The aim is that a session
loads, before it reads a file, only the guidance every piece of work needs, and
that guidance for one kind of work loads when that work's files are touched.
This skill finds the passages that miss that aim and proposes where each goes.
It changes nothing until the operator agrees a finding, and then makes only that
change. No outside tool makes this judgment; the record of what loads is Claude
Code's own `InstructionsLoaded` hook (diary decision 2026-11-24: the push-down
built as a skill, with no frontmatter checker adopted).

The ladder, from what loads most to what loads least: the shared principles; a
rules pack's rule; the project's `CLAUDE.md`; a path-scoped rule, which loads
when a file its patterns match is read or edited; a skill, which loads when
invoked. A `.hh/docs/` file that `CLAUDE.md` names sits beside the skill, for
reference read on demand. A passage goes as far down as its reach allows, and no
further.

What is judged and what only reported:

- In a client project, the project's own `CLAUDE.md` files and its own rules in
  `.claude/rules/`, those whose names carry its prefix, are judged, and a move
  the operator agrees is made here. The shared rules hh-rules installs are read
  and reported on, never changed: a project never changes what hh-rules shares
  with it, so a finding on one goes, once the operator agrees it, to hh-advise
  as a draft, or as an issue on hh-rules where no hh-advise session is
  connected, as the principles say. A subsystem's guidance in the project's own
  files, which matters only to work on that code, is moved into a rule triggered
  by its directories or file names (diary decision 2026-11-24: the push-down
  covers clients' own files, by rules triggered on patterns).
- In hh-rules itself, its own `CLAUDE.md` and path-scoped rules, and every
  shared rule in `rules/`, the principles and every pack among them, are all
  judged. `.claude/rules/` links only some of them, so a rule in `rules/` it
  does not link is judged as a client that installs it would load it: at the
  start where it has no `globs`, on its `globs` otherwise. A move in a shared
  rule reaches clients only at the next tag.
- The operator's own `~/.claude/CLAUDE.md` and `~/.claude/rules/`, which load in
  every project, are listed in step 1 with their sizes and not judged.

## 1. Record what loads at the start

Run a headless session in the project's folder that reads nothing, with an
`InstructionsLoaded` hook that logs each instruction file as it loads, as the
`rule-load-test` rule's test does. Run it outside the sandbox, inside which a
headless session cannot sign in, and give the log a name only this session uses,
in its scratchpad or from `mktemp`, written out in the command:

```shell
claude -p "Reply done." --tools Read --settings '{"hooks":{"InstructionsLoaded":[{"hooks":
  [{"type":"command","command":"jq -c . >> <log>"}]}]}}'
```

The record counts only where the run exits 0. Each line of the log is one file,
with its `file_path`, which for a rule linked into `.claude/rules/` is the
link's target, and its `load_reason`. The files loaded at the start are those
with `session_start`; an `include` line is a file a `CLAUDE.md` imports, and
loads with it. Give each its size in words, `wc -w` on the file, and the total.
Then list the path-scoped rules in `.claude/rules/` that did not load, each with
its `paths:` patterns and size, comparing the log's paths with each rule's
target, which `realpath` gives for a link: they are read in step 2 too, for a
passage wider than its own patterns. In hh-rules, list as well each rule in
`rules/` that `.claude/rules/` does not link, with its `globs` and size, and
mark those without `globs` as loaded at the start in every client that installs
them; they are read in step 2 with the files loaded at the start.

## 2. Judge each passage's reach

Read each file loaded at the start, passage by passage: a bullet, a paragraph,
or a section where its parts stand or fall together. For each, say which work it
applies to:

- **All work**: whatever the session is doing, from its first turn, such as how
  to talk with the operator, how to settle a task, or what a claim needs behind
  it. It stays where it loads at the start.
- **Work a pattern marks**: work that always reads or edits files a pattern of
  directories or file names matches, such as `diary/**` for the diary's format,
  `**/*.py` for Python, or `tests/**` for writing tests. Name the patterns.
- **A procedure invoked by name**: a sequence the operator or a skill starts,
  such as a release or a wrap, which belongs in that skill.

A passage is judged by what triggers its need, not by its subject. Four limits
of a path-scoped rule decide many cases:

- It loads only when Claude reads, writes or edits a matching file with the
  Read, Write or Edit tool, or views one with a Bash command that counts as a
  read, such as `cat` or `head` on one file; Claude Code's memory page says so
  under "Path-specific rules". Work done through other commands, such as
  `git push`, a test run or `grep` across files, triggers nothing, so guidance
  for it cannot be scoped by the files it touches.
- It loads at the first matching read, so guidance needed before the session
  touches any such file, such as settling a task's scope before work starts,
  cannot be scoped to those files.
- Work that no file marks, such as waiting on a long run, stays where it is
  however rarely it comes up: there is nothing to trigger it.
- **A shared rule's patterns are the same in every project.** Where the trigger
  is a project's own layout, such as the testing rules that apply when source is
  edited, and source lives in `src/` in one project and `lib/` or the root in
  another, the shared file alone cannot be scoped to it. Patterns that name file
  types, such as `**/*.py`, are the same in every project; patterns that name a
  project's folders are not. Report such a passage with this limit, and propose
  no scope that guesses a layout.

## 3. Propose where each passage goes

For each passage placed higher than its reach, give:

- where it goes, one rung or more down the ladder: a pack's rule, a path-scoped
  rule, a skill, or a `.hh/docs/` file `CLAUDE.md` names;
- for a path-scoped rule, the patterns that would trigger it, and one file of
  the project each pattern matches, so the reach can be checked against the
  tree; a pattern that matches nothing in the project is said;
- what else must load with it for it to make sense: a term it uses that another
  passage defines, a passage it refers to with "as above" or "the same", a
  decision it relies on, or a rule it is an exception to. Where that is a
  passage staying at the start, nothing more is needed; where it would move
  elsewhere, say both go together, or which one carries the shared part;
- the words it would take from the files loaded at the start;
- the earlier decisions on where the passage sits. Check them for each passage
  before proposing its move, as the principles say: list the diary's decisions
  by topic, oldest first, then the plan's provisional ones, with the command the
  principles give, and read those on the passage's subject or on where such
  guidance lives. A move that would override a decision in force, whole or in
  part, names that decision and says so, since it needs a new decision that
  replaces or changes it; where no decision bears on it, say none was found.

A shared rule's new rule or new scope is written with its patterns twice, as
`globs` for rulesync and as `paths` for hh-rules' own sessions, as hh-rules'
`.claude/rules/hh-rules-rule-files.md` says. A client's own rule carries only
`paths`, and its name is `.claude/rules/<project>-<topic>.md`, as the principles
say.

## 4. Name stray material

Name each passage that, by the principles' rules for docs in their section "Docs
and the diary", belongs nowhere in the guidance files: history, dates, counts or
versions that go stale, save in a reference file under `.hh/docs/` on outside
work; how the system used to work; a restatement of what the code shows; a
reason that prevents no future edit; anything not yet true, such as behaviour
not built or a decision on work not done, which belongs in the plan; reference
read on demand, which belongs in `.hh/docs/`; or material for people, which
belongs in the README. Say where each would go, or that it is to be cut.

## 5. Report, and apply what is agreed

Lead with what was audited: the files loaded at the start with their sizes and
total, from step 1. Then the findings, each a bullet labelled as the principles
say for reply items, under a letter no earlier reply in the conversation has
used: the file and the passage's first words, the judgment of step 2, the
proposal of step 3 or the name of step 4, and the words it would move. Findings
on shared rules in a client are grouped apart, as reports. Passages limited by a
shared rule's fixed patterns are grouped apart too, each with that limit stated.
End with the words that would leave the start if every finding were agreed.

Apply nothing without the operator's agreement, finding by finding. In hh-rules,
the session running this skill makes no move itself: an agreed move is a task
for a client started in hh-rules' own folder, which makes it in a worktree by
the steps below and hands it over as a pull request, as hh-rules' `CLAUDE.md`
says of every change to hh-rules. For each move agreed, the session making it:

- write the rule, skill or `.hh/docs/` file, and remove the passage from where
  it was; a `.hh/docs/` file is named in `CLAUDE.md`, and a project's new
  path-scoped rule is named in `CLAUDE.md` too, as the principles say;
- run the rule-load test on each new or changed path-scoped rule, reading one
  file it covers; it passes on the log, as the `rule-load-test` rule says;
- run step 1 again, and say what now loads at the start and its size.

A move carries a decision: record it in the diary, and cite it where the
principles say.
