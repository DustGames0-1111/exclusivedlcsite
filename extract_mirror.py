import json
import base64
from pathlib import Path
from urllib.parse import urlparse

src = Path(r"C:\Users\ttfar\.cursor\browser-logs\cdp-response-Runtime.evaluate-2026-07-23T21-45-53-329Z.json")
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

print("type:", type(result).__name__, "count:", len(result) if isinstance(result, dict) else None)

saved = []
for url, info in result.items():
    if not isinstance(info, dict) or not info.get("ok"):
        print("SKIP", url, info)
        continue

    path = urlparse(url).path
    if path in ("", "/"):
        rel = "index.html"
    elif path in ("/privacypolicy", "/termsofservice"):
        rel = path.strip("/") + "/index.html"
    elif path.startswith("/ajax/"):
        rel = path.lstrip("/")
        if not Path(rel).suffix:
            rel = rel + ".json"
    else:
        rel = path.lstrip("/")

    out = root / rel
    out.parent.mkdir(parents=True, exist_ok=True)
    raw = base64.b64decode(info["b64"])
    out.write_bytes(raw)
    saved.append(rel)
    print(f"OK {rel} ({len(raw)} bytes, {info.get('ctype')})")

print("TOTAL", len(saved))
log = root.parent / "extract_log.txt"
log.write_text("\n".join(saved) + f"\nTOTAL {len(saved)}\n", encoding="utf-8")
