#!/usr/bin/env bash
# Push this folder as ONE commit to the GitHub repository (state only, no history).
# Unpack the zip into a fresh folder and run the script there — not over an old clone, whose stale files would be committed too.
#   ./push.sh                      -> pushes to https://github.com/frnkptrln/control-by-attack-phase-matrix
#   ./push.sh owner/other-name     -> pushes to another repository
#   FORCE=1 ./push.sh              -> when the repository already has commits (an earlier push, or GitHub's initial README/LICENSE): its history is replaced by this commit
# Needs git with working GitHub credentials (credential helper or SSH); gh is not required.
set -euo pipefail
REPO="${1:-frnkptrln/control-by-attack-phase-matrix}"
URL="https://github.com/$REPO.git"
if [ ! -d .git ]; then git init -q; fi
git add -A
git commit -q -m "Control-by-attack-phase matrix for the OpenAI–Hugging Face agent intrusion (AI Incident Response Sprint, Track 1)" || echo "nothing new to commit"
git branch -M main
git remote remove origin 2>/dev/null || true
git remote add origin "$URL"
if git push -u origin main; then
  echo "pushed to https://github.com/$REPO"
elif [ "${FORCE:-0}" = "1" ]; then
  git push -u origin main --force && echo "pushed (replaced the repository's earlier commits) to https://github.com/$REPO"
else
  echo "push rejected: the repository already has commits (an earlier push, or GitHub-generated README/LICENSE). Re-run with FORCE=1 ./push.sh to replace its history with this state." >&2
  exit 1
fi
