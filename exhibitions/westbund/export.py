"""Refresh the standalone preview using its existing shell and editable fragment."""

import argparse
from html import escape, unescape
from pathlib import Path
import re


DIRECTORY = Path(__file__).resolve().parent
SHELL = DIRECTORY / "index.html"
HELPERS = '\n<script src="https://unpkg.com/@floating-ui/core@1.7.3/dist/floating-ui.core.umd.min.js"></script>'


def render(fragment: str) -> str:
    # Keep the original preview CSS, sandbox, CSP, and optional UI helpers.
    document = SHELL.read_text(encoding="utf-8")
    frame = re.search(r'(<iframe\b[^>]*\bsrcdoc=")([^"]*)(")', document)
    if frame is None:
        raise ValueError("The standalone shell is missing its srcdoc frame.")
    inner = unescape(frame.group(2))
    prefix, body_start, body = inner.partition("<body>\n")
    _, helpers_start, suffix = body.rpartition(HELPERS)
    if not body_start or not helpers_start:
        raise ValueError("The standalone shell has an unrecognized body structure.")
    updated = prefix + body_start + fragment + helpers_start + suffix
    return document[:frame.start(2)] + escape(updated) + document[frame.end(2):]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", nargs="?", type=Path, default=DIRECTORY / "source.html")
    parser.add_argument("destination", nargs="?", type=Path, default=SHELL)
    args = parser.parse_args()
    document = render(args.source.read_text(encoding="utf-8"))
    args.destination.parent.mkdir(parents=True, exist_ok=True)
    args.destination.write_text(document, encoding="utf-8")
    print(args.destination)


if __name__ == "__main__":
    main()
