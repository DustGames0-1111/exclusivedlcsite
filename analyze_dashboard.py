import re
from pathlib import Path

js = Path(r"C:\Users\ttfar\dimasclient-fun\site\assets\index-CDfA73H_.js").read_text(encoding="utf-8", errors="ignore")
out = []

# Find dashboard users panel component and nearby API usage
for needle in [
    "dashboard/users/panel",
    "isSessionInitialized",
    "initializeSession",
    "2FA_",
    "getAll",
    "admin/users",
    "admin/states",
    "admin/finances",
    "Rendering 9 out",
    "Data not found",
    "dashboardUsers",
]:
    idxs = [m.start() for m in re.finditer(re.escape(needle), js)]
    out.append(f"\n===== {needle} ({len(idxs)}) =====\n")
    for i in idxs[:4]:
        out.append(js[max(0, i - 250) : min(len(js), i + 550)])
        out.append("\n----\n")

Path(r"C:\Users\ttfar\dimasclient-fun\js_dashboard.txt").write_text("\n".join(out), encoding="utf-8")
print("ok", len(out))
