#!/usr/bin/env bash
# build.sh — package SKILL.md + README.md into ai-worklog.skill (a zip).
#
# The skill format is a zip whose entries live under a folder named after the skill,
# using FORWARD-SLASH paths (ai-worklog/SKILL.md). Some Windows zip tools write
# backslash separators, which breaks extraction on macOS/Linux — so we build the zip
# with Python's zipfile, which always uses forward slashes, instead of a shell `zip`.

set -euo pipefail
cd "$(dirname "$0")"

OUT="ai-worklog.skill"

python - "$OUT" <<'PY'
import sys, zipfile
out = sys.argv[1]
files = [("SKILL.md", "ai-worklog/SKILL.md"),
         ("README.md", "ai-worklog/README.md")]
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
    for src, arc in files:
        z.write(src, arc)   # arcname uses '/', enforced by zipfile
print(f"built {out}")
for src, arc in files:
    print(f"  + {arc}")
PY

echo "verify with: unzip -l $OUT  (paths must use '/')"
