import { useEffect, useRef } from "react";

/** 全局按钮悬停音效：鼠标滑入任意 button 播一声短促木鱼感「咚」。
 *  relatedTarget 判定避免按钮内部子元素间移动重复触发。 */
export function useHoverSound(volume: number) {
  const ref = useRef<HTMLAudioElement>(null);
  const volRef = useRef(volume);
  volRef.current = volume;

  useEffect(() => {
    const onOver = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest?.("button");
      if (!btn) return;
      // 从按钮内部子元素间移动不重复响
      if (e.relatedTarget instanceof Node && btn.contains(e.relatedTarget)) return;
      const a = ref.current;
      if (!a) return;
      a.volume = Math.min(1, volRef.current * 0.5);
      a.currentTime = 0;
      a.play().catch(() => {
        /* 未交互前浏览器拦截，静默 */
      });
    };
    window.addEventListener("mouseover", onOver);
    return () => window.removeEventListener("mouseover", onOver);
  }, []);

  return (
    <audio ref={ref} src="/media/audio/ui-hover.mp3" preload="auto" />
  );
}
