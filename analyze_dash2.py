import re
from pathlib import Path

js = Path(r"C:\Users\ttfar\dimasclient-fun\site\assets\index-CDfA73H_.js").read_text(encoding="utf-8", errors="ignore")

# users panel data load
idx = js.find("await Rv.getAll(r-1)).data")
print("getAll idx", idx)
print(js[idx-400:idx+500] if idx>=0 else "missing")

idx2 = js.find("dashboardUsers")
# find the component that uses getAll near users panel
needle = "e?await Rv.userSearch(e,r-1):await Rv.getAll(r-1)"
idx3 = js.find(needle)
print("\n\nLOAD", idx3)
print(js[idx3-600:idx3+800] if idx3>=0 else "missing")

# CSS for dashboard - black background?
css = Path(r"C:\Users\ttfar\dimasclient-fun\site\assets\index-CaZIvcnB.css").read_text(encoding="utf-8", errors="ignore")
for n in ["_dashboard_6ycf9_1", "dashboardContent", "--bg", "background:#000", "background:#0"]:
    i = css.find(n)
    print(f"\nCSS {n} @ {i}")
    if i>=0:
        print(css[i:i+200])
