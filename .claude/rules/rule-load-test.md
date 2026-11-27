---
paths:
  - .claude/rules/**
---

# The rule-load test

- A new path-scoped rule is tested once in a fresh session: read a file it
  covers, without opening the rule, and check that the rule loads. A wrong path
  makes it fail silently. The session that wrote the rule runs the test itself,
  with a headless `claude -p` in the project's folder, given the Read tool and
  no other with `--tools Read`, and told to read one file the rule covers. The
  run is given an `InstructionsLoaded` hook in `--settings`, which logs each
  rule file as it loads, with `<log>` a file outside the project, so nothing in
  the project changes. It is started outside the sandbox, inside which a
  headless session cannot sign in:

  ```shell
  claude -p "Read <file> with the Read tool and reply done." \
    --tools Read --settings '{"hooks":{"InstructionsLoaded":[{"hooks":
    [{"type":"command","command":"jq -c . >> <log>"}]}]}}'
  ```

  The test counts only where the run exits 0, since a run that fails still logs
  the rules loaded at its start. It passes when the log holds the new rule with
  the `load_reason` `path_glob_match` and the file read as its
  `trigger_file_path`, and holds no rule written for other files. The log is the
  evidence, not the headless session's account of what loaded (diary decision
  2026-11-21: the rule-load test read from a hook's log).
