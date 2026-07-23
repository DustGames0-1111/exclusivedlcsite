import re
from pathlib import Path

js = Path(r"C:\Users\ttfar\dimasclient-fun\site\assets\index-CDfA73H_.js").read_text(encoding="utf-8", errors="ignore")
out = []

for needle in [
    "mediapanel",
    "Media Panel",
    "/mediapanel",
    "mediaPanel",
    "YOUTUBER",
    "YOUTUBE",
    "ar.YOUTUBER",
    "ar.ADMIN",
]:
    idxs = [m.start() for m in re.finditer(re.escape(needle), js)]
    out.append(f"\n===== {needle} ({len(idxs)}) =====\n")
    for i in idxs[:5]:
        out.append(js[max(0, i - 200) : min(len(js), i + 500)])
        out.append("\n----\n")

# find media panel component near route
i = js.find("path:`/mediapanel`")
out.append(f"\nROUTE @ {i}\n")
out.append(js[i - 100 : i + 200] if i >= 0 else "missing")

# find component that might be media
for m in re.finditer(r"mediapanel|Media Panel|media panel", js, re.I):
    pass

Path(r"C:\Users\ttfar\dimasclient-fun\js_media.txt").write_text("\n".join(out), encoding="utf-8")
print("ok")
