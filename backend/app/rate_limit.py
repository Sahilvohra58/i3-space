"""Shared slowapi limiter instance.

Defining this in its own module avoids a circular import between `main.py`
(which mounts the limiter) and routers (which decorate routes with it).
"""

from __future__ import annotations

from slowapi import Limiter
from slowapi.util import get_remote_address


limiter = Limiter(key_func=get_remote_address)
