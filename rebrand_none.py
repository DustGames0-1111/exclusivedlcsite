from pathlib import Path

root = Path(r"C:\Users\ttfar\dimasclient-fun")

# --- config ---
(root / "site" / "config.json").write_text(
    """{
  "shortClientName": "None",
  "clientName": "NONE",
  "version": "1.16.5",
  "supportEmail": "support@none.local",
  "url": "localhost",
  "ajaxUrl": "http://127.0.0.1:8080/ajax/",
  "funpayLink": "#",
  "clientColor": "#8be9fd",
  "socials": {
    "discord": "#",
    "telegram": "#"
  },
  "media": {
    "first": "https://www.youtube.com/embed/LsF6GYEHx1I?si=IFRCxX32_8xlJYTQ",
    "two": "https://www.youtube.com/embed/8v8nFWp-CsU?si=GONHbzfjxmMvfpxQ",
    "three": "https://www.youtube.com/embed/oWXd59Kutk8?si=MAP0AwdECXubqWPo"
  },
  "turnStileSiteKey": ""
}
""",
    encoding="utf-8",
)

# --- icons ---
icon = """<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="8" cy="8" r="3.1" fill="white"/>
  <ellipse cx="8" cy="8" rx="6.6" ry="2.6" stroke="white" stroke-width="1.35" fill="none" transform="rotate(-28 8 8)"/>
  <circle cx="13.15" cy="5.35" r="1.15" fill="white"/>
</svg>
"""
(root / "site" / "icon.svg").write_text(icon, encoding="utf-8")
(root / "site" / "favicon.svg").write_text(icon, encoding="utf-8")

# --- JS brand leftovers ---
js_path = root / "site" / "assets" / "index-CDfA73H_.js"
js = js_path.read_text(encoding="utf-8")
replacements = [
    ("Sk3dGuard", "None"),
    ("annihilatorq", "None"),
    ("https://github.com/None", "#"),  # after annihilatorq -> None in URL
]
for a, b in replacements:
    c = js.count(a)
    if c:
        js = js.replace(a, b)
        print(f"js: {a} -> {b} ({c})")
js_path.write_text(js, encoding="utf-8")

# --- server.py account/data branding ---
srv = root / "server.py"
text = srv.read_text(encoding="utf-8")
srv_repl = [
    ('"username": "farmila"', '"username": "None"'),
    ('"email": "farmila@localhost"', '"email": "none@localhost"'),
    ('"farmila": dict(ADMIN)', '"None": dict(ADMIN)'),
    ('"generatedBy": "farmila"', '"generatedBy": "None"'),
    ('"key": "DIMAS-', '"key": "NONE-'),
    ('"code": "FARMILA"', '"code": "NONE"'),
    ('username = params.get("username") or "farmila"', 'username = params.get("username") or "None"'),
    ('key = "DIMAS-" + secrets.token_hex(8).upper()', 'key = "NONE-" + secrets.token_hex(8).upper()'),
    ('seed = issue_token("farmila")', 'seed = issue_token("None")'),
    ('print("Admin: farmila / admin  (ADMIN + lifetime)", flush=True)', 'print("Admin: None / admin  (ADMIN + lifetime)", flush=True)'),
    ('"""Local static + mock API server for dimasclient mirror."""', '"""Local static + mock API server."""'),
]
# also logs with farmila username already covered by username field replacements in log blocks
text2 = text
for a, b in srv_repl:
    if a not in text2:
        print("WARN missing:", a)
    text2 = text2.replace(a, b)
# leftover farmila
if "farmila" in text2.lower() or "FARMILA" in text2 or "DIMAS" in text2:
    import re
    text2 = re.sub(r"farmila", "None", text2, flags=re.I)
    text2 = text2.replace("DIMAS-", "NONE-").replace("DIMAS", "NONE")
srv.write_text(text2, encoding="utf-8")
print("server updated; leftover farmila?", "farmila" in text2.lower())

# --- test_panels ---
tp = root / "test_panels.py"
if tp.exists():
    t = tp.read_text(encoding="utf-8").replace("farmila", "None").replace("FARMILA", "NONE")
    tp.write_text(t, encoding="utf-8")
    print("test_panels updated")

print("DONE")
