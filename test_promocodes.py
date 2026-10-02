import json
import time
import urllib.request
import urllib.parse
import subprocess
import sys

def run_tests():
    py_exe = r"C:\Program Files\AutoClaw\resources\python\python.exe"
    proc = subprocess.Popen([py_exe, "src-site/server.py"])
    time.sleep(1.5)
    
    base_url = "http://127.0.0.1:8080"
    
    try:
        def post(path, data=None, params=None):
            url = base_url + path
            if params:
                url += "?" + urllib.parse.urlencode(params)
            body = json.dumps(data).encode("utf-8") if data is not None else b"{}"
            req = urllib.request.Request(url, data=body, method="POST", headers={"Content-Type": "application/json"})
            try:
                with urllib.request.urlopen(req) as r:
                    resp_text = r.read().decode("utf-8")
                    try:
                        return r.status, json.loads(resp_text)
                    except:
                        return r.status, resp_text
            except urllib.error.HTTPError as e:
                resp_text = e.read().decode("utf-8")
                try:
                    return e.code, json.loads(resp_text)
                except:
                    return e.code, resp_text

        # 1. Admin login
        status, res = post("/ajax/users/auth/login", {"username": "DustGames"})
        print(f"Login admin: {status} -> {res}")
        admin_token = res["token"]

        # 2. Register normal test user
        uname = f"testuser_{int(time.time())}"
        status, res = post("/ajax/users/auth/register", {"username": uname, "email": f"{uname}@example.com"})
        print(f"Register user: {status} -> {res}")
        user_token = res["token"]

        # Check initial user session
        status, sess = post("/ajax/users/auth/session", {"token": user_token})
        print(f"Initial session: subtill={sess.get('subtill')}, hwid={sess.get('hwid')}")
        assert sess["subtill"] == "None"

        # 3. Create promocode in AdminPanel: PROMO30
        status, res = post("/ajax/admin/promocodes/create", {"token": admin_token, "promocode": "PROMO30", "bet": 30, "maxUsages": 10})
        print(f"Create PROMO30: {status} -> {res}")

        # 4. Activate PROMO30 as test user
        status, res = post("/ajax/users/actions/activateDigitalKey", params={"token": user_token, "key": "PROMO30"})
        print(f"Activate PROMO30: {status} -> {res}")
        assert status == 200

        # Check session after activation
        status, sess = post("/ajax/users/auth/session", {"token": user_token})
        print(f"Session after PROMO30: subtill={sess.get('subtill')}")
        assert sess["subtill"] != "None"

        # 5. Try to activate PROMO30 again (should fail)
        status, res = post("/ajax/users/actions/activateDigitalKey", params={"token": user_token, "key": "PROMO30"})
        print(f"Activate PROMO30 2nd time: {status} -> {res}")
        assert status == 400

        # 6. Create HWID promocode: FREEHWID
        status, res = post("/ajax/admin/promocodes/create", {"token": admin_token, "promocode": "FREEHWID", "bet": 0, "maxUsages": 10})
        print(f"Create FREEHWID: {status} -> {res}")

        # 7. Activate FREEHWID
        old_hwid = sess.get("hwid")
        status, res = post("/ajax/users/actions/activateDigitalKey", params={"token": user_token, "key": "FREEHWID"})
        print(f"Activate FREEHWID: {status} -> {res}")
        assert status == 200

        status, sess = post("/ajax/users/auth/session", {"token": user_token})
        print(f"Session after FREEHWID: hwid={sess.get('hwid')}")
        assert sess["hwid"].startswith("RESET-")

        # 8. Create Keys via multiactions: 30 days subscription
        status, res = post("/ajax/admin/multiactions/keys/subscription", params={"token": admin_token, "count": 1, "days": 60})
        key = res.strip().split("\n")[0]
        print(f"Created Key: {key}")

        # 9. Activate Key as user
        status, res = post("/ajax/users/actions/activateDigitalKey", params={"token": user_token, "key": key})
        print(f"Activate Key: {status} -> {res}")
        assert status == 200

        status, sess = post("/ajax/users/auth/session", {"token": user_token})
        print(f"Session after key: subtill={sess.get('subtill')}")

        print("\n[SUCCESS] ALL PROMOCODE AND KEY ACTIVATION TESTS PASSED!")
    finally:
        proc.terminate()

if __name__ == "__main__":
    run_tests()
