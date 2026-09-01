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
  const ended = useRef(false);

  useEffect(() => {
    ended.current = false;
  }, [node.id, skipToken]);

  useEffect(() => {
    const v = videoRef.current;
    if (v) v.volume = volume;
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
      onEnded();
      return;
    }
    onEnded();
  }, [skipToken]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (node.type !== "still" && node.type !== "ending") return;
    const ms = Math.max(1.2, node.duration ?? 6) * 1000;
    const t = window.setTimeout(() => {
      if (!ended.current) {
        ended.current = true;
        onEnded();
      }
    }, ms);
    return () => window.clearTimeout(t);
  }, [node.id, node.type, node.duration, onEnded]);

  const src = `/media/${node.media}`;

  return (
    <div className="media-layer">
      {node.type === "video" ? (
        <video
          key={node.id}
          ref={videoRef}
          src={src}
          autoPlay
          playsInline
          onEnded={() => {
            if (!ended.current) {
              ended.current = true;
              onEnded();
            }
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
    </div>
  );
}
