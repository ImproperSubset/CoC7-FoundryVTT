---
name: hh-wrap
description: >-
  Before a session ends, flush the session's progress and decisions to the
  project diary, strip history, dates and counts from the docs changed this
  session, fix the diary where procedure was not followed, and settle what needs
  a choice with hh-advise where it answers for the operator, or put it in the
  plan.
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
  where sessions' entries were joined by a merge, that line can be another
  session's (diary decision 2026-11-24: v0.31.0's code for cases no client meets
  cut).

- Any other session, on the project's checkout, takes as the base the commit of
  the last wrap made on the checkout's branch itself:
  `git log --first-parent --no-merges -G '^Wrapped at ' -1 --format=%h -- diary/`,
  which names the last commit of the branch's own that added a `Wrapped at` line
  to the diary. The last `Wrapped at` line in the diary is not its base: where
  sessions' pull requests are merged into the branch, that line can be a
  session's from its own branch, which `--first-parent` and `--no-merges` leave
  out, and the checkout's own changes since its last wrap fall before it (diary
  decision 2026-11-24: v0.31.0's code for cases no client meets cut). With none,
  use the parent of the first commit made in this session, judged from the
  conversation. When that commit is the repository's first, the base is the
  whole history: `git hash-object -t tree /dev/null` gives the empty tree to
  diff against. With no commit in this session, use `HEAD`.

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
  rejected. A decision that reverses one still in force carries `Replaces`, or
  `Changes` where it changes only part, as the `diary` rule says; a note beside
  the old decision is not enough.
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
  be. A figure in a reference file on outside work, pinned to the version it was
  read at, is not history and stays (diary decision 2026-11-24: dated figures
  kept in a reference file on outside work).
- Rewrite each so it states what is. Move any history worth keeping into the
  diary entry. A reason that prevents a future edit stays.
- In the same lines, find what is not yet true: a TODO or an intended behaviour
  in a comment, a doc line describing what is not built. Each is a finding left
  for the operator in section 4, proposing that it move to the plan (diary
  decision 2026-11-12: what is true and what is planned).

## 4. Check decisions against the docs

A finding is fixed here only when procedure was not followed and the answer is
already settled, by a decision in force or by the operator's words in this
conversation; anything that needs a choice is for the operator, or, where the
hh-advise session answers for the operator, for hh-advise, as the end of this
section says.

- Run the mechanical checks: `.hh/shared/hh-drift` in a project, or
  `bin/hh-drift` in hh-rules itself, and again with `--carried`, which lists the
  decisions in force that nothing cites and no `CC_NO_DOC` line marks. Each
  prints one finding per line and exits 1 when there are any, and 2 when it
  cannot run, which goes in the report as a check not made, never read as clean.
  If the script is missing, say so in the report. In a project, the rules and
  skills hh-rules provides cite hh-rules' diary, and are not read against the
  project's.

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
  `prek/fork.toml` or `prek/<pack>.toml` for a hook of theirs. In a git
  worktree, as a background session's, write the `~` out as the home directory's
  full path and the tag out in full, with no shell variable, since Claude Code
  there refuses a git command aimed at a folder it must work out, or one in a
  Bash call holding a shell variable, as `/hh-rules` says of its own commands on
  hh-rules. Report each one left with no `(diary decision …)` beside it as a
  finding (diary decision 2026-11-09: the wrap lists uncited exceptions).

- Fix these, with any diary entry in today's file:

  - a missing `Replaces` line, where the conversation shows the override was
    meant: a `Correction to <topic>` entry;
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

- Where the hh-advise session answers for the operator, each finding left for
  the operator is decided by hh-advise instead, and is not put in the plan for
  the operator: in a wrap run through `/hh-wrap-supervised`, of a client
  hh-advise supervises, and in hh-advise's own wrap while it supervises. Once
  section 6 has run, a client's wrap sends hh-advise every finding left from
  this section, every loose end from section 5, and every test set aside and new
  duplication set section 6 raises, in one message, each with where it is and
  the change proposed, and waits for its answers; hh-advise's own wrap decides
  its own as `/hh-supervise` has it decide anything else. For each, the wrap
  then does what the answer says before it commits: makes the fix, writes the
  plan task the answer calls for, as the answer words it, or leaves it as it is
  where the answer is to keep it, such as a test set aside or a copy hh-advise
  agrees to keep, recorded where the rule on it says. Only a finding whose
  answer stays the operator's under `/hh-supervise`, such as a change to a
  project's rules packs, goes into the plan as below. Once the answers are done,
  run the mechanical checks again, since a fix they call for can change docs and
  the diary after the run above (diary decision 2026-11-23: the wrap resolves
  its findings where hh-advise can answer).

