#!/bin/bash
# OPC qwen3-tts-flash 多声线配音 v2：干净生成 + 后期控速（解决"念得太急"）
# 语速策略：全部段落后期放慢；老周额外降调变苍老；段间停顿 0.32s → 0.55s
# 用法: bash gen-tts-opc.sh
set -e
cd "$(dirname "$0")"
OUT="../fmv-shell/public/media/audio"
TMP=/tmp/tts-opc
mkdir -p "$OUT" "$TMP"
FF=$(python3 -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())")

# 音色分配（qwen3-tts-flash 实测可用：3女2男）
V_NARR=Ethan    # 旁白：沉稳男
V_LAOZHOU=Dylan # 老周：男声+降调处理 → 苍老
V_HONGQUN=Serena # 红裙女人：冷感女声
V_HUIYU=Dylan   # 灰羽：男声原速（与老周靠后处理区分）

say() { # $1=voice $2=文本 $3=编号（网关偶发报错，重试3次）
  local ok=0
  for t in 1 2 3; do
    if ~/.zcode/scripts/opc tts "$2" --voice "$1" -o "$TMP/raw-$3.mp3" >/dev/null 2>&1; then ok=1; break; fi
    echo "  重试 $t（voice=$1）"; sleep 4
  done
  [ "$ok" = 1 ] || { echo "TTS 失败: 段$N"; exit 1; }
}

post() { # $1=原始 $2=输出 $3=voice → 统一44.1k + 控速（尾留0.55s由join的pad补）
  case "$3" in
    Ethan)  T="atempo=0.78";;                                   # 旁白放慢14%
    LAOZHOU) T="asetrate=24000*0.90,aresample=24000,atempo=0.80";; # 老周：降调10%+再慢20% → 苍老
    Serena) T="atempo=0.84";;                                   # 红裙稍慢
    Dylan)  T="atempo=0.86";;                                   # 灰羽轻微放慢
    *) T="atempo=0.88";;
  esac
  "$FF" -y -loglevel error -i "$1" -af "$T,aresample=44100" "$2"
}

N=0
seg() { # $1=voice $2=文本 → $TMP/seg-N.wav（已控速）
  N=$((N+1))
  say "$1" "$2" $N
  post "$TMP/raw-$N.mp3" "$TMP/seg-$N.wav" "$1"
}

join() { # $1=输出 其后=段列表（段尾 pad 0.55s 停顿）
  local outp="$1"; shift
  local inputs=() j
  for f in "$@"; do inputs+=("-i" "$f"); done
  local n=$# chain=""
  for j in $(seq 0 $((n-1))); do chain+="[$j:a]apad=pad_dur=0.6[p$j];"; done
  for j in $(seq 0 $((n-1))); do chain+="[p$j]"; done
  chain+="concat=n=$n:v=0:a=1,aresample=44100[a]"
  "$FF" -y -loglevel error "${inputs[@]}" -filter_complex "$chain" -map "[a]" -c:a libmp3lame -q:a 4 "$outp"
}

echo "▸ n02_code"
seg $V_NARR "「红星」对「旧梦」。侧门敲三下，停，再敲两下。若有人先说「好雨」，你就走。你把口令咽回喉咙，像咽下一枚冰凉的钉子。"
join "$OUT/n02_code.mp3" "$TMP/seg-$N.wav"

echo "▸ n03_watch"
seg $V_NARR "侧巷里，灰大衣已经站得太久。烟蒂在脚边排成一行。他不看你。可雨声里，你听见打火机第二次响。"
join "$OUT/n03_watch.mp3" "$TMP/seg-$N.wav"

echo "▸ n04_side"
seg $V_NARR "铁门里是黑的。老周的声音从暗处来，比记忆里更哑。"
seg $V_LAOZHOU "你迟到了。"
seg $V_NARR "他伸出手，掌心向上，像在等一场早该结束的雨。"
join "$OUT/n04_side.mp3" "$TMP/seg-$((N-2)).wav" "$TMP/seg-$((N-1)).wav" "$TMP/seg-$N.wav"

echo "▸ n05_lobby"
seg $V_NARR "大堂只剩一只坏掉的灯。红裙女人靠在旧海报下，笑着说。"
seg $V_HONGQUN "老周发烧，今晚我来接。"
seg $V_NARR "她的耳环是新的。鞋底却没有雨。"
join "$OUT/n05_lobby.mp3" "$TMP/seg-$((N-2)).wav" "$TMP/seg-$((N-1)).wav" "$TMP/seg-$N.wav"

echo "▸ n05_probe"
seg $V_NARR "她的笑僵了半秒。她说。"
seg $V_HONGQUN "是啊，好雨。"
seg $V_NARR "错了。正确的回应是离开。你已经转身，红裙在灯里像一道伤口。"
join "$OUT/n05_probe.mp3" "$TMP/seg-$((N-2)).wav" "$TMP/seg-$((N-1)).wav" "$TMP/seg-$N.wav"

echo "▸ n06_password"
seg $V_HUIYU "红星。"
seg $V_LAOZHOU "旧梦。"
seg $V_NARR "他点头，像把一块石头放回原处。你们交换一个极短的眼神：今晚不干净。"
join "$OUT/n06_password.mp3" "$TMP/seg-$((N-2)).wav" "$TMP/seg-$((N-1)).wav" "$TMP/seg-$N.wav"

echo "▸ n01_narr"
seg $V_NARR "一九九四年。雨把霓虹揉碎在积水里。你是灰羽，一条不该被写进档案的线。零点，废弃的红星影院。口袋里的缩微胶片，是整条线的命。"
join "$OUT/n01_narr.mp3" "$TMP/seg-$N.wav"

echo "▸ n07_narr"
seg $V_NARR "胶片离开口袋的瞬间，整栋楼像轻轻吸了一口气。远处，正门的铁链响了一下。你必须现在决定，什么才是真的。"
join "$OUT/n07_narr.mp3" "$TMP/seg-$N.wav"

echo "▸ 结局×3"
seg $V_NARR "线还在。灰羽这两个字被从名册上划掉，像从未下过这场雨。三天后有人在码头看见一个撑伞的背影，没有回头。你活着，以消失的方式。"
join "$OUT/ending_ghost.mp3" "$TMP/seg-$N.wav"
seg $V_NARR "红裙女人站在玻璃后面，点了一支烟。胶片被摊开在灯下，像一片湿透的肺。雨还在下，可已经与你无关。"
join "$OUT/ending_caught.mp3" "$TMP/seg-$N.wav"
seg $V_NARR "空胶片被他们当了真。对岸的电台乱了三天。老周寄来一张无字明信片，背面只有一个句号。你还活着，真货仍贴在鞋垫下。而他们开始怀疑每一场雨。"
join "$OUT/ending_hook.mp3" "$TMP/seg-$N.wav"

rm -rf "$TMP"
echo "=== OPC qwen3-tts 配音完成 ==="
for f in "$OUT"/*.mp3; do
  D=$("$FF" -i "$f" 2>&1 | grep -o "Duration: [0-9:.]*" | cut -d' ' -f2)
  echo "$(basename "$f")  $D"
done
