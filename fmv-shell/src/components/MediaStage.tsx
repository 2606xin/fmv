import { useEffect, useRef } from "react";
import type { StoryNode } from "../types";

export function MediaStage({
  node,
  volume,
  onEnded,
  skipToken,
}: {
  node: StoryNode;
  volume: number;
  onEnded: () => void;
  skipToken: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const ended = useRef(false);
  const finish = useRef<() => void>(() => {});

  finish.current = () => {
    if (ended.current) return;
    ended.current = true;
    audioRef.current?.pause();
    onEnded();
  };

  useEffect(() => {
    ended.current = false;
  }, [node.id, skipToken]);

  useEffect(() => {
    const v = videoRef.current;
    if (v) v.volume = volume;
    const a = audioRef.current;
    if (a) a.volume = Math.min(1, volume * 1.15);
  }, [volume, node.id]);

  useEffect(() => {
    if (skipToken === 0) return;
    const v = videoRef.current;
    if (v && node.type === "video") {
      try {
        v.currentTime = Math.max(0, v.duration - 0.05);
      } catch {
        /* ignore */
      }
    }
    finish.current();
  }, [skipToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // 无配音时沿用时长定时器；有配音时音频结束才收（视频先播完则定格末帧等旁白）
  useEffect(() => {
    if (node.audio) return;
    if (node.type !== "still" && node.type !== "ending") return;
    const ms = Math.max(1.2, node.duration ?? 6) * 1000;
    const t = window.setTimeout(() => finish.current(), ms);
    return () => window.clearTimeout(t);
  }, [node.id, node.type, node.duration, node.audio]);

  const src = `/media/${node.media}`;
  // 结局节点若换成视频（.mp4）则静音循环播放，节奏由结局旁白驱动
  const isEndingVideo =
    node.type === "ending" && /\.mp4$/i.test(node.media);

  return (
    <div className="media-layer">
      {node.type === "video" || isEndingVideo ? (
        <video
          key={node.id}
          ref={videoRef}
          src={src}
          autoPlay
          playsInline
          muted={isEndingVideo}
          loop={isEndingVideo}
          onEnded={() => {
            if (!node.audio && !isEndingVideo) finish.current();
          }}
        />
      ) : (
        <img
          key={node.id}
          className="kenburns"
          src={src}
          alt=""
          draggable={false}
        />
      )}
      {node.audio ? (
        <audio
          key={`${node.id}-audio`}
          ref={audioRef}
          src={`/media/${node.audio}`}
          autoPlay
          preload="auto"
          onEnded={() => finish.current()}
          onError={() => {
            // 音频缺失：退回时长定时器
            const ms = Math.max(1.2, node.duration ?? 6) * 1000;
            window.setTimeout(() => finish.current(), ms);
          }}
        />
      ) : null}
    </div>
  );
}