- Put every finding in the session summary entry, each with where it is and
  whether it was fixed, or, where hh-advise answered it, what it decided and
  what the wrap did; with none, the entry says the check found nothing. The
  change proposed for a finding left in the plan goes in its plan line alone.

- Each finding left for the operator, and not decided by hh-advise as above,
  goes into the plan, with no agreement asked: one that belongs to a task
  already there is added to that task, and any other is a line of its own at the
  top of the plan's list of work, above every other item. The line says what was
  found, where, and the change proposed, so it can be settled without the diary.
  An earlier wrap's lines stay, above an update's migration item too. The commit
  that settles a finding removes its line (diary decision 2026-11-23: the wrap
  resolves its findings where hh-advise can answer) (diary decision 2026-11-23:
  moving a project to a newer tag, its item below the wrap's lines).

  ```markdown
  - **Wrap finding**: <what was found and where>. Proposed: <the change>.
  ```

- A client, a session in a worktree of its own that works with an advisor
  through `/hh-connect`, adds its own `Wrap finding` and `Loose end` lines as
  this skill asks, and changes no other session's task, since another session
  may be changing it: a finding that belongs to another task goes in its report
  to the advisor, not into that task, and the summary entry says so, as does an
  answer of hh-advise's that changes another task. A session on the project's
  checkout adds it to the task as above (diary decision 2026-11-23: the wrap
  resolves its findings where hh-advise can answer).

## 5. Put the session's loose ends in the plan

- Go back over the whole session, this conversation and the messages from other
  sessions, for what it leaves undone:

  - something this session promised or owes, to the operator or another session;
  - a question the operator asked that has no answer, or a question put to the
    operator that has none;
  - a finding from the operator, an advisor or a watcher that is not settled;
  - anything put off to a later commit, such as what the commit that builds a
    task must also write;
  - a general lesson learned in the session that belongs in a rules pack's skill
    and has not been sent. Sent to hh-advise, it is a draft, with where it comes
    from and what was checked and how, as `/hh-connect` says of any change to
    what hh-rules shares (diary decision 2026-11-25: the wrap asks for a lesson
    not yet sent).

- Where hh-advise answers for the operator, each goes to it with section 4's
  findings and is done as it answers, as section 4 says. Each other goes into
  the plan, with no agreement asked: one that belongs to a task already there is
  added to that task, saying what is to be done; any other is a line of its own
  beside the `Wrap finding` lines. A client's loose end that belongs to another
  task goes in its report to the advisor instead, as section 4 says of a
  finding. The commit that settles it removes it.

  ```markdown
  - **Loose end**: <what is undone, who it is owed to or waits on, and what
    settles it>.
  ```

- Say in the report how many went into the plan, and where.

## 6. Record the metrics

- Run `.hh/shared/hh-metrics` in a project, or `bin/hh-metrics` in hh-rules
  itself. For each metric it prints a `Metrics:` line and a `Change:` line, and
  it lists what is excluded from duplication, and prints a `Not measured:` line
  for each test hook left out of the commit checks, which it passes over. If the
  script is missing, or it fails, say so in the report and record no figures.

- Add each `Metrics:` line to the session summary entry as a paragraph of its
  own, exactly as printed. The next run finds it there to report the change.

- Put the `Change:` lines first in the report, ahead of everything else, each
  with its `Metrics:` line beside it, and the exclusions and `Not measured:`
  lines after them (diary decision 2026-11-26: a test hook left out passed over
  by hh-metrics).

- Find the tests set aside in the whole project, not only those this session
  touched. Each rules pack the project installs whose test runner is among the
  project's commit checks gives its `Metrics:` line the runner's count of them,
  which its rule names, with what the runner counts and does not, and the
  command that lists each such test. That count takes in every hook of the
  runner's prek group as well as the pack's own, so the rule also gives the
  command that lists the tests set aside in each hook `prek list --group` names
  in the root project, its full id opening `.:`, as `hh-metrics` counts them,
  and each of those commands is run too, its lines listed with the pack hook's
  (diary decision 2026-11-24: v0.31.0's code for cases no client meets cut).
  Read each such pack's rule by its path, `.claude/rules/<pack>.md`, for those
  commands, since it loads only once a file it covers is read (diary decision
  2026-11-24: the push-down's moves on hh-rules, those that leave the start and
  those turned down). Wherever the tests set aside were counted, the session
  summary entry carries a `Tests set aside:` line, so the next wrap can compare:
  where a count is above 0, run every such command, and list under it each line
  they give for a test set aside, as the status or mark and the name it prints,
  a subtest's name included, and nothing else: no reason, duration, line number
  or progress figure, so a test keeps its entry when its line moves or its
  reason is reworded. The list is a fenced code block marked `text`, one entry
  to a line, which the commit's Markdown formatter and linter leave as written,
  so the next wrap reads back the text the command printed, a name's underscores
  and a `<subtest>` included. A line given several times, as by several subtests
  with no name in one test, is listed as often as it is given. A command that
  fails lists nothing for its hook, and the report says so, with its error.
  Where every count is 0, the line is `Tests set aside: none`, so a test set
  aside again after a wrap with none is raised again. The list to compare with
  is the last such line in the diary as it stood at section 1's base, so the
  base and the list come from the same history, and an entry joined in from
  another branch is not taken for the last: the last line
  `git grep -n '^Tests set aside:' <base> -- diary/` prints gives its file and
  line, and the tests listed under it are read there with
  `git show <base>:<file>`. Each entry on this wrap's list that it does not
  hold, or holds fewer times, is a finding, left for the operator as section 4
  says and put in the plan the same way, or decided by hh-advise where it
  answers, unless a line in the plan already holds it; an entry the last list
  holds as often was raised before, and is listed again but not raised, so a
  test the operator agreed to keep is raised once. A test set aside is never
  changed here unless hh-advise's answer says so: whether it is fixed, deleted
  or kept as it is, is the operator's to decide, or hh-advise's where it
  answers. Where such a pack's line is missing, or `hh-metrics` failed, the
  report says the tests set aside were not counted, and the entry has no
  `Tests set aside:` line (diary decision 2026-11-24: tests set aside counted by
  the test runner, each listed by name) (diary decision 2026-11-23: the wrap
  resolves its findings where hh-advise can answer).

- List the duplication new since step 1's base: `.hh/shared/hh-clones` in a
  project, or `bin/hh-clones` in hh-rules itself, with `--since <base>` and the
  `--test` globs `/hh-dedupe` names in its step 1. When the base is the empty
  tree, leave out `--since`: every set is new. Exit 2 means it could not run:
  say so in the report and add nothing to the plan.

- Where hh-advise answers for the operator, each set it lists goes to it with
  section 4's findings, and the wrap does as it answers, as section 4 says: a
  plan task to remove the copies, or the copies kept in `.jscpd-judged.toml`
  with hh-advise's agreement standing for the operator's (diary decision
  2026-11-23: new duplication in the plan, or decided by hh-advise). Otherwise,
  for each set it lists, add a line at the top of the plan's list of work, below
  any `Wrap finding` and `Loose end` lines and above every other item, with no
  agreement asked, since the commit check never fails on a copy and a new one
  otherwise goes unseen. An earlier wrap's lines stay. The commit that removes
  the copies, or that records the operator's agreement to keep them in
  `.jscpd-judged.toml`, removes the line (diary decision 2026-11-23: new
  duplication in the plan, or decided by hh-advise) (diary decision 2026-11-13:
  kept copy sets recorded by their text).

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

  - `push:`, with exit 0: the repository `origin` names is private or internal.
    Run the `git push --no-follow-tags origin <branch>` it prints, with no read.
  - `read first:`, with exit 3: the repository is public, or its visibility
    could not be read. Read everything the push would make public, as the
    principles say, with the three commands it prints, each in a call of its
    own: `git fetch --prune origin`, so the remote's branches are known as they
    now are, a deleted one no longer among them;
    `git log -p --cc <branch> --not --remotes=origin --output=<file>`, which
    writes to a file the script made the commits no branch of the remote holds,
    a merge's own changes among them; and `wc -l <file>`, which gives its number
    of lines. Then read the file with the Read tool, in parts with `offset` and
    `limit` where it is long, until the line `wc` counts has been read, since
    the Bash tool gives a long output only as a short preview, the rest in a
    file it names, and the preview can be taken for the read. Run the push it
    prints only where the three commands exit 0, every line of the file was
    read, and the read shows no secret and no infrastructure detail; otherwise
    do not push. A Read that refuses or fails is a read not done. Once the read
    is done, pushed or not, run the `rm -f <file>` it prints last, by the
    literal path, since the file holds every change the push would publish, a
    secret the read found among them (diary decision 2026-11-23: the wrap's push
    check sends the branch alone and reads from a file) (diary decision
    2026-11-23: the wrap's push read removed once done).
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
  the plan, or, where hh-advise answered it, what it decided and what the wrap
  did, step 5's loose ends, each with where it went in the plan or what
  hh-advise decided and what was done, and step 7's tasks that may be moot and
  tasks to settle, each with its question; or, for each, that it found none; and
  what was pushed, or why nothing was, with what the read found where it stopped
  the push.

- The wrap makes no release and does not ask about one, of the operator or of
  hh-advise, since a release is made only when the operator asks for one. The
  report may say that work can't be tried until a release, and lists no release
  as something waiting or asked for (diary decision 2026-11-24: releases made
  only when the operator asks, none asked about or awaited).
