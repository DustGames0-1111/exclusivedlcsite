"""Local static + mock API server."""
from __future__ import annotations

import json
import secrets
import time
import urllib.parse
from datetime import datetime, timedelta, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent / "site"
PORT = 8080

NOW = datetime.now(timezone.utc)
SUB_FOREVER = (NOW + timedelta(days=36500)).strftime("%d.%m.%Y")

ADMIN = {
    "id": 1,
    "username": "DustGames",
    "email": "dustgames@local",
    "isEmailVerified": True,
    "role": "ADMIN",
    "banned": False,
    "hwid": "LOCAL-FULL-ACCESS",
    "subtill": SUB_FOREVER,
    "regdate": "01.01.2024",
}

USERS: dict[str, dict] = {
    "DustGames": dict(ADMIN),
}
TOKENS: dict[str, str] = {}

KEYS: list[dict] = []
PROMOCODES: dict[str, dict] = {}
LOGS: dict[str, dict] = {}
WITHDRAWS: list[dict] = []
VERSIONS: dict[str, dict] = {
    "1.16.5": {"display": "1.16.5", "identify": "1.16.5"},
    "1.21.4": {"display": "1.21.4 BETA", "identify": "1.21.4"},
}
BANKS: dict[str, dict] = {
    "sber": {"name": "Sberbank", "id": "sber"},
    "tinkoff": {"name": "Tinkoff", "id": "tinkoff"},
    "alfa": {"name": "Alfa-Bank", "id": "alfa"},
}

ADDITIONAL_PRODUCTS = [
    {"display": "BETA 1.21.4", "price": 899, "id": 101, "role": "BETA"},
    {"display": "BETA 1.21.4 + LifeTime", "price": 1399, "id": 102, "role": "BETA", "time": 999},
]


def issue_token(username: str) -> str:
    token = secrets.token_hex(24)
    TOKENS[token] = username
    return token


def session_payload(user: dict, token: str) -> dict:
    return {
        "authStatus": True,
        "authMessage": "OK",
        "id": user["id"],
        "username": user["username"],
        "email": user["email"],
        "isEmailVerified": user["isEmailVerified"],
        "role": user["role"],
        "banned": user["banned"],
        "token": token,
        "hwid": user["hwid"],
        "subtill": user["subtill"],
        "regdate": user["regdate"],
    }


def read_payments(name: str):
    path = ROOT / "ajax" / "payments" / name
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    alt = ROOT / "ajax" / "payments" / f"{name}.json"
    if alt.exists():
        return json.loads(alt.read_text(encoding="utf-8"))
    return []


