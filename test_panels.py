"""Smoke-test local mock API response shapes for dashboard panels."""
import json
import urllib.parse
import urllib.request

BASE = "http://127.0.0.1:8080"


def post(path, params=None):
    qs = urllib.parse.urlencode(params or {})
    url = f"{BASE}{path}" + (f"?{qs}" if qs else "")
    req = urllib.request.Request(url, method="POST", data=b"")
    with urllib.request.urlopen(req, timeout=5) as r:
        raw = r.read()
        ctype = r.headers.get("Content-Type", "")
        if "json" in ctype:
            return json.loads(raw.decode("utf-8"))
        return raw.decode("utf-8")


def main():
    login = post(
        "/ajax/users/auth/default",
        {"hCaptcha": "x", "username": "Resence", "password": "YWRtaW4="},
    )
    assert login.get("authStatus") is True, login
    tok = login["token"]

    users = post("/ajax/admin/users/getAll", {"token": tok, "page": 0})
    assert isinstance(users, dict) and isinstance(users.get("content"), list), users
    print("users OK", len(users["content"]))

    keys = post("/ajax/admin/multiactions/keys/action/getAll", {"token": tok})
    assert isinstance(keys, list) and "key" in keys[0], keys
    print("keys OK", len(keys))

    promos = post("/ajax/admin/promocodes/getAll", {"token": tok})
    assert isinstance(promos, dict) and "WELCOME" in promos, promos
    print("promos OK", list(promos))

    logs = post("/ajax/admin/logs/getAllByCategory", {"token": tok, "category": 0})
    # postForm may send category differently; also try with empty
    if not isinstance(logs, dict):
        # maybe form-only; retry via query already used
        pass
    assert isinstance(logs, dict), logs
    print("logs OK", len(logs))

    versions = post("/ajax/admin/autoload/getVersions", {"token": tok})
    assert isinstance(versions, dict) and "display" in next(iter(versions.values())), versions
    print("versions OK", list(versions))

    bal = post("/ajax/admin/finances/getBalance", {"token": tok})
    assert isinstance(bal, dict) and "result" in bal, bal
    print("balance OK", bal["result"])

    banks = post("/ajax/admin/finances/getBanks", {"token": tok})
    assert isinstance(banks, dict), banks
    print("banks OK", list(banks))

    wd = post("/ajax/admin/finances/getWithdraws", {"token": tok})
    assert isinstance(wd, list) and "orderId" in wd[0], wd
    print("withdraws OK", len(wd))

    sess = post("/ajax/admin/states/isSessionInitialized", {"token": tok})
    print("session gate OK", sess)

    print("ALL PANEL SHAPES OK")


if __name__ == "__main__":
    main()
