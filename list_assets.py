from pathlib import Path
import re

css = Path(r"C:\Users\ttfar\dimasclient-fun\site\assets\index-CaZIvcnB.css").read_text(encoding="utf-8", errors="ignore")
js = Path(r"C:\Users\ttfar\dimasclient-fun\site\assets\index-CDfA73H_.js").read_text(encoding="utf-8", errors="ignore")
urls = sorted(set(re.findall(r"/assets/[A-Za-z0-9._-]+", css + js)))
Path(r"C:\Users\ttfar\dimasclient-fun\asset_refs.txt").write_text("\n".join(urls), encoding="utf-8")
print(len(urls))
for u in urls:
    print(u)