def parse_body(handler: "Handler") -> dict:
    length = int(handler.headers.get("Content-Length") or 0)
    if length <= 0:
        return {}
    raw = handler.rfile.read(length)
    ctype = (handler.headers.get("Content-Type") or "").lower()
    if "application/json" in ctype:
        try:
            return json.loads(raw.decode("utf-8") or "{}")
        except Exception:
            return {}
    # form / multipart: flatten query-style and simple multipart name="..."
    text = raw.decode("utf-8", errors="ignore")
    if "multipart/form-data" in ctype:
        out: dict = {}
        for part in text.split("Content-Disposition:"):
            if "name=" not in part:
                continue
            try:
                name = part.split('name="', 1)[1].split('"', 1)[0]
            except Exception:
                continue
            # value after headers blank line
            if "\r\n\r\n" in part:
                val = part.split("\r\n\r\n", 1)[1]
                val = val.rsplit("\r\n--", 1)[0]
                out[name] = val.strip("\r\n")
            elif "\n\n" in part:
                val = part.split("\n\n", 1)[1]
                val = val.rsplit("\n--", 1)[0]
                out[name] = val.strip("\n")
        return out
    # x-www-form-urlencoded
    qs = urllib.parse.parse_qs(text, keep_blank_values=True)
    return {k: v[0] if len(v) == 1 else v for k, v in qs.items()}


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def _json(self, code: int, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _text(self, code: int, text: str):
        body = str(text).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _parse(self):
        parsed = urllib.parse.urlparse(self.path)
        qs = urllib.parse.parse_qs(parsed.query)
        params = {k: v[0] if len(v) == 1 else v for k, v in qs.items()}
        return parsed.path.rstrip("/") or "/", params

    def _user_from_token(self, params: dict, body: dict | None = None):
        token = params.get("token") or (body or {}).get("token")
        if not token or token not in TOKENS:
            return None, None
        username = TOKENS[token]
        return USERS.get(username), token

    def _handle_ajax(self, method: str):
        path, params = self._parse()
        body = {}
        if method in ("POST", "PATCH"):
            body = parse_body(self)
            # merge body into params for convenience (query wins)
            for k, v in body.items():
                params.setdefault(k, v)

        # ---- auth ----
        if path == "/ajax/users/auth/default" and method == "POST":
            raw_user = (params.get("username") or "").strip()
            is_super = raw_user.lower() == "dustgames"
            username = "DustGames" if is_super else (raw_user or "User")
            if username not in USERS:
                role = "ADMIN" if is_super else "USER"
                subtill = SUB_FOREVER if is_super else "None"
                USERS[username] = {
                    "id": max((u["id"] for u in USERS.values()), default=0) + 1,
                    "username": username,
                    "email": f"{username.lower()}@localhost",
                    "isEmailVerified": True,
                    "role": role,
                    "banned": False,
                    "hwid": "LOCAL-FULL-ACCESS" if is_super else "HWID-NONE",
                    "subtill": subtill,
                    "regdate": "01.01.2024",
                }
            user = USERS[username]
            token = issue_token(user["username"])
            return self._json(
                200,
                {
                    "authStatus": True,
                    "authMessage": f"Welcome, {user['username']}!",
                    "token": token,
                },
            )

        if path == "/ajax/users/auth/register" and method == "POST":
            raw_user = (params.get("username") or "user").strip()
            is_super = raw_user.lower() == "dustgames"
            username = "DustGames" if is_super else raw_user
            email = params.get("email") or f"{username.lower()}@localhost"
            role = "ADMIN" if is_super else "USER"
            subtill = SUB_FOREVER if is_super else "None"
            USERS[username] = {
                "id": max((u["id"] for u in USERS.values()), default=0) + 1,
                "username": username,
                "email": email,
                "isEmailVerified": True,
                "role": role,
                "banned": False,
                "hwid": "LOCAL-FULL-ACCESS" if is_super else ("HWID-" + secrets.token_hex(4).upper()),
                "subtill": subtill,
                "regdate": "01.01.2024",
            }
            token = issue_token(username)
            return self._json(
                200,
                {
                    "authStatus": True,
                    "authMessage": "Registered successfully",
                    "token": token,
                },
            )

        if path == "/ajax/users/auth/session" and method == "POST":
            user, token = self._user_from_token(params)
            if not user:
                return self._json(200, {"authStatus": False, "authMessage": "No session"})
            return self._json(200, session_payload(user, token))

        if path == "/ajax/users/auth/logout" and method == "POST":
            token = params.get("token")
            if token in TOKENS:
                del TOKENS[token]
            return self._text(200, "Logged out")

        if path == "/ajax/users/auth/2fa/initializePanelSession" and method == "POST":
            user, _ = self._user_from_token(params)
            if not user:
                return self._text(401, "Unauthorized")
            return self._text(200, "OK")

        if path == "/ajax/payments/getAll":
            return self._json(200, read_payments("getAll.json") or [
                {"type": 1, "price": 339, "time": 30},
                {"type": 2, "price": 489, "time": 365},
                {"type": 3, "price": 629, "time": 999},
                {"type": 4, "price": 299},
            ])

        if path == "/ajax/payments/additional/getAll":
            return self._json(200, read_payments("additional/getAll.json") or ADDITIONAL_PRODUCTS)

        # Media panel (youtuber/admin promo stats)
        if path == "/ajax/promocodes/getInformation" and method == "POST":
            user, token = self._user_from_token(params)
            if not user:
                return self._text(401, "Unauthorized")
            # Must NOT include `message` — frontend treats that as an error and redirects
            now_ms = int(time.time() * 1000)
            payments = [
                {
                    "title": "Lifetime",
                    "amount": 629,
                    "buyTime": now_ms - 86400000 * 6,
                    "name": "Lifetime",
                    "value": 629,
                    "payload": {"time": now_ms - 86400000 * 6},
                },
                {
                    "title": "30 days",
                    "amount": 339,
                    "buyTime": now_ms - 86400000 * 3,
                    "name": "30 days",
                    "value": 339,
                    "payload": {"time": now_ms - 86400000 * 3},
                },
                {
                    "title": "365 days",
                    "amount": 489,
                    "buyTime": now_ms - 86400000,
                    "name": "365 days",
                    "value": 489,
                    "payload": {"time": now_ms - 86400000},
                },
            ]
            return self._json(
                200,
                {
                    "bet": 15,
                    "code": "RESENCE",
                    "paymentBet": 50,
                    "payments": payments,
                    "totalAmount": sum(p["amount"] for p in payments),
                    "usages": 12,
                },
            )

        if path == "/ajax/promocodes/link" and method == "POST":
            user, token = self._user_from_token(params)
            if not user:
                return self._text(401, "Unauthorized")
            return self._text(200, "Promocode linked")

        # ---- admin / friends ----
        if path.startswith("/ajax/admin/") or path.startswith("/ajax/friends/"):
            user, token = self._user_from_token(params, body)
            # getBanks is called without token param by the frontend
            if not user and path.endswith("/finances/getBanks"):
                return self._json(200, BANKS)
            if not user:
                return self._text(401, "Unauthorized")

            # session gate
            if path.endswith("/isSessionInitialized"):
                return self._text(200, "true")

            # users list (paged)
            if path.endswith("/users/getAll") or path.endswith("/users/search"):
                q = (params.get("query") or "").lower()
                rows = []
                for u in USERS.values():
                    if q and q not in u["username"].lower() and q not in u["email"].lower():
                        continue
                    rows.append(
                        {
                            "uid": u["id"],
                            "user": u["username"],
                            "email": u["email"],
                            "group": u["role"],
                            "banned": u["banned"],
                            "hwid": u["hwid"],
                            "subtill": u["subtill"],
                        }
                    )
                return self._json(200, {"content": rows, "total": 1})

            if path.endswith("/users/getByIdentifier"):
                uid = int(params.get("id") or 0)
                u = next((x for x in USERS.values() if x["id"] == uid), ADMIN)
                return self._json(
                    200,
                    {
                        "banned": u["banned"],
                        "email": u["email"],
                        "group": u["role"],
                        "hwid": u["hwid"],
                        "subtill": u["subtill"],
                        "user": u["username"],
                    },
                )

            if path.endswith("/users/patch") and method == "PATCH":
                uname = params.get("user") or body.get("username")
                if uname in USERS:
                    if "role" in body:
                        USERS[uname]["role"] = body["role"]
                    if "isBanned" in body:
                        USERS[uname]["banned"] = bool(body["isBanned"])
                    if "subTill" in body:
                        USERS[uname]["subtill"] = body["subTill"]
                    if "email" in body:
                        USERS[uname]["email"] = body["email"]
                return self._text(200, "User updated")

            if path.endswith("/resetHardwareId"):
                uname = params.get("user")
                if uname in USERS:
                    USERS[uname]["hwid"] = "RESET-" + secrets.token_hex(4)
                return self._text(200, "HWID reset")

            # ---- keys ----
            if path.endswith("/keys/action/getAll"):
                return self._json(200, KEYS)

            if path.endswith("/keys/action/remove"):
                key = params.get("key")
                KEYS[:] = [k for k in KEYS if k.get("key") != key]
                return self._text(200, "Key removed")

            if path.endswith("/keys/getAdditionalProducts"):
                return self._json(200, ADDITIONAL_PRODUCTS)

            if "/multiactions/keys" in path:
                # create keys: return plaintext list for download
                count = int(params.get("count") or body.get("count") or 1)
                count = max(1, min(count, 50))
                days = params.get("days") or body.get("days") or ""
                product_id = params.get("productId") or body.get("productId")
                display = "Custom"
                if path.endswith("/subscription"):
                    display = f"{days} days" if days else "Subscription"
                elif path.endswith("/hardwareReset"):
                    display = "Hardware Reset"
                elif path.endswith("/beta"):
                    display = "BETA"
                elif path.endswith("/additionalProduct"):
                    prod = next((p for p in ADDITIONAL_PRODUCTS if str(p["id"]) == str(product_id)), None)
                    display = prod["display"] if prod else "Product"
                lines = []
                for _ in range(count):
                    key = "RESENCE-" + secrets.token_hex(8).upper()
                    KEYS.append({"key": key, "display": display, "generatedBy": user["username"]})
                    lines.append(key)
                LOGS[str(int(time.time()))] = {
                    "username": user["username"],
                    "action": f"Generated {count} key(s): {display}",
                }
                return self._text(200, "\n".join(lines))

            # ---- promocodes ----
            if path.endswith("/promocodes/getAll"):
                return self._json(200, PROMOCODES)

            if path.endswith("/promocodes/get"):
                name = params.get("promocode") or ""
                info = PROMOCODES.get(name) or {
                    "name": name,
                    "discount": 0,
                    "activations": 0,
                    "maxActivations": 0,
                    "bet": 0,
                    "maxUsages": 0,
                }
                return self._json(200, info)

            if path.endswith("/promocodes/create"):
                name = params.get("promocode") or body.get("promocode") or "PROMO"
                bet = int(params.get("bet") or body.get("bet") or 10)
                max_u = int(params.get("maxUsages") or body.get("maxUsages") or 100)
                PROMOCODES[name] = {
                    "name": name,
                    "discount": bet,
                    "activations": 0,
                    "maxActivations": max_u,
                    "bet": bet,
                    "maxUsages": max_u,
                }
                return self._text(200, "Promocode created")

            if path.endswith("/promocodes/patch"):
                name = params.get("promocode") or body.get("promocode")
                if name in PROMOCODES:
                    if "bet" in params or "bet" in body:
                        bet = int(params.get("bet") or body.get("bet"))
                        PROMOCODES[name]["bet"] = bet
                        PROMOCODES[name]["discount"] = bet
                    if "maxUsages" in params or "maxUsages" in body:
                        mu = int(params.get("maxUsages") or body.get("maxUsages"))
                        PROMOCODES[name]["maxUsages"] = mu
                        PROMOCODES[name]["maxActivations"] = mu
                return self._text(200, "Promocode updated")

            if path.endswith("/promocodes/delete"):
                name = params.get("promocode") or body.get("promocode")
                if name in PROMOCODES:
                    del PROMOCODES[name]
                    return self._text(200, "Promocode deleted")
                return self._text(200, "This promo code was not found")

            if path.endswith("/resetUsages"):
                name = params.get("promocode") or body.get("promocode")
                if name in PROMOCODES:
                    PROMOCODES[name]["activations"] = 0
                return self._text(200, "Usages reset")

            if path.endswith("/statistic/get"):
                return self._json(200, {"payments": [], "total": 0})

            if path.endswith("/statistic/clearPayments"):
                return self._text(200, "Statistics cleared")

            # ---- logs ----
            if path.endswith("/logs/getAllByCategory"):
                return self._json(200, LOGS)

            if path.endswith("/logs/remove"):
                ts = str(params.get("timeStamp") or body.get("timeStamp") or "")
                if ts in LOGS:
                    del LOGS[ts]
                return self._text(200, "Log removed")

            # ---- autoload ----
            if path.endswith("/autoload/getVersions"):
                return self._json(200, VERSIONS)

            
            # ---- media video config ----
            if path.endswith("/media/getVideo"):
                cfg_path = ROOT / "config.json"
                vurl = ""
                if cfg_path.exists():
                    try:
                        cfg_data = json.loads(cfg_path.read_text(encoding="utf-8"))
                        vurl = cfg_data.get("media", {}).get("first", "")
                    except Exception:
                        pass
                return self._json(200, {"videoUrl": vurl})

            if path.endswith("/media/setVideo"):
                raw_url = str(params.get("videoUrl") or body.get("videoUrl") or "").strip()
                import re as _re
                m = _re.search(r'(?:watch\?v=|youtu\.be/|shorts/|embed/|^)([a-zA-Z0-9_-]{11})', raw_url)
                embed_url = f"https://www.youtube.com/embed/{m.group(1)}" if m else raw_url
                cfg_path = ROOT / "config.json"
                if cfg_path.exists():
                    try:
                        cfg_data = json.loads(cfg_path.read_text(encoding="utf-8"))
                        cfg_data.setdefault("media", {})["first"] = embed_url
                        cfg_path.write_text(json.dumps(cfg_data, indent=2, ensure_ascii=False), encoding="utf-8")
                    except Exception as e:
                        return self._text(500, f"Error writing config: {e}")
                return self._json(200, {"status": "ok", "videoUrl": embed_url})
if path.endswith("/autoload/uploadVersion"):
                return self._text(200, "Version uploaded successfully")

            # ---- finances / withdraw ----
            if path.endswith("/finances/getBalance"):
                return self._json(200, {"result": 999999})

            if path.endswith("/finances/getBanks"):
                return self._json(200, BANKS)

            if path.endswith("/finances/getWithdraws"):
                return self._json(200, WITHDRAWS)

            if path.endswith("/finances/createInference"):
                oid = "WD-" + secrets.token_hex(3).upper()
                WITHDRAWS.insert(
                    0,
                    {
                        "orderId": oid,
                        "amount": int(params.get("amount") or 0),
                        "status": "PENDING",
                        "type": params.get("type") or "SBP",
                        "wallet": params.get("wallet") or "",
                        "bank": params.get("bank") or "",
                    },
                )
                return self._text(200, f"Withdraw created: {oid}")

            if path.endswith("/updateInferenceStatus"):
                oid = params.get("orderId")
                for w in WITHDRAWS:
                    if w["orderId"] == oid:
                        w["status"] = "DONE"
                return self._text(200, "Status updated")

            if path.endswith("/returnCancelledInference"):
                oid = params.get("orderId")
                for w in WITHDRAWS:
                    if w["orderId"] == oid:
                        w["status"] = "CANCELLED"
                return self._text(200, "Inference cancelled")

            # friends / anything else admin
            if path.startswith("/ajax/friends/"):
                return self._json(200, [])

            return self._json(200, {"ok": True, "message": "Local mock OK"})

        # user cabinet extras / generic
        if path.startswith("/ajax/"):
            # Never return a bare `message` field — many pages treat it as failure
            return self._json(200, {"ok": True, "authStatus": True})

        return False

    def do_POST(self):
        if self.path.startswith("/ajax/"):
            return self._handle_ajax("POST")
        self.send_error(404)

    def do_PATCH(self):
        if self.path.startswith("/ajax/"):
            return self._handle_ajax("PATCH")
        self.send_error(404)

    def do_GET(self):
        if self.path.startswith("/ajax/"):
            return self._handle_ajax("GET")
        parsed = urllib.parse.urlparse(self.path)
        rel = parsed.path.lstrip("/")
        if rel and not (ROOT / rel).exists() and not Path(rel).suffix:
            self.path = "/index.html"
        return super().do_GET()

    def log_message(self, fmt, *args):
        print("[%s] %s" % (self.log_date_time_string(), fmt % args), flush=True)


def main():
    seed = issue_token("Resence")
    print(f"Serving {ROOT} on http://127.0.0.1:{PORT}/", flush=True)
    print("Admin: Resence / admin  (ADMIN + lifetime)", flush=True)
    print(f"Seed cookie ajax-cookie={seed}", flush=True)
    httpd = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    httpd.serve_forever()


if __name__ == "__main__":
    main()
