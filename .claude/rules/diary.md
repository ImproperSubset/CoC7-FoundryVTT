---
paths:
  - diary/**
---

# Diary format

- There is one file per day, named for it: `diary/YYYY-MM-DD.md`. An entry goes
  in the file for the day it is written, created if it does not exist (diary
  decision 2026-11-01: one diary file per day). A new file opens with the line
  `# Diary`, because markdownlint wants a top-level heading on a file's first
  line (diary decision 2026-11-01: title line in diary files). Older files that
  span several days stay as they are.

- The diary is append-only. Earlier entries are never edited; a correction is a
  new entry. The one exception is an entry not yet pushed that would publish a
  secret or the operator's infrastructure: it is edited before the push, since a
  correction would only publish what it corrects (diary decision 2026-11-16:
  unpushed diary entries cleaned before publishing).

- The diary is the home for history and statistics: how something came to be,
  what changed and when, counts, measurements, test results, timings. They go
  here instead of in docs, which describe only what is.

- Every session gets a summary entry:

  ```markdown
  ## YYYY-MM-DD: Session summary: <short title>

  <what was worked on and what came of it: what was built or changed, what was
  tried and failed, problems found, test results and numbers worth keeping>
  ```

- The diary records what was done. What is not implemented goes in the plan:
  what is still to be done, what is owed, what waits for an answer, and a change
  proposed. An entry names no next task. A decision entry is written for work
  done or a rule now in force; an agreed design for work not yet done waits in
  its plan task, and the commit that does the work writes its entry (diary
  decision 2026-11-12: what is true and what is planned).

- Any other notable event can have its own entry, with a dated heading and plain
  prose.

- A mistake gets an entry only where the entry does a job: it corrects something
  an earlier entry states wrongly, records a decision made in the operator's
  stead, or gives a result. A slip that left nothing wrong in the records gets
  none, and neither does who found it. A lesson worth keeping goes where it
  acts: a rule, a skill or a check (diary decision 2026-11-21: which mistakes
  the diary records).

- A decision is its own entry, a diary decision, marked so it can be found by
  grep (diary decision 2026-10-31: recording history and decisions):

  ```markdown
  ## YYYY-MM-DD: CC_DIARY_DECISION: <topic>

  - Options considered: <each option>
  - Chosen: <option>, because <reason>
  - Rejected: <option>, because <reason>
  - Commits: <short hashes of the commits that carried it out or tried the
    rejected options>
  - Replaces: <diary file>, <topic>
  - CC_NO_DOC: <why no doc carries it>
  ```

  A decision recorded in the commit that carries it out cannot give that
  commit's hash, and writes `Commits: the commit that adds this entry` (diary
  decision 2026-11-11: a decision's own commit).

  `Replaces` appears whenever the decision overrides an earlier one, whatever
  its topic, with one line for each decision it overrides (diary decision
  2026-11-01: decision chains in the diary). A decision that overrides only part
  of an earlier one, such as an exception to it, restates what still stands of
  the earlier one along with the change, and replaces it, so every decision in
  force reads whole and a doc line cites only that one (diary decision
  2026-11-02: partial overrides in the diary). A decision that moves a set of
  files states the move once, naming the old place and listing the decisions in
  force that name it; those decisions stay in force, read with the new place,
  and are not restated (diary decision 2026-11-14: a move of files stated once).
  A topic contains no parentheses, because docs cite a decision as
  `(diary decision YYYY-MM-DD: <topic>)`. A topic is renamed by a new decision
  entry that restates the decision under the new topic, with a `Replaces` line
  naming the old one (diary decision 2026-11-01: renaming a decision topic). The
  marker appears only in decision headings, so
  `command grep -n "^## .*CC_DIARY_DECISION" diary/*.md` is the index of
  decisions, oldest first, since the shell sorts the file names and they are
  dates, and GNU grep keeps that order; `grep -r` and the Bash tool's own `grep`
  function do not. Mention the marker nowhere else in the diary. The plan's
  marker for a provisional decision never appears in the diary: the commit that
  moves one here writes it as a decision heading, and `hh-drift` reports the
  marker left behind (diary decision 2026-11-13: provisional decisions in the
  plan, and what the wrap fixes there).

- Every decision in force is carried: a doc line, or a code comment, cites it,
  or its entry ends with a `CC_NO_DOC` line giving the reason none does, such as
  a decision about how one piece of work was done. The plan is never that
  reason: it holds only what is not yet true, and a decision in force is true
  now (diary decision 2026-11-12: what is true and what is planned). A decision
  later found to need no doc gets the line in a `Correction to <topic>` entry;
  one later found to need a doc gets the doc line, which carries it whatever the
  mark says. `hh-drift --carried` checks this (diary decision 2026-11-03: every
  decision cited or marked docless). `CC_NO_DOC` appears only as the lead of
  that line.

- Citations in the shared rules and skills that hh-rules provides name decisions
  in hh-rules' diary, not the project's (diary decision 2026-11-03: citations in
  shared files, none in copied files).

- A decision recorded after the fact says when and where it was made, and gives
  only what is known: options and rejections that were not recorded are written
  as `not recorded`.

- A missing or wrong `Replaces` line is fixed by a later entry, since earlier
  entries are never edited:

  ```markdown
  ## YYYY-MM-DD: Correction to <topic>

  - Replaces: <diary file>, <topic>
  ```

  `<topic>` in the heading is the decision being corrected. Where several
  decisions share the topic, a correction speaks for the latest written before
  it that no earlier correction withdrew, so after a restatement is withdrawn, a
  further correction reaches the decision its withdrawal restored (diary
  decision 2026-11-13: a correction after a withdrawal reaches what it
  restored). Anything that follows the chain of decisions reads these entries
  too.

- A decision that should not have been recorded, such as one on work not yet
  done, is withdrawn by a correction carrying a `- Withdrawn: <reason>` line. It
  is then no longer in force, as a replaced decision is: nothing carries it, and
  no doc cites it. Its `Replaces` lines lapse with it, so each decision it
  replaced is in force again and is carried as any other is; a provisional
  decision that takes the withdrawn one's place in the plan names them in its
  own `Replaces` lines. One that a new choice overrides is replaced instead
  (diary decision 2026-11-13: withdrawing a decision that replaced others).

- A decision in force that is only partly built is replaced, as a partial
  override is, by a new entry recorded after the fact that restates only what is
  built, so every decision in force is true of the project. Each unbuilt choice
  it held goes into its plan task as a provisional decision, with the operator's
  words and the reasons and rejections that bear on it, since the plan is then
  the only place it survives (diary decision 2026-11-13: a partly built decision
  restated to its built part).

- An entry written by `/hh-wrap` carries the `Metrics:` paragraph that
  `hh-metrics` prints, word for word, so the next wrap can compare against it,
  and ends with `Wrapped at <commit>`, the commit the wrap started from. What
  comes after the wrap, such as a go-ahead given once its entry is written, is a
  dated entry of its own, never a line added below `Wrapped at` (diary decision
  2026-11-20: what follows a wrap is its own diary entry).
