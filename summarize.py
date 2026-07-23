from pathlib import Path

root = Path(r"C:\Users\ttfar\dimasclient-fun\site")
files = sorted(p for p in root.rglob("*") if p.is_file())
total = sum(p.stat().st_size for p in files)
lines = [f"{p.relative_to(root)} ({p.stat().st_size})" for p in files]
lines.append(f"TOTAL files={len(files)} bytes={total} mb={total/1024/1024:.2f}")
out = Path(r"C:\Users\ttfar\dimasclient-fun\mirror_summary.txt")
out.write_text("\n".join(lines), encoding="utf-8")
print(out.read_text(encoding="utf-8"))
