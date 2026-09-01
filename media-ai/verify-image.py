#!/usr/bin/env python3
"""用本地 Ollama qwen3-vl 验证图片：python3 verify-image.py <图片> <审片问题>"""
import base64
import json
import sys
import urllib.request

img, ask = sys.argv[1], sys.argv[2]
with open(img, "rb") as f:
    b64 = base64.b64encode(f.read()).decode()

req = urllib.request.Request(
    "http://127.0.0.1:11434/api/chat",
    data=json.dumps(
        {
            "model": "qwen3-vl:8b",
            "messages": [{"role": "user", "content": ask, "images": [b64]}],
            "stream": False,
        }
    ).encode(),
    headers={"Content-Type": "application/json"},
)
with urllib.request.urlopen(req, timeout=280) as r:
    resp = json.load(r)
msg = resp.get("message", {}).get("content", "")
if "</think>" in msg:
    msg = msg.split("</think>", 1)[1]
print(msg.strip())
