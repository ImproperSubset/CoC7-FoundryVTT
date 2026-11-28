# Sandbox placeholder files

On Linux, the Bash sandbox keeps commands from writing to certain paths in the
project by mounting each one read-only while a command runs. A mount needs
something to mount onto, so where a protected path does not exist, the sandbox
creates an empty file there, or on some versions a character device, and it
stays after the command ends. This is a known Claude Code bug
(anthropics/claude-code#78419) (diary decision 2026-11-20: sandbox placeholder
files explained).

- The paths are `.bashrc`, `.bash_profile`, `.profile`, `.zshrc`, `.zprofile`,
  `.gitconfig`, `.gitmodules`, `.ripgreprc`, `.mcp.json`, `.idea`, `.vscode`,
  and under `.claude/`: `hooks`, `skills`, `commands`, `agents`, `workflows`,
  `routines`, `output-styles`, `settings.json`, `settings.local.json`,
  `launch.json`, `loop.md`, `scheduled_tasks.json`, `.cc-writes`. An empty file
  or character device at one of them is a placeholder, not a project file. Every
  project has them, and they are placeholders even at names that are normally
  folders, such as `.vscode`.
- Git does not show them where the operator's global git ignore file lists these
  paths. They still appear in a directory listing, a file search and
  `git status --ignored`.
- Stage files by explicit path. Where no ignore file covers the placeholders,
  `git status` lists them as untracked, which does not make the working tree
  dirty, and `git add .` and `git add -A` stage them or fail on them.
- A real file the project needs at one of these paths cannot be written from a
  sandboxed command; write it with the Write or Edit tool.
