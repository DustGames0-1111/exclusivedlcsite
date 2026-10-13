"""
Exclusive DLC - Remote Payload Uploader CLI.
Uploads an encrypted bytecode bundle or client JAR to Cloudflare / Local server.
"""
from __future__ import annotations

import argparse
import base64
import json
import os
import sys
import urllib.parse
import urllib.request


def upload_payload(server_url: str, token: str, version: str, entry_class: str, payload_base64: str):
    endpoint = server_url.rstrip("/") + "/ajax/admin/loader/uploadPayload"
    data = json.dumps({
        "token": token,
        "version": version,
        "entry_class": entry_class,
        "payload": payload_base64,
    }).encode("utf-8")

    req = urllib.request.Request(endpoint, data=data, headers={
        "Content-Type": "application/json; charset=utf-8",
        "User-Agent": "Exclusive-Uploader/1.0"
    })

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode("utf-8")
            print(f"[+] Server response ({resp.status}): {body}")
            return True
    except urllib.error.HTTPError as e:
        print(f"[-] Server returned error HTTP {e.code}: {e.read().decode('utf-8')}")
        return False
    except Exception as e:
        print(f"[-] Failed to connect: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description="Upload encrypted client payload to Cloudflare Worker.")
    parser.add_argument("--server", "-s", default="https://exclusivedlc.fun", help="Target server URL (default: https://exclusivedlc.fun)")
    parser.add_argument("--token", "-t", required=True, help="Admin session token")
    parser.add_argument("--version", "-v", default="1.21.11", help="Target version (default: 1.21.11)")
    parser.add_argument("--entry", "-e", default="ru.exclusive.client.Main", help="Entry class name")
    parser.add_argument("--payload", "-p", required=True, help="Path to .bin payload or .base64.txt file")

    args = parser.parse_args()

    if not os.path.exists(args.payload):
        print(f"[-] File not found: {args.payload}")
        sys.exit(1)

    if args.payload.endswith(".base64.txt") or args.payload.endswith(".txt"):
        with open(args.payload, "r", encoding="utf-8") as f:
            b64_content = f.read().strip()
    else:
        with open(args.payload, "rb") as f:
            b64_content = base64.b64encode(f.read()).decode("utf-8")

    print(f"[*] Uploading payload ({len(b64_content)} base64 chars) for version '{args.version}' to {args.server}...")
    success = upload_payload(args.server, args.token, args.version, args.entry, b64_content)
    if success:
        print("[+] Payload successfully deployed to Cloudflare!")
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
