#!/usr/bin/env bash
set -e

VENV_PATH="${STARK_VENV_PATH:-$HOME/.stark-venv}"

echo "Setting up Python environment at $VENV_PATH ..."

if [ ! -d "$VENV_PATH" ]; then
  python3 -m venv "$VENV_PATH"
  echo "Created virtual environment."
else
  echo "Virtual environment already exists."
fi

"$VENV_PATH/bin/pip" install --quiet pypdfium2 Pillow

echo "Done. Python dependencies installed."
