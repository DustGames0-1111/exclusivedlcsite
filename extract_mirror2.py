import json
import base64
from pathlib import Path
from urllib.parse import urlparse

src = Path(r"C:\Users\ttfar\.cursor\browser-logs\cdp-response-Runtime.evaluate-2026-07-23T21-46-51-376Z.json")
root = Path(r"C:\Users\ttfar\dimasclient-fun\site")
root.mkdir(parents=True, exist_ok=True)

data = json.loads(src.read_text(encoding="utf-8"))
result = data
if isinstance(data, dict) and "result" in data:
    result = data["result"]
    if isinstance(result, dict) and "result" in result:
        result = result["result"]
    if isinstance(result, dict) and "value" in result:
        result = result["value"]

saved = []
for url, info in result.items():
    if not isinstance(info, dict) or not info.get("ok"):
        print("SKIP", url, info)
        continue
    path = urlparse(url).path if url.startswith("http") else url
    rel = path.lstrip("/")
    out = root / rel
    out.parent.mkdir(parents=True, exist_ok=True)
    raw = base64.b64decode(info["b64"])
    # skip HTML mistaken for assets
    if info.get("ctype", "").startswith("text/html") and not rel.endswith(".html"):
        print("SKIP HTML", rel)
        continue
    out.write_bytes(raw)
    saved.append(f"{rel} ({len(raw)})")
    print(f"OK {rel} ({len(raw)} bytes)")

# favicon.svg is missing on server (returns SPA html) — reuse icon.svg
icon = root / "icon.svg"
favicon = root / "favicon.svg"
if icon.exists():
    favicon.write_bytes(icon.read_bytes())
    print("OK favicon.svg (copied from icon.svg)")

print("TOTAL", len(saved))
Path(r"C:\Users\ttfar\dimasclient-fun\extract_log2.txt").write_text("\n".join(saved) + "\n", encoding="utf-8")
