#!/bin/bash
# Grok 视频（848x480 无声）→ 游戏正片：升采样1080p + 锐化 + 调色颗粒 + 氛围音轨
# 用法: bash grok-post.sh <输入.mp4> <输出.mp4> <时长秒> <rain|tension>
set -e
IN="$1"; OUT="$2"; DUR="$3"; MOOD="$4"
FF=$(python3 -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())")
FADE_OUT=$(python3 -c "print(max(0, $DUR - 0.9))")

GRADE="eq=saturation=1.06:contrast=1.03,noise=alls=5:allf=t,vignette=PI/4.6,fade=t=in:st=0:d=0.7,fade=t=out:st=${FADE_OUT}:d=0.9,setsar=1"

if [ "$MOOD" = "rain" ]; then
  "$FF" -y -loglevel error -i "$IN" \
    -f lavfi -t "$DUR" -i "anoisesrc=color=pink:amplitude=0.55:sample_rate=44100" \
    -filter_complex "[0:v]scale=1920:1080:flags=lanczos,unsharp=5:5:0.5:5:5:0.0,${GRADE},format=yuv420p[v];[1:a]highpass=f=400,lowpass=f=1500,tremolo=f=0.35:d=0.35,volume=0.9,afade=t=in:st=0:d=1,afade=t=out:st=${FADE_OUT}:d=0.9,aformat=sample_rates=44100:channel_layouts=stereo[a]" \
    -map "[v]" -map "[a]" -c:v libx264 -preset medium -crf 20 -c:a aac -b:a 128k -movflags +faststart -shortest "$OUT"
else
  # tension：低频房间底噪 + 两声铁链撞击
  "$FF" -y -loglevel error -f lavfi -i "anoisesrc=color=white:amplitude=0.9:duration=0.5:sample_rate=44100" \
    -af "highpass=f=1600,lowpass=f=5200,volume='if(lt(t,0.03),t*33,exp(-(t-0.03)*14))':eval=frame,aecho=0.7:0.6:120|300:0.3|0.22" /tmp/clank1.wav
  "$FF" -y -loglevel error -f lavfi -i "anoisesrc=color=white:amplitude=0.7:duration=0.4:sample_rate=44100" \
    -af "highpass=f=900,lowpass=f=2400,volume='if(lt(t,0.03),t*30,exp(-(t-0.03)*16))':eval=frame,aecho=0.6:0.5:90|210:0.25|0.18" /tmp/clank2.wav
  "$FF" -y -loglevel error -i "$IN" \
    -f lavfi -t "$DUR" -i "anoisesrc=color=brown:amplitude=0.5:sample_rate=44100" \
    -i /tmp/clank1.wav -i /tmp/clank2.wav \
    -filter_complex "[0:v]scale=1920:1080:flags=lanczos,unsharp=5:5:0.55:5:5:0.0,${GRADE},format=yuv420p[v];[1:a]lowpass=f=240,volume=0.5,afade=t=in:st=0:d=1.2,afade=t=out:st=${FADE_OUT}:d=0.9[room];[2:a]adelay=4200|4200,volume=0.9[c1];[3:a]adelay=6800|6800,volume=0.55[c2];[room][c1][c2]amix=inputs=3:normalize=0,aformat=sample_rates=44100:channel_layouts=stereo[a]" \
    -map "[v]" -map "[a]" -c:v libx264 -preset medium -crf 20 -c:a aac -b:a 128k -movflags +faststart -shortest "$OUT"
  rm -f /tmp/clank1.wav /tmp/clank2.wav
fi
echo "完成: $OUT"
"$FF" -i "$OUT" 2>&1 | grep -E "Duration|Stream #0:0" | head -2
