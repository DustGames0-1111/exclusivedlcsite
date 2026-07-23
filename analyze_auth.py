import re
from pathlib import Path

js = Path(r"C:\Users\ttfar\dimasclient-fun\site\assets\index-CDfA73H_.js").read_text(encoding="utf-8", errors="ignore")
out = Path(r"C:\Users\ttfar\dimasclient-fun\js_auth_deep.txt")
chunks = []

# Find key auth-related sections with more context
needles = [
    "ajax-cookie",
    "handleAuthorize",
    "handleRegistrate",
    "users/auth",
    "Checking for a bot",
    "group",
    "ADMIN",
    "subtill",
    "dashboard",
    "setCookie",
    "Cookies",
    "U.get",
    "U.set",
    "ir(",
    "turnStileSiteKey",
    "banned",
    "hwid",
]

for needle in needles:
    idxs = [m.start() for m in re.finditer(re.escape(needle), js)]
    chunks.append(f"\n##### {needle} ({len(idxs)}) #####\n")
    for i in idxs[:5]:
        chunks.append(js[max(0, i - 200): min(len(js), i + 400)])
        chunks.append("\n----\n")

# Extract group/role string literals near admin
for m in re.finditer(r'["\'](ADMIN|USER|BETA|MODER|OWNER|DEV|DEVELOPER|SUPPORT|STAFF)["\']', js):
    i = m.start()
    chunks.append(f"ROLE@{i}: {js[max(0,i-80):i+80]}\n")

out.write_text("\n".join(chunks), encoding="utf-8")
print("done", out.stat().st_size)
