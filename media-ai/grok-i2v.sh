#!/bin/bash
# Grok 图生视频全流程：关键帧 → i2v 任务 → 轮询 → 下载(重试) → 后期1080p+音轨
# 用法: bash grok-i2v.sh <关键帧png> <提示词> <秒数> <rain|tension> <输出.mp4>
set -e
cd "$(dirname "$0")"
KEYFRAME="$1"; PROMPT="$2"; DUR="$3"; MOOD="$4"; OUT="$5"
FF=$(python3 -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())")
KEY=$(python3 -c "import json; c=json.load(open('/Users/a0000/.zcode/v2/config.json')); print([p['options']['apiKey'] for p in c['provider'].values() if p.get('name')=='sub-grok'][0])")
BASE="http://192.168.6.149:18082"

# png → jpeg data url
"$FF" -y -loglevel error -i "$KEYFRAME" -q:v 3 /tmp/i2v-key.jpg

# 提交（image.url 结构体是网关的正确方言）
JOB=$(python3 - <<PYEOF
import base64, json, urllib.request
b64 = base64.b64encode(open("/tmp/i2v-key.jpg","rb").read()).decode()
body = json.dumps({
    "model": "grok-imagine-video-1.5",
    "prompt": """$PROMPT""",
    "image": {"url": f"data:image/jpeg;base64,{b64}"},
    "duration": int("$DUR"),
    "resolution": "480p",
}).encode()
req = urllib.request.Request("$BASE/v1/videos/generations", data=body,
    headers={"Authorization": "Bearer $KEY", "Content-Type": "application/json"})
with urllib.request.urlopen(req, timeout=90) as r:
    print(json.load(r)["request_id"])
PYEOF
)
echo "任务: $JOB"

# 轮询
for i in $(seq 1 60); do
  S=$(curl -s -m 20 "$BASE/v1/videos/$JOB" -H "Authorization: Bearer $KEY")
  ST=$(echo "$S" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('status'), d.get('progress',''))" 2>/dev/null || echo "parse-error")
  echo "[$i] $ST"
  case "$ST" in done*) break;; failed*|expired*) echo "$S"; exit 1;; esac
  sleep 10
done

# 下载（带重试，content 口偶发 503）
RAW="raw-$(basename "$OUT" .mp4)-$JOB.mp4"
for i in 1 2 3 4 5 6; do
  curl -s -m 300 "$BASE/v1/videos/$JOB/content" -H "Authorization: Bearer $KEY" -o "$RAW"
  T=$(file -b "$RAW" | cut -c1-10)
  case "$T" in *ISO*|*MP4*) echo "下载OK: $RAW"; break;; esac
  echo "下载重试 $i: $T"; sleep 8
done
file -b "$RAW" | grep -q "ISO Media" || { echo "下载失败"; exit 1; }

# 后期
bash grok-post.sh "$RAW" "$OUT" "$DUR" "$MOOD"
