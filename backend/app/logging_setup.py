"""Structured JSON logging configuration.

Call `configure_logging()` once at startup. Every log record will be emitted as
a single-line JSON object that Azure Log stream / BetterStack can parse
without regex gymnastics.

Each record includes a request_id when emitted from within an HTTP request
(see app.middleware.request_id). Plain log calls outside a request still work;
they just omit `request_id`.
"""

from __future__ import annotations

import logging
import os
import sys
from contextvars import ContextVar
from typing import Optional

from pythonjsonlogger.jsonlogger import JsonFormatter


_request_id_var: ContextVar[Optional[str]] = ContextVar("request_id", default=None)


def set_request_id(value: Optional[str]) -> None:
    _request_id_var.set(value)


def get_request_id() -> Optional[str]:
    return _request_id_var.get()


class _RequestIdFilter(logging.Filter):
    """Inject the current request_id (if any) into every log record."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = get_request_id()
        return True


_CONFIGURED = False


def configure_logging() -> None:
    """Idempotently configure root logging to emit JSON to stdout."""
    global _CONFIGURED
    if _CONFIGURED:
        return

    level_name = os.getenv("LOG_LEVEL", "INFO").upper()
    level = getattr(logging, level_name, logging.INFO)

    handler = logging.StreamHandler(stream=sys.stdout)
    formatter = JsonFormatter(
        # Standard fields + our extras. JsonFormatter promotes record attrs
        # named in `fmt` to top-level keys.
        fmt="%(asctime)s %(levelname)s %(name)s %(request_id)s %(message)s",
        rename_fields={"asctime": "ts", "levelname": "level", "name": "logger"},
    )
    handler.setFormatter(formatter)
    handler.addFilter(_RequestIdFilter())

    root = logging.getLogger()
    # Replace existing handlers so re-running under uvicorn's reloader stays clean
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(level)

    # Quiet a few chatty libraries; we keep access logging at INFO via uvicorn
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)
    logging.getLogger("uvicorn.error").setLevel(logging.INFO)


    _CONFIGURED = True
