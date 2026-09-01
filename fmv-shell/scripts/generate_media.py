#!/usr/bin/env python3
"""Generate original cinematic placeholder stills and short clips with ffmpeg."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "media"
FONT = "/usr/share/fonts/opentype/noto/NotoSerifCJK-Regular.ttc"
FONT_SANS = "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"


def run(cmd: list[str]) -> None:
    print("+", cmd[0], cmd[-1])
    subprocess.run(cmd, check=True)


def still(name: str, color: str, label: str) -> None:
    vf = (
        f"vignette=PI/4,"
        f"noise=alls=8:allf=t,"
        f"drawtext=fontfile={FONT}:text='{label}':fontsize=28:fontcolor=0xd4c4a0@0.55:"
        f"x=80:y=h-120"
    )
    run(
        [
            "ffmpeg",
            "-y",
            "-f",
            "lavfi",
            "-i",
            f"color=c={color}:s=1920x1080:d=1",
            "-frames:v",
            "1",
            "-vf",
            vf,
            "-q:v",
            "3",
            str(OUT / name),
        ]
    )


def clip(name: str, color: str, title: str, sub: str, seconds: float = 5.0) -> None:
    vf = (
        f"noise=alls=12:allf=t+u,"
        f"vignette=PI/3.2,"
        f"drawtext=fontfile={FONT}:text='{title}':fontsize=72:fontcolor=0xe8dcc8:"
        f"x=(w-text_w)/2:y=(h-text_h)/2-36,"
        f"drawtext=fontfile={FONT_SANS}:text='{sub}':fontsize=26:fontcolor=0xc4a35a@0.85:"
        f"x=(w-text_w)/2:y=(h-text_h)/2+56"
    )
    run(
        [
            "ffmpeg",
            "-y",
            "-f",
            "lavfi",
            "-i",
            f"color=c={color}:s=1920x1080:d={seconds}:r=24",
            "-t",
            str(seconds),
            "-vf",
            vf,
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-crf",
            "26",
            "-an",
            str(OUT / name),
        ]
    )


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    still("title.jpg", "0x0b1624", "红星影院 · 零点")
    still("n02_code.jpg", "0x1a140c", "巷口 · 暗号")
    still("n03_watch.jpg", "0x0e1612", "侧巷 · 烟蒂")
    still("n04_side.jpg", "0x16100c", "侧门 · 铁")
    still("n05_lobby.jpg", "0x2a0c14", "大堂 · 红裙")
    still("n05_probe.jpg", "0x3a1018", "大堂 · 试探")
    still("n06_password.jpg", "0x161208", "放映间 · 口令")
    still("ending_ghost.jpg", "0x101820", "结局 · 影子")
    still("ending_caught.jpg", "0x2a0a12", "结局 · 落网")
    still("ending_hook.jpg", "0x1c1608", "结局 · 倒钩")
    clip("n01_rain.mp4", "0x0a121c", "零点接头", "灰羽行动", 5.5)
    clip("n07_hand.mp4", "0x140e10", "胶片", "现在决定", 5.0)
    print("media written to", OUT)
    return 0


if __name__ == "__main__":
    sys.exit(main())
