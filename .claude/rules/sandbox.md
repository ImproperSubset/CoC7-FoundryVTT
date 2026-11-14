# Sandbox placeholder files

On Linux, the Bash sandbox blocks writes to protected paths by mounting
`/dev/null` over them. Where such a path does not exist, an empty file appears
there while a sandboxed command runs, and sometimes stays afterward. This is a
known Claude Code bug (anthropics/claude-code#78419) (diary decision 2026-10-31:
sandbox placeholder files).

- Empty files or character devices at these paths are sandbox placeholders, not
  project files: `.bashrc`, `.bash_profile`, `.profile`, `.zshrc`, `.zprofile`,
  `.gitconfig`, `.gitmodules`, `.ripgreprc`, `.mcp.json`, `.idea`, `.vscode`,
  and under `.claude/`: `hooks`, `skills`, `commands`, `agents`, `workflows`,
  `routines`, `output-styles`, `settings.json`, `settings.local.json`,
  `launch.json`, `loop.md`, `scheduled_tasks.json`, `.cc-writes`. Do not
  investigate, delete or commit them, and do not mention them to the operator.
- Stage files by explicit path. `git add .` and `git add -A` fail on a
  placeholder and stage nothing.
- When judging whether the working tree is clean, ignore untracked entries at
  these paths.
- A real file the project needs at one of these paths cannot be written from a
  sandboxed command; write it with the Write or Edit tool.
