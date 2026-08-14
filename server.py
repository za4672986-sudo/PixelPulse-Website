#!/usr/bin/env python3
"""
PixelPulse AI Studio server.

Serves the static site AND a secure AI proxy on one port.

Environment variables (never exposed to the browser):
  PORT        - listen port (default 8000)
  AI_API_URL  - OpenAI-compatible chat completions endpoint
  AI_API_KEY  - provider API key
  AI_MODEL    - default model
  AI_RATE_LIMIT - requests per minute per IP (default 20)

Run:  python server.py
"""

import json
import os
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.request import Request, urlopen
from urllib.parse import urlparse

PORT = int(os.environ.get("PORT", "8000"))
AI_API_URL = os.environ.get("AI_API_URL", "https://api.openai.com/v1/chat/completions")
AI_API_KEY = os.environ.get("AI_API_KEY", "")
AI_MODEL = os.environ.get("AI_MODEL", "gpt-4o-mini")
RATE_LIMIT = int(os.environ.get("AI_RATE_LIMIT", "20"))
WINDOW_SECONDS = 60
STATIC_DIR = os.path.dirname(os.path.abspath(__file__))

_rate = {}
_rate_lock = threading.Lock()

CONTENT_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".htm": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".txt": "text/plain; charset=utf-8",
}


def rate_limited(client_ip):
    now = time.time()
    with _rate_lock:
        stamps = [t for t in _rate.get(client_ip, []) if now - t < WINDOW_SECONDS]
        if len(stamps) >= RATE_LIMIT:
            return True
        stamps.append(now)
        _rate[client_ip] = stamps
        return False


class Handler(BaseHTTPRequestHandler):
    server_version = "PixelPulse/1.0"

    # ----------------------------- helpers -----------------------------

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Cache-Control", "no-store")

    def _json(self, obj, code=200):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(code)
        self._cors()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass

    # ------------------------------ routes ------------------------------

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        path = urlparse(self.path).path

        if path == "/api/status":
            self._json(
                {
                    "ok": True,
                    "key": bool(AI_API_KEY),
                    "model": AI_MODEL,
                    "provider": "configured" if AI_API_KEY else "unconfigured",
                }
            )
            return

        if path == "/" or path == "":
            path = "/index.html"

        full = os.path.normpath(os.path.join(STATIC_DIR, path.lstrip("/")))
        if not full.startswith(STATIC_DIR):
            self.send_error(403)
            return
        if os.path.isdir(full):
            full = os.path.join(full, "index.html")
        if not os.path.isfile(full):
            self.send_error(404)
            return

        ext = os.path.splitext(full)[1].lower()
        ctype = CONTENT_TYPES.get(ext, "application/octet-stream")
        with open(full, "rb") as fh:
            data = fh.read()

        self.send_response(200)
        self._cors()
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        if urlparse(self.path).path != "/api/generate":
            self.send_error(404)
            return

        self._cors()

        if rate_limited(self.client_address[0]):
            self._json({"error": "rate_limited", "message": "Rate limit exceeded. Try again in a minute."}, 429)
            return

        try:
            length = int(self.headers.get("Content-Length", 0))
            raw = self.rfile.read(length) if length else b"{}"
            body = json.loads(raw.decode("utf-8") or "{}")
        except Exception:
            self._json({"error": "invalid_json", "message": "Request body must be valid JSON."}, 400)
            return

        messages = body.get("messages")
        if not isinstance(messages, list) or not messages:
            self._json({"error": "messages_required", "message": "A non-empty 'messages' array is required."}, 400)
            return

        for m in messages:
            if not isinstance(m, dict) or not isinstance(m.get("content"), str):
                self._json({"error": "invalid_messages", "message": "Each message needs role and string content."}, 400)
                return
            if len(m.get("content", "")) > 40000:
                self._json({"error": "too_large", "message": "Message content too large."}, 413)
                return

        if not AI_API_KEY:
            self._json(
                {
                    "error": "no_key",
                    "message": "AI_API_KEY is not configured on the server. The client will fall back to its free provider.",
                },
                503,
            )
            return

        model = body.get("model") or AI_MODEL
        payload = {"model": model, "messages": messages, "temperature": 0.4, "max_tokens": 4096}

        req = Request(
            AI_API_URL,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json", "Authorization": "Bearer " + AI_API_KEY},
            method="POST",
        )

        try:
            with urlopen(req, timeout=180) as resp:
                data = resp.read().decode("utf-8")
            self._json(json.loads(data))
        except Exception as exc:
            self._json({"error": "upstream", "message": "Upstream AI provider error: %s" % exc}, 502)


if __name__ == "__main__":
    print(
        "PixelPulse AI Studio -> http://127.0.0.1:%d  (AI_API_KEY configured: %s)"
        % (PORT, bool(AI_API_KEY))
    )
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
