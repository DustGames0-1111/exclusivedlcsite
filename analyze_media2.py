from pathlib import Path

js = Path(r"C:\Users\ttfar\dimasclient-fun\site\assets\index-CDfA73H_.js").read_text(encoding="utf-8")
out = []

i = js.find("f0=new class")
out.append(f"f0 class @ {i}\n")
out.append(js[i : i + 1500] if i >= 0 else "missing")

i = js.find("E0=()=>{")
out.append(f"\n\nE0 @ {i}\n")
out.append(js[i : i + 3500] if i >= 0 else "missing")

# also search media API paths
import re
for m in re.finditer(r"media[^`'\"]{0,40}|youtuber|promo.?code|getInformation", js, re.I):
    if "ajax" in js[max(0, m.start() - 80) : m.end() + 80] or "getInformation" in m.group(0):
        out.append("\n-- " + js[max(0, m.start() - 100) : m.end() + 200] + "\n")

Path(r"C:\Users\ttfar\dimasclient-fun\js_media2.txt").write_text("\n".join(out), encoding="utf-8")
print("ok")
