# zsh traps

The Bash tool runs commands in the operator's zsh, with the operator's options.

- **A glob that matches nothing aborts the command** with `no matches found`.
  Run the command with `setopt nullglob` in a subshell, for example
  `( setopt nullglob; for f in ./*.log; do ...; done )`. The `(N)` glob
  qualifier does not work here, because the shell has `nobareglobqual` set.
- **A word starting with `=` aborts the command**: `echo =====` fails with
  `==== not found`, because zsh expands `=word` to a command's path. Quote it:
  `echo '====='`.
- **An unquoted variable is not split into words.** With `v="-x 1.2.3.4"`, `$v`
  arrives as one argument. Use `${=v}` to split it, or keep the words in an
  array: `args=(-x 1.2.3.4); cmd "${args[@]}"`.
- **A colon after a variable can be a modifier**: `$tag:hooks/x` expands as
  `$tag` with the `:h` modifier and gives `.ooks/x`. Brace the name:
  `${tag}:hooks/x`.
- **`grep` is not GNU grep.** In the Bash tool it is a function Claude Code
  defines, which does not keep files in the order given, so the lines of a later
  file can print first. Where order matters, use `command grep`.
- **Arrays start at index 1.** In `a=(one two)`, `${a[1]}` is `one` and
  `${a[0]}` is empty.
- **`rm` is aliased to `rm -I`**, which prompts before removing more than three
  files or recursing. Use `command rm` when removal is intended.
- **A deletion never runs through an unchecked variable.** An empty variable
  turns `command rm -f $dir/x` into `command rm -f /x`. Prefer no deletion at
  all: overwrite the file, or write to a fresh name. Where one is needed, name
  the path literally, or guard each variable with `${dir:?}`, which aborts the
  command when it is empty.
- **Path modifiers can trip Claude Code's deletion check.** A command using
  `:t`, `:r` or `:h`, as in `${${f:t}:r}`, has been refused as a removal with a
  target it cannot resolve, though it deleted nothing. Use `basename` and
  `dirname` instead (diary decision 2026-11-06: deletions and path modifiers in
  zsh commands).
- **`status` is a read-only variable**: `status=$(...)` fails. Use another name,
  such as `rc`.
- **`path` is tied to `PATH`**: assigning `path=...` replaces `PATH`. Use
  another name, such as `file`.
