import re
from pathlib import Path

js = Path(r"C:\Users\ttfar\dimasclient-fun\site\assets\index-CDfA73H_.js").read_text(encoding="utf-8", errors="ignore")
out = []

# All dashboard routes
routes = sorted(set(re.findall(r"`/dashboard/[^`]+`", js)))
out.append("ROUTES:\n" + "\n".join(routes))

# Admin API methods on Rv class region
idx = js.find("Rv=new class{")
out.append("\n\n===== Rv class start =====\n")
out.append(js[idx : idx + 4500])

# For each panel path, grab nearby component data loading
for panel in [
    "keys/panel",
    "promocodes/panel",
    "logs/panel",
    "autoupload/panel",
    "withdraw/panel",
    "users/panel",
    "users/redact",
]:
    out.append(f"\n\n===== PANEL {panel} =====\n")
    for m in re.finditer(re.escape(panel), js):
        out.append(js[max(0, m.start() - 100) : m.start() + 200])
        out.append("\n--\n")

# Find destructuring patterns near dashboard
out.append("\n\n===== DESTRUCTURE PATTERNS =====\n")
for m in re.finditer(r"\{[a-zA-Z,:]+\}=\([^)]*await Rv\.[^)]+\)\.data", js):
    out.append(m.group(0) + "\n")

for m in re.finditer(r"await Rv\.([a-zA-Z]+)\([^)]*\)", js):
    # only unique near dashboard-ish
    pass

# Get method names used after dashboard components
methods = sorted(set(re.findall(r"Rv\.([a-zA-Z]+)", js)))
out.append("\nRv methods: " + ", ".join(methods))

# Keys-specific loading
for needle in [
    "getKeys",
    "keys/get",
    "multiactions",
    "getAllKeys",
    "handleGenerate",
    "getLogs",
    "getVersions",
    "getWithdraws",
    "getAllPromocodes",
    "autoload",
    "content:",
    ".data;",
]:
    idxs = [m.start() for m in re.finditer(re.escape(needle), js)]
    if not idxs:
        continue
    out.append(f"\n\n##### {needle} ({len(idxs)}) #####\n")
    for i in idxs[:6]:
        out.append(js[max(0, i - 180) : min(len(js), i + 350)])
        out.append("\n----\n")

Path(r"C:\Users\ttfar\dimasclient-fun\js_all_panels.txt").write_text("\n".join(out), encoding="utf-8")
print("written", len(out))
