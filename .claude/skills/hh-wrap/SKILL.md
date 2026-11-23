---
name: hh-wrap
description: >-
  Before a session ends, flush the session's progress and decisions to the
  project diary, strip history, dates and counts from the docs changed this
  session, fix the diary where procedure was not followed, and put what needs
  settling in the plan.
disable-model-invocation: true
---
# Wrap up the session

Works in the current project, which keeps a diary in `diary/` (format in the
`diary` rule). Nothing here waits for the operator's review.

## 1. Find this session's changes

- The current diary file is today's, `diary/<today's date>.md`, created if it
  does not exist (format in the `diary` rule).
- A session working on a branch of its own, as a background session does in its
  worktree, takes as the base the commit where its branch last met the project's
  working branch: `git merge-base HEAD origin/<working branch>`, after a
  `git fetch origin`. The last `Wrapped at` line in the diary is not its base:
  where sessions' entries were joined by a union merge, that line can be another
  session's, in either order (diary decision 2026-11-20: a branch's wrap starts
  where it left the working branch).
- Any other session's base commit is the most recent `Wrapped at <commit>` line:
  `command grep -h "^Wrapped at " diary/*.md | tail -1` (the shell sorts the
  date-named files, and GNU grep keeps that order; `grep -r` and the Bash tool's
  own `grep` function do not). With none, use the parent of the first commit
  made in this session, judged from the conversation. When that commit is the
  repository's first, the base is the whole history:
  `git hash-object -t tree /dev/null` gives the empty tree to diff against. With
  no commit in this session, use `HEAD`.
- Note the current commit: `git rev-parse --short HEAD`. This is where the wrap
  starts.
- This session's changes are `git diff <base>` (committed and uncommitted) plus
  any new untracked files outside the sandbox placeholder paths.

## 2. Flush to the diary

- From this conversation and the changes, list the progress and decisions not
  already in the diary since the base commit.
- Append a session summary entry: what was worked on and what came of it, what
  was tried and failed, problems found, test results and numbers worth keeping.
  History and statistics that would tempt a doc edit go here. The entry records
  what was done: it names no next task, nothing owed and no change proposed,
  which go in the plan in sections 4 and 5.
- Append one `CC_DIARY_DECISION` entry per decision about work done or a rule
  now in force, with the options considered and why each rejected one was
  rejected. A decision that reverses all or part of one still in force restates
  what still stands and carries `Replaces`, as the `diary` rule says; a note
  beside the old decision is not enough.
- An agreed design for work not yet done gets no entry: it belongs in its plan
  task, each choice in it a provisional decision, `- CC_PLAN_DECISION: <topic>`
  nested under the task in the form the principles give. One the task does not
  hold yet is a loose end for section 5 (diary decision 2026-11-12: what is true
  and what is planned) (diary decision 2026-11-13: provisional decisions in the
  plan, and what the wrap fixes there).

## 3. Clean the docs

- In the lines this session added to docs and comments (Markdown files outside
  `diary/`, less the rule files and the pinned skills rulesync generates, which
  `rulesync.lock` lists as `resolvedRuleNames` and under `skills`, and comments
  in changed code), find history: dates, counts that will go stale,
  "previously", "used to", "was changed", and accounts of how something came to
  be.
- Rewrite each so it states what is. Move any history worth keeping into the
  diary entry. A reason that prevents a future edit stays.
- In the same lines, find what is not yet true: a TODO or an intended behaviour
  in a comment, a doc line describing what is not built. Each is a finding left
  for the operator in section 4, proposing that it move to the plan (diary
  decision 2026-11-12: what is true and what is planned).

## 4. Check decisions against the docs

A finding is fixed here only when procedure was not followed and the answer is
already settled, by a decision in force or by the operator's words in this
conversation; anything that needs a choice is for the operator.

- Run the mechanical checks: `.hh/shared/hh-drift` in a project, or
  `bin/hh-drift` in hh-rules itself, and again with `--carried`, which lists the
  decisions in force that nothing cites and no `CC_NO_DOC` line marks. Each
  prints one finding per line and exits 1 when there are any. If the script is
  missing, say so in the report. In a project, the rules and skills hh-rules
  provides cite hh-rules' diary, and are not read against the project's.

- For each diary decision this session added (in `git diff <base> -- diary/`),
  check that the line citing it says what was decided and any reason a later
  session would need to avoid undoing it. Rule files and skills count as docs
  here.

- For each doc line this session changed, check that it contradicts no diary
  decision still in force: list them with
  `command grep -n "^## .*CC_DIARY_DECISION" diary/*.md` and read those on the
  same subject. A later decision on the same subject with no `Replaces` line is
  a silent override, and is reported too.

- Ask of this session's work, its changes and what was done in the conversation:
  does it reverse any part of a diary decision still in force, such as doing
  what a decision rejected, without a later decision that replaces it? Read the
  decisions on the subjects the work touched. Report each such reversal as a
  finding (diary decision 2026-11-02: wrap asks about reversed decisions).

- Read each item of the plan against this session's work and conversation, and
  report as a finding each item that is finished but still there, overtaken or
  dropped in conversation, stating something the session's changes made untrue,
  or pointing to a part of the plan that changed. Name the item and the change
  proposed: removed, reworded, or merged with another. An item finished in every
  part, by commits this check names, is removed below; any other is left for the
  operator, since whether work done in part finishes an item, and how to reword
  or merge one, are judgements (diary decision 2026-11-13: provisional decisions
  in the plan, and what the wrap fixes there).

- Read the whole plan against the form the principles give it: one list of tasks
  in order, the next first, and unscheduled work under `## Later`. Report as a
  finding each passage that is not a task, such as a decision or its reason,
  reference, history, a record of what was done, or a rule already in force,
  naming where it belongs (the docs and the diary, a `.hh/docs/` file, or the
  diary), and each task outside the list or `## Later`. A choice in a task's
  design not written as a provisional decision is a finding too. A provisional
  decision whose work is done, by commits this check names, belongs in the
  diary, and is moved below. Nothing else is moved here (diary decision
  2026-11-05: the plan as an ordered task list) (diary decision 2026-11-13:
  provisional decisions in the plan, and what the wrap fixes there).

- List each exception to a check added since the base that cites no diary
  decision, since an exception needs the operator's agreement and the diary is
  where that shows. Read the lines `git diff -U0 <base>` adds to `prek.toml`,
  for its `exclude` values, and to the files where each rules pack the project
  installs puts its exceptions, as its rule says: for `python`, ruff's
  `extend-per-file-ignores` and `ignore` in `ruff.toml` and pyright's
  `executionEnvironments` in `pyproject.toml`; for `typescript`,
  `eslint.config.js`, `tsconfig.json` and the knip config. A line the diff adds
  is not always a new exception, since a line rewritten for another reason shows
  as added: compare each exception's value with the same hook's or setting's at
  the base (`git show <base>:<file>`), and leave out one whose value is
  unchanged. Leave out too an `exclude` equal to the same hook's in hh-rules'
  own file at the project's pinned tag, the tag in `rulesync.jsonc`:
  `git -C ~/git/hh-rules show <tag>:prek/base.toml`, or `prek/format.toml`,
  `prek/fork.toml` or `prek/<pack>.toml` for a hook of theirs. Report each one
  left with no `(diary decision …)` beside it as a finding (diary decision
  2026-11-09: the wrap lists uncited exceptions).

- Fix these, with any diary entry in today's file:

  - a missing `Replaces` line, where the conversation shows the override was
    meant: a `Correction to <topic>` entry;
  - a partial override that does not restate what still stands, where that is
    clear: a decision entry restating it, with a `Replaces` line for each
    decision it overrides;
  - a citation of a replaced decision: moved to the decision that replaced it,
    the only change to the doc line;
  - a decision whose intent a doc line already states without citing it: the
    citation added, the only change to the doc line;
  - a topic in force with parentheses: renamed by a new entry, as the `diary`
    rule says;
  - a plan item finished in every part, by commits named: removed from the plan;
  - a provisional decision whose work is done, by commits named: moved into the
    diary as a decision entry, its heading in place of the marker and those
    commits as its `Commits`, and removed from the plan; whether a doc then
    carries it is checked with the rest by `--carried` (diary decision
    2026-11-13: provisional decisions in the plan, and what the wrap fixes
    there).

- Leave these for the operator, changing nothing: a doc that contradicts a
  decision in force; a reversal the conversation does not show the operator
  choosing; a decision replaced by two; a decision `--carried` lists, since a
  new doc line is the operator's intent and so is a judgement that none is
  needed. For each, say whether a doc should carry it, and where, or why it
  needs none. Every plan finding not fixed above, every line found in section 3
  not yet true, every uncited exception, and every test set aside that section 6
  finds, is left too.

- After fixing, run the mechanical checks again.

- Put every finding in the session summary entry, each with where it is and
  whether it was fixed; with none, the entry says the check found nothing. The
  change proposed for a finding goes in its plan line alone.

- Each finding left for the operator goes into the plan, with no agreement
  asked: one that belongs to a task already there is added to that task, and any
  other is a line of its own at the top of the plan's list of work, above every
  other item. The line says what was found, where, and the change proposed, so
  it can be settled without the diary. An earlier wrap's lines stay. The commit
  that settles a finding removes its line (diary decision 2026-11-22: wrap fixes
  procedure and plans the rest, a client's findings on other tasks reported).

  ```markdown
  - **Wrap finding**: <what was found and where>. Proposed: <the change>.
  ```

- A client, a session in a worktree of its own that works with an advisor
  through `/hh-connect`, adds its own `Wrap finding` and `Loose end` lines as
  this skill asks, and changes no other session's task, since another session
  may be changing it: a finding that belongs to another task goes in its report
  to the advisor, not into that task, and the summary entry says so. A session
  on the project's checkout adds it to the task as above (diary decision
  2026-11-22: wrap fixes procedure and plans the rest, a client's findings on
  other tasks reported).

## 5. Put the session's loose ends in the plan

- Go back over the whole session, this conversation and the messages from other
  sessions, for what it leaves undone:

  - something this session promised or owes, to the operator or another session;
  - a question the operator asked that has no answer, or a question put to the
    operator that has none;
  - a finding from the operator, an advisor or a watcher that is not settled;
  - anything put off to a later commit, such as what the commit that builds a
    task must also write.

- Each goes into the plan, with no agreement asked: one that belongs to a task
  already there is added to that task, saying what is to be done; any other is a
  line of its own beside the `Wrap finding` lines. A client's loose end that
  belongs to another task goes in its report to the advisor instead, as section
  4 says of a finding. The commit that settles it removes it.

  ```markdown
  - **Loose end**: <what is undone, who it is owed to or waits on, and what
    settles it>.
  ```

- Say in the report how many went into the plan, and where.

## 6. Record the metrics

- Run `.hh/shared/hh-metrics` in a project, or `bin/hh-metrics` in hh-rules
  itself. For each metric it prints a `Metrics:` line and a `Change:` line, and
  it lists what is excluded from duplication. If the script is missing, or it
  fails, say so in the report and record no figures.

- Add each `Metrics:` line to the session summary entry as a paragraph of its
  own, exactly as printed. The next run finds it there to report the change.

- Put the `Change:` lines first in the report, ahead of everything else, each
  with its `Metrics:` line beside it, and the exclusions after them.

- Find the tests set aside in the whole project, not only those this session
  touched. Each rules pack the project installs whose test runner is among the
  project's commit checks gives its `Metrics:` line the runner's count of them,
  which its rule names, with what the runner counts and does not, and the
  command that lists each such test. Where a count is above 0, run that command,
  and list each test it gives, with its file, in the session summary entry,
  under `Tests set aside:`, so the next wrap can compare. Each test on the list
  that the last such list in the diary does not hold is a finding, left for the
  operator as section 4 says and put in the plan the same way, unless a line
  there already holds it; a test the last list holds was raised before, and is
  listed again but not raised, so a test the operator agreed to keep is raised
  once. A test set aside is never changed here: whether it is fixed, deleted or
  kept as it is, is the operator's to decide. Where such a pack's line is
  missing, or `hh-metrics` failed, the report says the tests set aside were not
  counted (diary decision 2026-11-22: tests set aside counted by the test
  runner, each raised once).

- List the duplication new since step 1's base: `.hh/shared/hh-clones` in a
  project, or `bin/hh-clones` in hh-rules itself, with `--since <base>` and the
  `--test` globs `/hh-dedupe` names in its step 1. When the base is the empty
  tree, leave out `--since`: every set is new. Exit 2 means it could not run:
  say so in the report and add nothing to the plan.

- For each set it lists, add a line at the top of the plan's list of work, below
  any `Wrap finding` and `Loose end` lines and above every other item, with no
  agreement asked, since the commit check never fails on a copy and a new one
  otherwise goes unseen. An earlier wrap's lines stay. The commit that removes
  the copies, or that records the operator's agreement to keep them in
  `.jscpd-judged.toml`, removes the line (diary decision 2026-11-13: new
  duplication in the plan) (diary decision 2026-11-13: kept copy sets recorded
  by their text).

  ```markdown
  - **New duplication**: <each place, file:start-end>, a <case> set new since
    <base>. Remove it with `/hh-dedupe`, or keep it with the operator's
    agreement.
  ```

- Put the new sets in the report after the exclusions, each with its places.

## 7. Review the whole plan

- Read every task in the plan, `## Later` included, against the project as it
  now stands, not only this session's work: the code, the docs, the diary's
  decisions, and what other sessions and hh-rules have changed. List each task
  that may be moot: done elsewhere, overtaken by a decision, its reason gone, or
  waiting on something that no longer applies. Say why for each.
- List too each task a short discussion with the operator could settle, drop, or
  move under `## Later`: one waiting on a decision of the operator's, one whose
  design needs one choice, one whose start depends on something not named. Give
  each the question that would settle it and the answer recommended.
- Leave out the tasks section 4 already reported. Change nothing in the plan
  here, since each change needs the operator's agreement; both lists go in the
  report, so each task is put to the operator at every wrap until it is settled
  (diary decision 2026-11-12: the wrap reviews the whole plan).

## 8. Commit

- Append `Wrapped at <commit noted in step 1>` to the session summary entry.

- Stage the diary files, the cleaned docs, the docs whose citations step 4 fixed
  and the plan by explicit path, and commit locally:
  `Wrap: diary and doc cleanup`.

- Push the branch. Run `.hh/shared/hh-push-check` in a project, or
  `bin/hh-push-check` in hh-rules itself, and act on its first line, which is
  one of three:

  - `push:`, with exit 0: the repository `origin` names is private. Run the
    `git push origin <branch>` it prints, with no read.
  - `read first:`, with exit 3: the repository is public, or its visibility
    could not be read. Read everything the push would make public, as the
    principles say, with the two commands it prints, each in a call of its own:
    `git fetch --prune origin`, so the remote's branches are known as they now
    are, a deleted one no longer among them, and
    `git log -p --cc <branch> --not --remotes=origin`, which gives the commits
    no branch of the remote holds, a merge's own changes among them. Run the
    push it prints only where both commands exit 0 and the read shows no secret
    and no infrastructure detail; otherwise do not push.
  - `no push:`, with exit 2: the project has no remote named `origin`, the wrap
    is on no branch, or one of the script's other refusals, which the line
    names. Push nothing.

  Any other first line or exit, or a missing script, is no answer: do not push.
  Push nothing else: no tag, and never with force. A push with nothing new
  changes nothing. Where the remote refuses the push, do not retry it another
  way (diary decision 2026-11-21: a push made by the wrap) (diary decision
  2026-11-22: the wrap's push check a script, a search for nothing left prose).

- Report: the metrics from step 6 and the tests set aside it found, or that it
  could not count them, then entries written, docs cleaned, the commit hash,
  step 4's findings, each with where it is and whether it was fixed or added to
  the plan, step 5's loose ends, each with where it went in the plan, and step
  7's tasks that may be moot and tasks to settle, each with its question; or,
  for each, that it found none; and what was pushed, or why nothing was, with
  what the read found where it stopped the push.

- If work since the last release cannot be tried until a release, end the report
  by saying so and asking once whether to make one. The question is the
  operator's even while supervising, since supervising does not extend to a
  release. The wrap makes no release, and an unanswered question is not raised
  again before the next wrap (diary decision 2026-11-19: releases at the
  operator's go-ahead, asked once at the wrap).
