"""ASGI middleware that tags every request with a UUID for log correlation.

If the client supplies an `X-Request-ID` header we trust it (handy when chaining
through Vercel/Cloudflare); otherwise we generate one. The id is echoed back on
the response and also propagated to a contextvar so log records pick it up.
"""

from __future__ import annotations

import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.logging_setup import set_request_id


_HEADER = "x-request-id"


class RequestIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        rid = request.headers.get(_HEADER) or uuid.uuid4().hex
        set_request_id(rid)
        try:
            response = await call_next(request)
        finally:
            # Clear so log calls outside a request scope don't leak the previous id
            set_request_id(None)
        response.headers[_HEADER] = rid
        return response
