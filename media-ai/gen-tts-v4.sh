#!/bin/bash
# 配音 v4：结构重排（旁白铺完→对话收尾，不穿插）+ 每角色独立语气参数 + 台词重写
# 语气设计：
#   旁白 NARR      Dylan 降3%+去尖（沉稳叙述）
#   内心独白 MONO  同旁白 但音量0.9（贴耳感）
#   老周 LAOZHOU   降12%+慢10%（沙哑苍老，最慢）
#   红裙 HONGQUN   升3%微甜+正常速（说谎的流利感）
#   灰羽 HUIYU     快4%（接头暗号短促）
# 段间停顿 0.7s（转身感），对话前后呼吸感
set -e
cd "$(dirname "$0")"
OUT="../fmv-shell/public/media/audio"
TMP=/tmp/tts-v4
mkdir -p "$OUT" "$TMP"
FF=$(python3 -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())")

V_NARR=Dylan; V_LAOZHOU=Dylan; V_HONGQUN=Serena; V_HUIYU=Ethan
DESHARP='equalizer=f=6500:t=q:w=1.2:g=-4,equalizer=f=220:t=q:w=1:g=1.5'
DESHARP_F='equalizer=f=6800:t=q:w=1.2:g=-3,equalizer=f=240:t=q:w=1:g=1'

post() { # $1=输入 $2=输出 $3=角色
  case "$3" in
    NARR)    "$FF" -y -loglevel error -i "$1" -af "asetrate=24000*0.97,aresample=44100,atempo=1.031,${DESHARP}" "$2";;
    MONO)    "$FF" -y -loglevel error -i "$1" -af "asetrate=24000*0.97,aresample=44100,atempo=1.031,${DESHARP},volume=0.9" "$2";;
    LAOZHOU) "$FF" -y -loglevel error -i "$1" -af "asetrate=24000*0.88,aresample=44100,atempo=0.90,${DESHARP}" "$2";;
    HONGQUN) "$FF" -y -loglevel error -i "$1" -af "asetrate=24000*1.03,aresample=44100,atempo=0.99,${DESHARP_F}" "$2";;
    HUIYU)   "$FF" -y -loglevel error -i "$1" -af "aresample=44100,atempo=1.04,${DESHARP}" "$2";;
  esac
}

N=0
say() { # $1=voice $2=text $3=角色
  N=$((N+1))
  local ok=0
  for t in 1 2 3 4 5; do
    if ~/.zcode/scripts/opc tts "$2" --voice "$1" -o "$TMP/raw-$N.mp3" >/dev/null 2>&1; then ok=1; sleep 3; break; fi
    sleep $((8 * t))
  done
  [ "$ok" = 1 ] || { echo "TTS失败: 段$N"; exit 1; }
  post "$TMP/raw-$N.mp3" "$TMP/seg-$N.wav" "$3"
}

join() { # $1=输出 其后=段（每段尾 pad 0.7s）
  local outp="$1"; shift
  local inputs=() j
  for f in "$@"; do inputs+=("-i" "$f"); done
  local n=$# chain=""
  for j in $(seq 0 $((n-1))); do chain+="[$j:a]apad=pad_dur=0.7[p$j];"; done
  for j in $(seq 0 $((n-1))); do chain+="[p$j]"; done
  chain+="concat=n=$n:v=0:a=1,aresample=44100[a]"
  "$FF" -y -loglevel error "${inputs[@]}" -filter_complex "$chain" -map "[a]" -c:a libmp3lame -q:a 4 "$outp"
}

echo "▸ n02_code"
say $V_NARR "「红星」对「旧梦」。侧门敲三下，停，再敲两下。若有人先说「好雨」，你就走。你把口令咽回喉咙，像咽下一枚冰凉的钉子。" NARR
join "$OUT/n02_code.mp3" "$TMP/seg-$N.wav"

