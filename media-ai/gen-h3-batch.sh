#!/bin/bash
# OPC MiniMax-H3 批量图生视频：静帧 → 6s 动态（首帧贴合原画面）
# 用法: bash gen-h3-batch.sh   （已存在的输出自动跳过，可断点续跑）
set -e
cd "$(dirname "$0")"
MEDIA=../fmv-shell/public/media
FF=$(python3 -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())")

h3() { # $1=静帧文件 $2=提示词 $3=输出名
  local src="$MEDIA/$1" out="$3"
  if [ -f "$out" ]; then echo "跳过已有: $out"; return; fi
  echo "▸ H3: $1"
  "$FF" -y -loglevel error -i "$src" -q:v 3 /tmp/h3-key.jpg
  python3 -c "
import base64
b64 = base64.b64encode(open('/tmp/h3-key.jpg','rb').read()).decode()
open('/tmp/h3-dataurl.txt','w').write('data:image/jpeg;base64,'+b64)"
  ~/.zcode/scripts/opc video lf/minimax-h3 "$2" --image "$(cat /tmp/h3-dataurl.txt)" --seconds 6 -o "$out" --wait >/dev/null 2>&1 || { echo "  失败重试一次"; sleep 5; ~/.zcode/scripts/opc video lf/minimax-h3 "$2" --image "$(cat /tmp/h3-dataurl.txt)" --seconds 6 -o "$out" --wait >/dev/null; }
  echo "  完成: $out ($(stat -f%z "$out") bytes)"
}

h3 n02_code.jpg   "雨夜窄巷，穿风衣的年轻男人靠在砖墙上低头默念，嘴唇微动，雨丝缓缓飘落打湿墙面泛起反光，镜头极缓慢推近，1994年谍战电影感" h3-n02.mp4
h3 n03_watch.jpg  "昏暗侧巷远处灰衣男人剪影站着吸烟，烟头火光一明一灭，烟雾缓缓上升缭绕，前景墙角静止不动，窥视感镜头几乎不动，雨夜压抑电影感" h3-n03.mp4
h3 n05_lobby.jpg  "穿红色连衣裙的短发女人斜倚旧海报墙下，缓缓歪头露出似笑非笑的表情，耳环闪光，头顶吊灯光晕轻轻摇晃，昏暗大堂电影感" h3-n05.mp4
h3 n05_probe.jpg  "红裙女人的面部特写，礼貌微笑缓缓僵住，眼神闪过一丝慌乱躲闪，背景暖黄光斑轻微虚化颤动，情绪微妙变化的电影特写" h3-n05p.mp4
h3 n06_password.jpg "昏黄走廊两个男人面对面站立交换眼神，年长男人缓缓点头，顶灯轻微闪烁，走廊纵深，克制紧张的电影感双人镜头" h3-n06.mp4

echo "=== H3 批量完成 ==="
ls -la h3-*.mp4 2>/dev/null
