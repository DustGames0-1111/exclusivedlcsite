import re
from pathlib import Path

js = Path(r"C:\Users\ttfar\dimasclient-fun\site\assets\index-CDfA73H_.js").read_text(encoding="utf-8", errors="ignore")

snippets = []

# Keys panel component cb= 
for needle in ["cb=()=>{","getAllKeys","getAllPromocodes","getAllByCategory","getVersions","getWithdraws","getBalance","lb=()=>{","v0=()=>{","g0=()=>{","_0=()=>{","sb=()=>{"]:
    i = js.find(needle)
    snippets.append(f"\n==== {needle} @ {i} ====\n")
    if i >= 0:
        snippets.append(js[i : i + 2200])

# field usage e.key e.display e.name e.discount e.timeStamp
for needle in ["e.key", "e.display", "e.discount", "e.name", "e.timeStamp", "e.timestamp", "e.version", "e.orderId", "e.status", "e.amount"]:
    pass

# Extract object field access after map on keys/promos/logs
for m in re.finditer(r"p\.map\(\(e,t\)=>\(0,I\.jsx\)\(`div`,\{className:J\.data,children:([^}]+)", js):
    snippets.append("pmap: " + m.group(1)[:120] + "\n")

Path(r"C:\Users\ttfar\dimasclient-fun\js_panel_components.txt").write_text("\n".join(snippets), encoding="utf-8")
print("ok")
