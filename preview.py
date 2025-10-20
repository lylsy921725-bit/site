#!/usr/bin/env python3
"""Simple helper to preview the static site without guessing paths."""

from __future__ import annotations

import argparse
import contextlib
import socket
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Serve the Erawood Fabrication site for local preview."
    )
    parser.add_argument(
        "--host",
        default="0.0.0.0",
        help="Interface to bind (default: 0.0.0.0 for container compatibility)",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=4173,
        help="Port to listen on (default: 4173)",
    )
    return parser.parse_args()


def serve(directory: Path, host: str, port: int) -> None:
    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(directory), **kwargs)

        def log_message(self, format: str, *args) -> None:  # noqa: A003 - matching signature
            return super().log_message(format, *args)

    with contextlib.suppress(OSError):
        socket.setdefaulttimeout(None)

    server: ThreadingHTTPServer = ThreadingHTTPServer((host, port), Handler)
    base_url = f"http://{host}:{port}" if host not in {"0.0.0.0", "::"} else f"http://localhost:{port}"

    try:
        print("Static preview server ready:")
        print(f"  Frontend → {base_url}/index.html")
        print(f"  Admin    → {base_url}/admin.html")
        print("Press Ctrl+C to stop.")
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping preview server…")
    finally:
        server.server_close()


def main() -> None:
    args = parse_args()
    site_root = Path(__file__).resolve().parent
    serve(site_root, args.host, args.port)


if __name__ == "__main__":
    main()
