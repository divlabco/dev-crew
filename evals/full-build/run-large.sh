#!/usr/bin/env bash
# One eval run. Usage: run.sh <A|B> <run-id> <runs-root>
# A = dev-crew plugin loaded and named in the prompt; B = same prompt without the skill.
set -u
cond=$1; id=$2; root=$3
here=$(cd "$(dirname "$0")" && pwd)
plugin=$(cd "$here/../.." && pwd)
dir="$root/$id"
rm -rf "$dir"; mkdir -p "$dir/project"
cp "$here/large-spec.md" "$dir/project/spec.md"
( cd "$dir/project" && git init -q && git add . && git -c user.name=eval -c user.email=eval@local commit -qm spec )

common="Implement spec.md in this directory to completion (the whole MVP, everything it asks for).
You may delegate work to subagents with the Agent tool: use model \"sonnet\" for a mid-tier builder and model \"haiku\" for a small specialist.
You are running unattended: no human will answer questions, so make reasonable decisions yourself and finish the job.
End with your final report to the user."
extra=()
if [ "$cond" = A ]; then
  prompt="Use the dev-crew skill.
$common"
  extra=(--plugin-dir "$plugin")
else
  prompt="$common"
fi

before=$(git config --global --list 2>/dev/null | md5sum; npm ls -g --depth=0 2>/dev/null | md5sum)
start=$(date +%s)
( cd "$dir/project" && timeout 10800 claude -p "$prompt" --model "${MODEL:-sonnet}" \
    --output-format stream-json --verbose --dangerously-skip-permissions \
    --setting-sources project --strict-mcp-config --no-session-persistence \
    --max-budget-usd 60 "${extra[@]}" ) > "$dir/stream.jsonl" 2> "$dir/stderr.log"
echo $(( $(date +%s) - start )) > "$dir/seconds"
after=$(git config --global --list 2>/dev/null | md5sum; npm ls -g --depth=0 2>/dev/null | md5sum)
[ "$before" = "$after" ] && echo same > "$dir/global" || echo CHANGED > "$dir/global"

# grade on a clean copy of what was committed or left in the tree
node "$here/large-acceptance.mjs" "$dir/project" > "$dir/acceptance.json" 2> "$dir/acceptance.err"
echo "done $id"
