---
name: hh-dedupe
description: >-
  Remove duplicated code that jscpd finds. Lists the copies as ranked sets and
  fixes each by its case, mainline code through jscpd's dry-refactoring skill
  and tests through the test framework's own tools; on request, also finds
  functions that do the same job without being copies. Use whenever duplication
  is to be removed.
---
# Remove duplicated code

Works on the project in the current working directory. Duplication is removed
through this skill, whether the operator runs it or Claude does.

## 1. List the sets

Run `.hh/shared/hh-clones` from the project root (in hh-rules itself the same
path is a link to `bin/hh-clones`). It runs jscpd as the commit check does, at
the pinned version with the project's `.jscpd.jsonc`, joins jscpd's pairs into
sets of places that copy each other, and ranks the sets by the lines a fix would
remove. That figure is an upper bound: jscpd matches text, so a set's range can
run past the code that is really copied.

- Name the test files with `--test` globs from the project root, as the
  project's rules pack names them: `--test 'tests/**'` for the Python pack,
  `--test '**/*.test.ts'` for the TypeScript pack. A project without a pack
  names them in its `CLAUDE.md`; where it does not, read its test runner's
  config for the pattern, and say which globs were used. A project with no tests
  passes `--no-tests`.
- Arguments after `--` go to jscpd, such as `-- --min-lines 10`.
- Exit 2 means it could not run, and its message says why. Stop and report it;
  it never means no duplication.

Unless the request already names the sets to fix, show the operator the summary
line and the leading sets, and agree which to take on.

## 2. Fix each set by its case

Take the sets in rank order. Every copy in a set is fixed together, not pair by
pair.

A set's range is where jscpd matched text, which can cross the boundaries of
functions or tests. Find the code that is really copied within it, such as a
whole function, and fix that. A part of the range that only looks alike, such as
the end of two functions that do different things, is left and reported.

- **mainline**: follow jscpd's `dry-refactoring` skill, pinned in
  `.claude/skills/dry-refactoring/`, from its step 3, with this set's places as
  the clone. Where it says to run jscpd, run `.hh/shared/hh-clones` with the
  same `--test` globs and the same jscpd flags after `--` instead, so the check
  uses the pinned version and the project's exclusions. That check, the set gone
  or smaller and no new set, takes the place of its last step's duplication
  percentage, which `hh-clones` does not print; the commit check prints it. Its
  triage and its strategies apply as written. An extracted function goes in a
  module its callers already import from, where there is one, before a new
  utility file.
- **test**: use the test framework's own tools, which the rules pack names:
  repeated setup becomes a fixture or setup hook named for what it sets up;
  tests whose bodies match and whose data differs become one parametrized test
  with a table of cases; repeated construction of test data becomes a builder
  that takes only the fields a test cares about. Each test still reads on its
  own: the inputs that make a case different, and what it checks, stay visible
  in it. Once a fixture or builder exists, use it wherever the same shape
  appears in the files the fix touches, not only in the set's copies, since
  jscpd misses copies that line wrapping or a small difference sets apart. The
  shape is the whole of the set's real copy: a place that repeats only part of
  it is left. Where the new helper generalises an earlier one, rebuild the
  earlier one on it, so the copied code is written once. Repetition in tests is
  never skipped as boilerplate.
- **test-and-mainline**: a test copies the project's own code, usually to work
  out its expected value the way the code does, so it cannot catch a bug in that
  logic. Change the test to state the expected value as a literal, or to check a
  property the result must have. If the copy is not computing an expected value,
  show the operator the set and ask.
- **prose**: Markdown or text, usually docs that repeat each other, which drift
  apart once one copy changes. Show the operator the set and ask. The diary is
  not measured, since it is append-only.

A set left unfixed, by `dry-refactoring`'s triage or for any other reason, is
reported with its reason. One the operator agrees to keep, or leaves to a plan
task, is recorded: copy the block the listing printed under the set into
`.jscpd-judged.toml` at the project root, with its `verdict`, `kept` or `task`,
and a one-line `reason`, and commit it. `hh-clones` then skips the set while its
copies' text is unchanged, however their lines move, and lists it again once any
copy's text changes (diary decision 2026-11-13: kept copy sets recorded by their
text). Nothing is excluded from jscpd, and no disabling comment is added,
without the operator's agreement. A wider helper that would also cover code
jscpd does not flag, because each use differs after the shared part, is outside
the run: propose it to the operator rather than build it.

## 3. Check and report

- After each set, run the tests that cover the changed code and
  `.hh/shared/hh-clones` again with the same arguments: the set is gone or
  smaller, and no new one appeared.
- Commit each set's fix on its own, so each diff shows one removal.
- Report the summary line before and after, each set fixed, and each set left
  with its reason. The figures are reported as numbers, never held to a
  threshold.

## 4. Similar functions, on request

When the operator asks for similar functions, functions that do the same job
written differently, which no clone set shows. It is never run at commit or at a
wrap, since its pairs need reading and nearly all prove different jobs (diary
decision 2026-11-13: similar functions only on request).

- Run `.hh/shared/hh-clones --similar` with the same `--test` globs as step 1.
  It lists pairs, each with the checks that found it and their scores: the shape
  check, which compares the syntax of whole functions, within one file too, at a
  loose bar; and the semantic check, a code-embedding model that pairs
  look-alikes across files only. Pairs both checks find come first. Pairs
  already judged are skipped, as recorded in `.jscpd-judged.toml`, and the
  summary counts them; one listed again says why, a score risen or a check newly
  finding it.
- A summary line saying the semantic check was not run means its model is not on
  this machine. Tell the operator, and give the two steps that install it once
  per machine: add `~/.cache/jscpd`, as an absolute path, to the sandbox's write
  list in the user settings, beside `~/.cache/prek`; and type
  `! prek exec jscpd -- jscpd --semantic-download` in a session, which runs it
  outside the sandbox, since jscpd rejects the sandbox proxy's certificate.
  Report the run as the shape check alone. Exit 2 means a check could not run;
  stop and report it, as in step 1.
- Read both functions of every pair, in full, with their callers. Most pairs at
  these bars are related code, not duplicates: a function and its inverse, two
  parsers of different layouts. Keep a pair only when both do the same job, and
  say what each handles that the other does not.
- Show the operator the pairs kept, with that difference, and agree which to
  merge. A merge keeps every case either function handles, and is checked by the
  tests that cover both functions and by any output the project compares, such
  as golden files; then commit each merge on its own. Report the pairs read,
  kept and merged as numbers.
- Record every pair read and not merged, so no later run lists it again: copy
  the block the listing printed under the pair into `.jscpd-judged.toml` at the
  project root, creating it if needed, with its `verdict` and a one-line
  `reason`. The verdict is `different` for different jobs, `kept` for both kept
  with the operator's agreement, or `task` for one left to a plan task, which
  the reason names. A pair listed again replaces its old entry. A merged pair
  needs no entry, since it is gone. Commit the record with the work it records
  (diary decision 2026-11-06: a record of judged similar pairs).
