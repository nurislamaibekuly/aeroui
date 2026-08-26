#!/usr/bin/env bash
set -euo pipefail

RELEASE_BASE="https://nurislamaibekuly.github.io/aeroui"
FILES=(index.html src/aeroui.css)

usage() {
  echo "usage: scripts/switch-env.sh <dev|release|status>"
  exit 1
}

current() {
  if grep -rq "$RELEASE_BASE" "${FILES[@]}"; then
    echo "release ($RELEASE_BASE)"
  else
    echo "dev (./)"
  fi
}

[[ $# -le 1 ]] || usage

case "${1:-status}" in
  dev|debug)
    # index.html: <base>/src/... -> ./src/...
    # src/aeroui.css: <base>/src/... -> ./...
    sed -i '' -e "s|$RELEASE_BASE/|./|g" -e "s|http://localhost:8080/|./|g" index.html
    sed -i '' -e "s|$RELEASE_BASE/src/|./|g" -e "s|http://localhost:8080/src/|./|g" src/aeroui.css
    echo "switched to dev (./)"
    echo "serve the repo root with: python3 -m http.server"
    ;;
  release|prod)
    # index.html: ./src/... -> <base>/src/...
    # src/aeroui.css: ./... -> <base>/src/...
    sed -i '' "s|\./src/|$RELEASE_BASE/src/|g" index.html
    sed -i '' "s|\./components/|$RELEASE_BASE/src/components/|g" src/aeroui.css
    echo "switched to release ($RELEASE_BASE)"
    ;;
  status)
    echo "current env: $(current)"
    ;;
  *)
    usage
    ;;
esac
