#!/bin/bash
# 用 AI 关键帧合成两个剧情视频：缓推镜 + 雨幕粒子 + 闪电 + 氛围音 + 胶片颗粒
# 用法: bash compose-videos.sh
set -e
cd "$(dirname "$0")"
FF=$(python3 -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())")
ENC="-c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 128k -shortest"

# ---------- n01_rain.mp4 · 12s 开场：低机位雨夜街道，推镜+雨+闪电+雨声 ----------
"$FF" -y -loglevel error \
  -loop 1 -t 12 -framerate 30 -i n01_key.png \
  -f lavfi -t 12 -i "color=c=black:s=480x270:r=30,noise=alls=100:allf=t,eq=contrast=6:brightness=-0.75,scale=1920:3240:flags=neighbor,crop=1920:1080:0:'mod(t*2200,2160)'" \
  -f lavfi -t 12 -i "color=c=black:s=480x270:r=30,noise=alls=80:allf=t,eq=contrast=5:brightness=-0.8,scale=1920:3240:flags=neighbor,crop=1920:1080:0:'mod(t*1300,2160)'" \
  -f lavfi -t 12 -i "anoisesrc=color=pink:amplitude=0.55:sample_rate=44100" \
  -filter_complex "\
[0:v]scale=7680:4320,zoompan=z='min(1+0.14*on/360,1.14)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1920x1080:fps=30[base];\
[base][1:v]blend=all_mode=screen:all_opacity=0.38[m1];\
[m1][2:v]blend=all_mode=screen:all_opacity=0.25[m2];\
[m2]eq=brightness=0.22:enable='gte(t,7.2)*lt(t,7.34)+gte(t,7.48)*lt(t,7.62)',eq=saturation=1.05:contrast=1.02,noise=alls=5:allf=t,vignette=PI/4.4,fade=t=in:st=0:d=0.9,fade=t=out:st=11.1:d=0.9,setsar=1,format=yuv420p[v];\
[3:a]highpass=f=400,lowpass=f=1500,tremolo=f=0.35:d=0.35,volume=0.9,afade=t=in:st=0:d=1,afade=t=out:st=11:d=1[a]" \
  -map "[v]" -map "[a]" $ENC n01_rain.mp4
echo "n01_rain.mp4 完成"

# ---------- n07_hand.mp4 · 10s 高潮：楼梯间接胶片，推镜+暗部张力+铁链声 ----------
# 铁链声素材：噪声脉冲经带通+回声，模拟金属碰撞
"$FF" -y -loglevel error -f lavfi -i "anoisesrc=color=white:amplitude=0.9:duration=0.5:sample_rate=44100" \
  -af "highpass=f=1600,lowpass=f=5200,volume='if(lt(t,0.03),t*33,exp(-(t-0.03)*14))':eval=frame,aecho=0.7:0.6:120|300:0.3|0.22" \
  clank.wav
"$FF" -y -loglevel error -f lavfi -i "anoisesrc=color=white:amplitude=0.7:duration=0.4:sample_rate=44100" \
  -af "highpass=f=900,lowpass=f=2400,volume='if(lt(t,0.03),t*30,exp(-(t-0.03)*16))':eval=frame,aecho=0.6:0.5:90|210:0.25|0.18" \
  clank2.wav
"$FF" -y -loglevel error \
  -loop 1 -t 10 -framerate 30 -i n07_key.png \
  -f lavfi -t 10 -i "color=c=black:s=480x270:r=30,noise=alls=70:allf=t,eq=contrast=5:brightness=-0.82,scale=1920:3240:flags=neighbor,crop=1920:1080:0:'mod(t*1600,2160)'" \
  -f lavfi -t 10 -i "anoisesrc=color=brown:amplitude=0.5:sample_rate=44100" \
  -i clank.wav -i clank2.wav \
  -filter_complex "\
[0:v]scale=7680:4320,zoompan=z='min(1+0.18*on/300,1.18)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1920x1080:fps=30[base];\
[base][1:v]blend=all_mode=screen:all_opacity=0.16[m1];\
[m1]eq=saturation=0.96:contrast=1.06:brightness=-0.02,noise=alls=6:allf=t,vignette=PI/4.1,fade=t=in:st=0:d=0.7,fade=t=out:st=9.1:d=0.9,setsar=1,format=yuv420p[v];\
[2:a]lowpass=f=240,volume=0.5,afade=t=in:st=0:d=1.2,afade=t=out:st=9:d=1[room];\
[3:a]adelay=4200|4200,volume=0.9[c1];\
[4:a]adelay=6800|6800,volume=0.55[c2];\
[room][c1][c2]amix=inputs=3:normalize=0[a]" \
  -map "[v]" -map "[a]" $ENC n07_hand.mp4
rm -f clank.wav clank2.wav
echo "n07_hand.mp4 完成"
"$FF" -version | head -1; ls -la n01_rain.mp4 n07_hand.mp4
