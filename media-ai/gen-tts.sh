#!/bin/bash
# 多声线配音：旁白/老周/红裙/灰羽 分段合成 → 拼接为整条节点音频
# 配音先行流程：本脚本产出的时长 = 该节点视频/静帧的目标时长基准
set -e
cd "$(dirname "$0")"
OUT="../fmv-shell/public/media/audio"
TMP=/tmp/tts-segs
mkdir -p "$OUT" "$TMP"
FF=$(python3 -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())")

# 声线表
NARR="zh-CN-YunjianNeural|--rate=-12%|--pitch=-4Hz"      # 旁白：沉稳男
LAOZHOU="zh-CN-YunyangNeural|--rate=-22%|--pitch=-14Hz"  # 老周：苍老男
HONGQUN="zh-CN-XiaoxiaoNeural|--rate=-8%|--pitch=+3Hz"    # 红裙女人：女
HUIYU="zh-CN-YunxiNeural|--rate=-10%|--pitch=-2Hz"       # 灰羽：年轻男

seg() { # $1=voice定义 $2=文本 $3=序号 → 输出 $TMP/seg-$3.mp3
  IFS='|' read -r V R P <<< "$1"
  python3 -m edge_tts --voice "$V" $R $P --text "$2" --write-media "$TMP/seg-$3.mp3" 2>/dev/null
}

join() { # $1=输出文件 其后=段文件列表（每段尾补0.32s停顿后拼接）
  local outp="$1"; shift
  local inputs=() idx=0
  for f in "$@"; do
    inputs+=("-i" "$f")
    idx=$((idx+1))
  done
  local n=$# chain="" j
  for j in $(seq 0 $((n-1))); do chain+="[$j:a]apad=pad_dur=0.32[p$j];"; done
  for j in $(seq 0 $((n-1))); do chain+="[p$j]"; done
  chain+="concat=n=$n:v=0:a=1[a]"
  "$FF" -y -loglevel error "${inputs[@]}" -filter_complex "$chain" -map "[a]" -c:a libmp3lame -q:a 4 "$outp"
}

i=0
# ── 纯旁白节点 ──
echo "▸ n02_code"; seg "$NARR" "「红星」对「旧梦」。侧门敲三下，停，再敲两下。若有人先说「好雨」，你就走。你把口令咽回喉咙，像咽下一枚冰凉的钉子。" $((i=i+1)); join "$OUT/n02_code.mp3" "$TMP/seg-$i.mp3"
echo "▸ n03_watch"; seg "$NARR" "侧巷里，灰大衣已经站得太久。烟蒂在脚边排成一行。他不看你。可雨声里，你听见打火机第二次响。" $((i=i+1)); join "$OUT/n03_watch.mp3" "$TMP/seg-$i.mp3"

# ── n04：老周台词 ──
echo "▸ n04_side"
seg "$NARR" "铁门里是黑的。老周的声音从暗处来，比记忆里更哑：" $((i=i+1))
seg "$LAOZHOU" "你迟到了。" $((i=i+1))
seg "$NARR" "他伸出手，掌心向上，像在等一场早该结束的雨。" $((i=i+1))
join "$OUT/n04_side.mp3" "$TMP/seg-$((i-2)).mp3" "$TMP/seg-$((i-1)).mp3" "$TMP/seg-$i.mp3"

# ── n05_lobby：红裙台词 ──
echo "▸ n05_lobby"
seg "$NARR" "大堂只剩一只坏掉的灯。红裙女人靠在旧海报下，笑着说：" $((i=i+1))
seg "$HONGQUN" "老周发烧，今晚我来接。" $((i=i+1))
seg "$NARR" "她的耳环是新的。鞋底却没有雨。" $((i=i+1))
join "$OUT/n05_lobby.mp3" "$TMP/seg-$((i-2)).mp3" "$TMP/seg-$((i-1)).mp3" "$TMP/seg-$i.mp3"

# ── n05_probe：红裙台词 ──
echo "▸ n05_probe"
seg "$NARR" "她的笑僵了半秒。她说：" $((i=i+1))
seg "$HONGQUN" "是啊，好雨。" $((i=i+1))
seg "$NARR" "错了。正确的回应是离开。你已经转身，红裙在灯里像一道伤口。" $((i=i+1))
join "$OUT/n05_probe.mp3" "$TMP/seg-$((i-2)).mp3" "$TMP/seg-$((i-1)).mp3" "$TMP/seg-$i.mp3"

# ── n06：灰羽+老周对口令 ──
echo "▸ n06_password"
seg "$HUIYU" "红星。" $((i=i+1))
seg "$LAOZHOU" "旧梦。" $((i=i+1))
seg "$NARR" "他点头，像把一块石头放回原处。你们交换一个极短的眼神：今晚不干净。" $((i=i+1))
join "$OUT/n06_password.mp3" "$TMP/seg-$((i-2)).mp3" "$TMP/seg-$((i-1)).mp3" "$TMP/seg-$i.mp3"

# ── 视频旁白 ──
echo "▸ n01_narr"; seg "$NARR" "一九九四年。雨把霓虹揉碎在积水里。你是灰羽，一条不该被写进档案的线。零点，废弃的红星影院。口袋里的缩微胶片，是整条线的命。" $((i=i+1)); join "$OUT/n01_narr.mp3" "$TMP/seg-$i.mp3"
echo "▸ n07_narr"; seg "$NARR" "胶片离开口袋的瞬间，整栋楼像轻轻吸了一口气。远处，正门的铁链响了一下。你必须现在决定，什么才是真的。" $((i=i+1)); join "$OUT/n07_narr.mp3" "$TMP/seg-$i.mp3"

# ── 结局（纯旁白） ──
echo "▸ ending_ghost"; seg "$NARR" "线还在。灰羽这两个字被从名册上划掉，像从未下过这场雨。三天后有人在码头看见一个撑伞的背影，没有回头。你活着，以消失的方式。" $((i=i+1)); join "$OUT/ending_ghost.mp3" "$TMP/seg-$i.mp3"
echo "▸ ending_caught"; seg "$NARR" "红裙女人站在玻璃后面，点了一支烟。胶片被摊开在灯下，像一片湿透的肺。雨还在下，可已经与你无关。" $((i=i+1)); join "$OUT/ending_caught.mp3" "$TMP/seg-$i.mp3"
echo "▸ ending_hook"; seg "$NARR" "空胶片被他们当了真。对岸的电台乱了三天。老周寄来一张无字明信片，背面只有一个句号。你还活着，真货仍贴在鞋垫下。而他们开始怀疑每一场雨。" $((i=i+1)); join "$OUT/ending_hook.mp3" "$TMP/seg-$i.mp3"

rm -rf "$TMP"
echo "=== 完成（多声线） ==="
for f in "$OUT"/*.mp3; do
  D=$("$FF" -i "$f" 2>&1 | grep -o "Duration: [0-9:.]*" | cut -d' ' -f2)
  echo "$(basename "$f")  $D"
done
