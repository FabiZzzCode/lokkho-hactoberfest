#!/bin/sh
# Fails if any tracked file looks like it contains a secret.
files=$(git ls-files | grep -v '^scripts/check-secrets.sh$')
[ -z "$files" ] && exit 0
bad=0
for p in 'AIza[0-9A-Za-z_-]{30,}' 'mongodb(\+srv)?://[^:/ ]+:[^@ <]+@' '^GEMINI_API_KEY=.+'; do
  if echo "$files" | xargs grep -nE "$p" 2>/dev/null; then bad=1; fi
done
[ $bad -eq 1 ] && { echo "Possible secret found"; exit 1; }
echo "check:secrets OK"
