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
        key_sub = res.strip().split("\n")[0]
        print(f"Created Subscription Key: {key_sub}")

        # 9. Activate Key as user
        status, res = post("/ajax/users/actions/activateDigitalKey", params={"token": user_token, "key": key_sub})
        print(f"Activate Subscription Key: {status} -> {res}")
        assert status == 200

        status, sess = post("/ajax/users/auth/session", {"token": user_token})
        print(f"Session after subscription key: subtill={sess.get('subtill')}")

        # 10. Create Hardware Reset Key
        status, res = post("/ajax/admin/multiactions/keys/hardwareReset", params={"token": admin_token, "count": 1})
        key_hwid = res.strip().split("\n")[0]
        print(f"Created HWID Reset Key: {key_hwid}")

        # Activate HWID Key
        status, res = post("/ajax/users/actions/activateDigitalKey", params={"token": user_token, "key": key_hwid})
        print(f"Activate HWID Key: {status} -> {res}")
        assert status == 200
        status, sess = post("/ajax/users/auth/session", {"token": user_token})
        assert sess["hwid"].startswith("RESET-")

        # 11. Create Beta Key
        status, res = post("/ajax/admin/multiactions/keys/beta", params={"token": admin_token, "count": 1})
        key_beta = res.strip().split("\n")[0]
        print(f"Created Beta Key: {key_beta}")

        # Activate Beta Key
        status, res = post("/ajax/users/actions/activateDigitalKey", params={"token": user_token, "key": key_beta})
        print(f"Activate Beta Key: {status} -> {res}")
        assert status == 200
        status, sess = post("/ajax/users/auth/session", {"token": user_token})
        assert sess["role"] == "BETA"

        # 12. Create Lifetime Product Key
        status, res = post("/ajax/admin/multiactions/keys/additionalProduct", params={"token": admin_token, "count": 1, "productId": 102})
        key_life = res.strip().split("\n")[0]
        print(f"Created Lifetime Product Key: {key_life}")

        # 13. Test Users Pagination
        print("\n--- Testing Users Pagination ---")
        for idx in range(1, 20):
            u_name = f"pageuser_{idx}"
            post("/ajax/users/auth/register", {"username": u_name, "email": f"{u_name}@test.com"})

        # Get page 0 (1st page)
        status, res_p0 = post("/ajax/admin/users/getAll", params={"token": admin_token, "page": 0})
        print(f"Page 0: {len(res_p0['content'])} users, total pages: {res_p0['total']}")
        assert len(res_p0["content"]) == 9
        assert res_p0["total"] >= 3

        # Get page 1 (2nd page)
        status, res_p1 = post("/ajax/admin/users/getAll", params={"token": admin_token, "page": 1})
        print(f"Page 1: {len(res_p1['content'])} users, total pages: {res_p1['total']}")
        assert len(res_p1["content"]) == 9
        assert res_p1["content"][0]["uid"] != res_p0["content"][0]["uid"]

        # Get page 2 (3rd page)
        status, res_p2 = post("/ajax/admin/users/getAll", params={"token": admin_token, "page": 2})
        print(f"Page 2: {len(res_p2['content'])} users, total pages: {res_p2['total']}")
        assert len(res_p2["content"]) > 0

        # Test userSearch with query
        status, res_search = post("/ajax/admin/users/search", params={"token": admin_token, "query": "DustGames", "page": 0})
        print(f"Search DustGames: {len(res_search['content'])} users, total pages: {res_search['total']}")
        assert len(res_search["content"]) == 1
        assert res_search["total"] == 1
        assert res_search["content"][0]["user"] == "DustGames"

        print("\n[SUCCESS] ALL KEY, PROMOCODE, AND USERS PAGINATION TESTS PASSED!")
    finally:
        proc.terminate()

if __name__ == "__main__":
    run_tests()
