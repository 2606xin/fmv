#!/bin/bash
# 生成全部旁白配音：9 个剧情节点 caption + 3 个结局 endingBody
# 用法: bash gen-tts.sh
set -e
cd "$(dirname "$0")"
V="zh-CN-YunjianNeural"   # 沉稳男声旁白
R="--rate=-12% --pitch=-4Hz"
OUT="../fmv-shell/public/media/audio"
mkdir -p "$OUT"

tts() { # $1=节点id $2=文本
  echo "▸ $1"
  python3 -m edge_tts --voice $V $R --text "$2" --write-media "$OUT/$1.mp3" 2>/dev/null
}

tts n02_code "「红星」对「旧梦」。侧门敲三下，停，再敲两下。若有人先说「好雨」，你就走。你把口令咽回喉咙，像咽下一枚冰凉的钉子。"
tts n03_watch "侧巷里，灰大衣已经站得太久。烟蒂在脚边排成一行。他不看你。可雨声里，你听见打火机第二次响。"
tts n04_side "铁门里是黑的。老周的声音从暗处来，比记忆里更哑：「你迟到了。」他伸出手，掌心向上，像在等一场早该结束的雨。"
tts n05_lobby "大堂只剩一只坏掉的灯。红裙女人靠在旧海报下，笑着说：「老周发烧，今晚我来接。」她的耳环是新的。鞋底却没有雨。"
tts n05_probe "她的笑僵了半秒。她说：「是啊，好雨。」——错了。正确的回应是离开。你已经转身，红裙在灯里像一道伤口。"
tts n06_password "「红星。」「旧梦。」他点头，像把一块石头放回原处。你们交换一个极短的眼神：今晚不干净。"
tts ending_ghost "线还在。灰羽这两个字被从名册上划掉，像从未下过这场雨。三天后有人在码头看见一个撑伞的背影，没有回头。你活着——以消失的方式。"
tts ending_caught "红裙女人站在玻璃后面，点了一支烟。胶片被摊开在灯下，像一片湿透的肺。雨还在下，可已经与你无关。"
tts ending_hook "空胶片被他们当了真。对岸的电台乱了三天。老周寄来一张无字明信片，背面只有一个句号。你还活着，真货仍贴在鞋垫下——而他们开始怀疑每一场雨。"

# 视频旁白（先出干音，再由 mix-video-narration.sh 混进视频）
tts n01_narr "一九九四年。雨把霓虹揉碎在积水里。你是灰羽，一条不该被写进档案的线。零点，废弃的红星影院。口袋里的缩微胶片，是整条线的命。"
tts n07_narr "胶片离开口袋的瞬间，整栋楼像轻轻吸了一口气。远处，正门的铁链响了一下。你必须现在决定，什么才是真的。"

echo "=== 完成 ==="
FF=$(python3 -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())")
for f in "$OUT"/*.mp3; do
  D=$("$FF" -i "$f" 2>&1 | grep -o "Duration: [0-9:.]*" | cut -d' ' -f2)
  echo "$(basename "$f")  $D"
done
