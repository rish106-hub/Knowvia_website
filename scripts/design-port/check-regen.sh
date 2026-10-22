#!/usr/bin/env bash
# Regenerates the design port into a temporary directory and compares it with the files in the repository.
# Exits nonzero if a generated file differs, is missing, or if the generator itself fails.
# Does not modify the working tree. Usage: scripts/design-port/check-regen.sh
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

python3 "$root/scripts/design-port/gen_site.py" "$root/design/claude-design" "$tmp" >/dev/null 2>"$tmp/.gen-stderr" || { cat "$tmp/.gen-stderr" >&2; echo "generator failed" >&2; exit 2; }
rm -f "$tmp/.gen-stderr"

status=0
while IFS= read -r -d '' file; do
  rel="${file#"$tmp"/}"
  if [ ! -f "$root/$rel" ]; then
    echo "missing in repo: $rel" >&2; status=1
  elif ! diff -u "$root/$rel" "$file" >&2; then
    echo "out of date: $rel (run: python3 scripts/design-port/gen_site.py design/claude-design .)" >&2; status=1
  fi
done < <(find "$tmp" -type f -print0)

[ "$status" -eq 0 ] && echo "design port is up to date"
exit "$status"
