#!/usr/bin/env bash
# worklog-to-commit.sh — print the newest WORKLOG.md card as a commit-message body.
#
# Usage:
#   git commit -m "$(scripts/worklog-to-commit.sh)"
#
# Or wire it as a prepare-commit-msg hook so the newest card is appended automatically:
#   cp scripts/worklog-to-commit.sh .git/hooks/  # keep a copy, or symlink
#   cat > .git/hooks/prepare-commit-msg <<'EOF'
#   #!/usr/bin/env bash
#   # only on a normal commit (not merge/squash/amend with an existing message)
#   [ -z "$2" ] && printf '\n\n%s\n' "$(scripts/worklog-to-commit.sh)" >> "$1"
#   EOF
#   chmod +x .git/hooks/prepare-commit-msg
#
# The newest card is the first frontmatter block in WORKLOG.md (newest-first order).
# We emit the human-readable body (the part after the frontmatter), since a commit
# message wants prose, not YAML. The title line (### ...) becomes the body's lead.

set -euo pipefail

FILE="${1:-WORKLOG.md}"

if [ ! -f "$FILE" ]; then
  echo "worklog-to-commit: $FILE not found" >&2
  exit 1
fi

awk '
  # state: 0 before first card, 1 inside frontmatter, 2 inside body
  BEGIN { state = 0 }
  state == 0 && $0 == "---" { state = 1; next }
  state == 1 && $0 == "---" { state = 2; next }
  state == 2 && $0 == "---" { exit }   # next card started — stop
  state == 2 { print }
' "$FILE" | sed 's/^### *//' | sed '/^$/{N;/^\n$/D;}'
