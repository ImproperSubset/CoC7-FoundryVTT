#!/usr/bin/env bash
# PostToolUse hook for Edit and Write: runs the project's formatters (mdformat,
# shfmt, Prettier for JSON, and ruff format where the project installs the Python
# pack) on the file Claude just wrote, through the hooks in its prek.toml, so
# the file matches what the commit checks expect and each formatter has one
# pinned version. prek picks the formatters that apply to the file's type, and
# only warns about a formatter the project's prek.toml lacks. Claude Code
# itself tells Claude when a hook changed the file.
set -uo pipefail

root="${CLAUDE_PROJECT_DIR:-${PWD}}"
file="$(jq -r '.tool_input.file_path // empty')" || exit 0

case "${file}" in
"${root}"/*) ;;
*) exit 0 ;;
esac
[[ -f "${file}" ]] || exit 0

before="$(sha256sum <"${file}")"
# prek also exits non-zero when it reformats a tracked file, so the checksum
# tells a reformat from a failure.
out="$(cd "${root}" && prek run mdformat shfmt prettier-json ruff-format --files "${file#"${root}"/}" 2>&1)"
rc=$?
after="$(sha256sum <"${file}")"

if [[ "${before}" == "${after}" ]] && ((rc != 0)); then
    # Exit 2 shows stderr to Claude: a formatter refused the file, or prek
    # could not run it.
    printf 'format: the formatters failed on %s:\n%s\n' "${file}" "${out}" >&2
    exit 2
fi
exit 0
