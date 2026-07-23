import re
from pathlib import Path

js_path = Path(r"C:\Users\ttfar\dimasclient-fun\site\assets\index-CDfA73H_.js")
js = js_path.read_text(encoding="utf-8", errors="ignore")
out = Path(r"C:\Users\ttfar\dimasclient-fun\js_analysis.txt")

lines = []
patterns = [
    "captcha", "turnstile", "recaptcha", "hcaptcha", "sitekey", "cf-turnstile",
    "signIn", "signUp", "signin", "signup", "login", "register", "logout",
    "localStorage", "sessionStorage", "Authorization", "Bearer",
    "role", "ROLE", "subscription", "lifetime", "admin", "isAdmin",
    "hwid", "token", "jwt", "permission", "BETA", "USER", "ajax/",
    "getUser", "userInfo", "profile", "uid", "username",
]
for p in patterns:
    hits = list(re.finditer(re.escape(p), js, re.I))
    lines.append(f"=== {p}: {len(hits)} ===")
    for m in hits[:8]:
        start = max(0, m.start() - 120)
        end = min(len(js), m.end() + 180)
        snippet = js[start:end].replace("\n", " ")
        lines.append(snippet)
        lines.append("---")

# extract string literals that look like API paths
apis = sorted(set(re.findall(r'["\'](/?ajax/[^"\']+)["\']', js)))
lines.append("=== API PATHS ===")
lines.extend(apis)

# roles/enums
roles = sorted(set(re.findall(r'["\']([A-Z_]{3,})["\']', js)))
lines.append("=== UPPER STRINGS ===")
lines.extend([r for r in roles if any(x in r for x in ("ROLE", "ADMIN", "USER", "BETA", "AUTH", "CAPTCHA", "SUB", "PERM", "LIFE"))])

out.write_text("\n".join(lines), encoding="utf-8")
print(f"wrote {out} ({len(lines)} lines)")
