#!/usr/bin/env bash
# Commit check: refuses a commit that adds the identity of whoever commits,
# such as their name, username or email, using gitleaks rules kept in
# ~/.config/hh-rules/identity.toml. The rules live outside every repository,
# because a repository that held them would publish what they protect. A
# missing file fails the commit rather than passing it silently; a file with no
# rules is the way to opt out. /hh-rules copies this script to
# .hh/shared/identity-check.sh, and prek runs it in the gitleaks hook's
# environment, which puts gitleaks on PATH.
#
# prek passes the staged files its `exclude` leaves in, and only the lines
# those files add are scanned, so an exception agreed for a file holds
# whatever else the commit stages (diary decision 2026-11-12: identity
# exceptions per file). prek skips the hook when no staged file is left, so a
# run with no files means the hook lacks `pass_filenames = true`, and it fails
# rather than passing a commit it never checked.
#
# With HH_IDENTITY_WHOLE=1 it scans the whole of each file instead, for the
# scan of every file that /hh-rules runs at setup and at each update, which
# finds what a commit made without the hook added (diary decision 2026-11-12:
# identity covered at commit and by a scan at each update).
set -uo pipefail
config="${HOME}/.config/hh-rules/identity.toml"
if [[ ! -r "${config}" ]]; then
    echo "identity check: ${config} is missing." >&2
    echo "Write gitleaks rules there for the names to keep out of commits, or a" >&2
    echo "file with no rules to opt out." >&2
    exit 1
fi

# The text to scan in the given files: the lines the staged diff adds, without
# the diff's marks, or with HH_IDENTITY_WHOLE=1 the whole of each file.
content() {
    if [[ "${HH_IDENTITY_WHOLE:-}" == 1 ]]; then
        cat -- "$@"
        return
    fi
    git diff --cached --no-color --no-ext-diff -U0 -- "$@" |
        awk '/^diff --git / { hunk = 0; next } /^@@ / { hunk = 1; next } hunk && /^\+/ { print substr($0, 2) }'
}

scan() {
    gitleaks stdin --no-banner --redact --verbose --config "${config}"
}

if [[ $# -eq 0 ]]; then
    echo "identity check: no files given; the identity hook in prek.toml needs" >&2
    echo "pass_filenames = true." >&2
    exit 1
fi
# One scan over everything first; only a failure is scanned again file by
# file, to name the files.
if content "$@" | scan >/dev/null 2>&1; then
    exit 0
fi
rc=0
for file in "$@"; do
    if ! content "${file}" | scan; then
        echo "identity check: ${file} holds a match" >&2
        rc=1
    fi
done
if [[ "${rc}" -eq 0 ]]; then
    echo "identity check: gitleaks failed on the files together but on no one file" >&2
    rc=1
fi
exit "${rc}"
