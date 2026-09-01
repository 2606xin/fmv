#!/usr/bin/env python3
"""批量视觉验证：逐图问 qwen3-vl，输出通过/问题清单。"""
import base64
import json
import subprocess
import sys
import urllib.request

CHECKS = {
    "title.jpg": "雨夜街道、远处影院霓虹、撑伞行人背影，三样都有吗？",
    "n02_code.jpg": "雨夜窄巷里一个穿风衣的男人靠墙低头（像在默念）？",
    "n03_watch.jpg": "昏暗侧巷远处有个人影在吸烟（剪影感、被窥视感）？",
    "n04_side.jpg": "黑暗中一只手伸出来（掌心向上），只露出手和部分脸？",
    "n05_lobby.jpg": "昏暗大堂里一个穿红裙的女人倚墙而立？",
    "n05_probe.jpg": "红裙女人面部特写，笑容僵硬不自然？",
    "n06_password.jpg": "两个男人面对面近距离站着（双人近景）？",
    "ending_ghost.jpg": "清晨码头，一个撑伞背影远远走远，画面留白多、天色发白？",
    "ending_caught.jpg": "桌面台灯下的胶片卷，旁边有人夹着烟？",
    "ending_hook.jpg": "一张空白明信片背面只有一个手写句号？",
    "n01_key.png": "低机位雨夜街道，大面积积水倒映霓虹？",
    "n07_key.png": "两只手正在交接一小卷胶片，楼梯间环境？",
}

def ask(img, q):
    b64 = base64.b64encode(open(img, "rb").read()).decode()
    req = urllib.request.Request(
        "http://127.0.0.1:11434/api/chat",
        data=json.dumps(
            {
                "model": "qwen3-vl:8b",
                "messages": [
                    {
                        "role": "user",
                        "content": f"审片。{q} 另外画面里有没有：水印/AI生成标识/乱码文字招牌/现代物品(手机、LED屏、现代汽车)？三行以内回答：第一行答要素问题(都有/缺什么)，第二行答穿帮检查(无/有什么在哪)，第三行给结论(合格/不合格)。",
                        "images": [b64],
                    }
                ],
                "stream": False,
            }
        ).encode(),
        headers={"Content-Type": "application/json"},
    )
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=280) as r:
                resp = json.load(r)
            msg = resp.get("message", {}).get("content", "")
            if "</think>" in msg:
                msg = msg.split("</think>", 1)[1]
            return msg.strip()
        except Exception as e:
            if attempt == 2:
                return f"[验证失败: {e}]"

only = sys.argv[1:] or list(CHECKS)
for name in only:
    if name not in CHECKS:
        print(f"{name}: 无检查项，跳过")
        continue
    print(f"━━ {name}")
    print(ask(name, CHECKS[name]))
    print()
