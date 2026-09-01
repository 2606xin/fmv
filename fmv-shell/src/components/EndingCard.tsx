import { useEffect, useRef } from "react";
import type { StoryNode } from "../types";

export function EndingCard({
  node,
  volume,
  onTitle,
}: {
  node: StoryNode;
  volume: number;
  onTitle: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = Math.min(1, volume * 1.15);
    a.play().catch(() => {
      /* 自动播放被拦时静默 */
    });
    return () => a.pause();
  }, [node.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="ending">
      <div className="tag">THE END</div>
      <h2>{node.endingTitle ?? "结局"}</h2>
      <p>{node.endingBody ?? node.caption}</p>
      <button className="back" onClick={onTitle}>
        返回标题
      </button>
      {node.audio ? <audio ref={audioRef} src={`/media/${node.audio}`} preload="auto" /> : null}
    </div>
  );
}