echo "▸ n03_watch"
say $V_NARR "侧巷里，灰大衣已经站得太久。烟蒂在脚边排成一行。他不看你。可雨声里，你听见打火机第二次响。" NARR
join "$OUT/n03_watch.mp3" "$TMP/seg-$N.wav"

echo "▸ n04_side（旁白铺完→台词收尾）"
say $V_NARR "铁门里是黑的。老周的声音从暗处来，比记忆里更哑。他伸出手，掌心向上，像在等一场早该结束的雨。" NARR
say $V_LAOZHOU "你，迟到了。" LAOZHOU
join "$OUT/n04_side.mp3" "$TMP/seg-$((N-1)).wav" "$TMP/seg-$N.wav"

echo "▸ n05_lobby（旁白含线索→台词收尾）"
say $V_NARR "大堂只剩一只坏掉的灯。红裙女人靠在旧海报下。她的耳环是新的。鞋底，却没有雨。" NARR
say $V_HONGQUN "老周发烧，今晚我来接。" HONGQUN
join "$OUT/n05_lobby.mp3" "$TMP/seg-$((N-1)).wav" "$TMP/seg-$N.wav"

echo "▸ n05_probe（观察→台词→内心独白）"
say $V_NARR "她的笑僵了半秒。" NARR
say $V_HONGQUN "是啊，好雨呀。" HONGQUN
say $V_NARR "错了。你已经转身，红裙在灯里像一道伤口。" MONO
join "$OUT/n05_probe.mp3" "$TMP/seg-$((N-2)).wav" "$TMP/seg-$((N-1)).wav" "$TMP/seg-$N.wav"

echo "▸ n06_password（对话先行→旁白收）"
say $V_HUIYU "红星。" HUIYU
say $V_LAOZHOU "旧梦。" LAOZHOU
say $V_NARR "他点头，像把一块石头放回原处。你们交换一个极短的眼神，今晚不干净。" NARR
join "$OUT/n06_password.mp3" "$TMP/seg-$((N-2)).wav" "$TMP/seg-$((N-1)).wav" "$TMP/seg-$N.wav"

echo "▸ n01_narr"
say $V_NARR "一九九四年。雨把霓虹揉碎在积水里。你是灰羽，一条不该被写进档案的线。零点，废弃的红星影院。口袋里的缩微胶片，是整条线的命。" NARR
join "$OUT/n01_narr.mp3" "$TMP/seg-$N.wav"

echo "▸ n07_narr"
say $V_NARR "胶片离开口袋的瞬间，整栋楼像轻轻吸了一口气。远处，正门的铁链响了一下。你必须现在决定，什么才是真的。" NARR
join "$OUT/n07_narr.mp3" "$TMP/seg-$N.wav"

echo "▸ 结局×3"
say $V_NARR "线还在。灰羽这两个字被从名册上划掉，像从未下过这场雨。三天后有人在码头看见一个撑伞的背影，没有回头。你活着，以消失的方式。" NARR
join "$OUT/ending_ghost.mp3" "$TMP/seg-$N.wav"
say $V_NARR "红裙女人站在玻璃后面，点了一支烟。胶片被摊开在灯下，像一片湿透的肺。雨还在下，可已经与你无关。" NARR
join "$OUT/ending_caught.mp3" "$TMP/seg-$N.wav"
say $V_NARR "空胶片被他们当了真。对岸的电台乱了三天。老周寄来一张无字明信片，背面只有一个句号。你还活着，真货仍贴在鞋垫下。而他们开始怀疑每一场雨。" NARR
join "$OUT/ending_hook.mp3" "$TMP/seg-$N.wav"

rm -rf "$TMP"
echo "=== v4 完成（结构重排+语气分级） ==="
for f in "$OUT"/*.mp3; do
  D=$("$FF" -i "$f" 2>&1 | grep -o "Duration: [0-9:.]*" | cut -d' ' -f2)
  echo "$(basename "$f")  $D"
done
