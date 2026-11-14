#!/usr/bin/env bash
# SessionStart hook: reports hh-rules' pinned ref against its newest tag, flags
# rules that were requested but not fetched, or whose generated .claude/rules/
# file is missing, and lists the project's open GitHub issues, since other
# projects' sessions and hh-rules reach a project through them and nothing
# else shows one to the session.
set -uo pipefail

root="${CLAUDE_PROJECT_DIR:-${PWD}}"
lock="${root}/rulesync.lock"
[[ -f "${lock}" ]] || exit 0

lines=()
missing=()
unfetched=()

# A lock jq cannot read is reported, rather than read as a lock with nothing
# in it.
report() {
    jq -n --arg m "$1" \
        '{systemMessage: $m, hookSpecificOutput: {hookEventName: "SessionStart", additionalContext: $m}}'
}
unreadable() {
    report "Shared rules: rulesync.lock could not be read."
    exit 0
}
pins="$(jq -r '.sources | to_entries[] | [.key, .value.requestedRef] | @tsv' "${lock}")" || unreadable
resolved="$(jq -r '.sources[].resolvedRuleNames[]?' "${lock}")" || unreadable
# rulesync install succeeds when a requested rule does not exist at the ref,
# leaving it out of resolvedRuleNames.
requested="$(jq -r '.sources[] | ((.ruleSelection // []) - (.resolvedRuleNames // []))[]' "${lock}")" || unreadable

while IFS=$'\t' read -r source ref; do
    # Only hh-rules' own pin is reported: jscpd's skills are pinned to the jscpd
    # release hh-rules pins, and move only when hh-rules does.
    [[ "$(basename "${source%.git}")" == "hh-rules" ]] || continue
    name="$(basename "${source%.git}")"
    # A test tag carries a "-" and is never pushed, so the newest pushed tag
    # says nothing about it: a trial clone would be told to move back (diary
    # decision 2026-11-13: a test tag pin not compared with the newest tag).
    if [[ "${ref}" == *-* ]]; then
        lines+=("${name} pinned at test tag ${ref}; the newest tag is not compared")
        continue
    fi
    # The lock names a GitHub source by owner/repo alone, which ls-remote
    # cannot reach, so it gets its URL back; a file:// or other URL is used as
    # it is. A timeout keeps an offline start from stalling the session.
    url="${source}"
    if [[ "${source}" =~ ^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$ ]]; then
        url="https://github.com/${source}"
    fi
    latest="$(timeout 5 git ls-remote --tags --refs "${url}" 2>/dev/null |
        sed 's#.*refs/tags/##' | sort -V | tail -1)"
    if [[ -z "${latest}" ]]; then
        lines+=("${name} pinned at ${ref}; newest tag could not be checked")
    elif [[ "${latest}" == "${ref}" ]]; then
        lines+=("${name} pinned at ${ref}, the newest tag")
    else
        lines+=("${name} pinned at ${ref}; newer tag ${latest} is available (run /hh-rules to move to it)")
    fi
done <<<"${pins}"

while read -r rule; do
    [[ -z "${rule}" ]] || [[ -f "${root}/.claude/rules/${rule}.md" ]] || missing+=("${rule}")
done <<<"${resolved}"

while read -r rule; do
    [[ -z "${rule}" ]] || unfetched+=("${rule}")
done <<<"${requested}"

if ((${#unfetched[@]} > 0)); then
    lines+=("REQUESTED rules not found at the pinned tag: ${unfetched[*]}")
fi

if ((${#missing[@]} > 0)); then
    lines+=("MISSING generated rules: ${missing[*]} — run rulesync install and generate")
fi

# The project's open issues, by number and title. gh lists them for the
# repository the folder's remote names; a folder with no GitHub remote, no gh
# or no network says they could not be checked, never that there are none.
if issues="$(cd "${root}" && timeout 5 gh issue list --state open --limit 50 \
    --json number,title --jq '.[] | "#\(.number) \(.title)"' 2>/dev/null)"; then
    if [[ -z "${issues}" ]]; then
        lines+=("no open GitHub issues")
    else
        lines+=("OPEN GitHub issues, to raise with the operator: $(paste -sd '|' <<<"${issues}" | sed 's/|/, /g')")
    fi
else
    lines+=("open GitHub issues could not be checked")
fi

joined="$(printf '%s; ' "${lines[@]}")"
msg="Shared rules: ${joined%; }."
report "${msg}"
