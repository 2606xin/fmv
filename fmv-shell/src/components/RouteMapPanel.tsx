import { useState } from "react";
import type { Story } from "../types";
import type { AchievedRoute } from "../engine/unlocks";
import { formatTime } from "../engine/save";

/**
 * 路线解锁图：结局卡点亮 + 已通关路线回看。
 * 程序侧只消费 story.json 与 unlocks 记录，不维护第二份结构。
 */
export function RouteMapPanel({
  story,
  routes,
  onClear,
  onClose,
}: {
  story: Story;
  routes: AchievedRoute[];
  storyId: string;
  onClear: () => void;
  onClose: () => void;
}) {
  const [openRoute, setOpenRoute] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);
  const endings = Object.values(story.nodes).filter((n) => n.type === "ending");
  const achieved = new Set(routes.map((r) => r.endingId));
  const reversed = [...routes].reverse();

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="panel route-map-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <h2>路线图</h2>
        <div className="rm-sub">
          已解锁 {achieved.size} / {endings.length} 个结局
        </div>
        <div className="rm-cards">
          {endings.map((n) => {
            const got = achieved.has(n.id);
            const times = routes.filter((r) => r.endingId === n.id).length;
            return (
              <div
                key={n.id}
                className={`rm-card e-${n.id} ${got ? "lit" : "dim"}`}
              >
                <div className="rm-card-title">
                  {got ? n.endingTitle ?? "结局" : "？？？"}
                </div>
                <div className="rm-card-body">
                  {got
                    ? n.endingBody ?? n.caption ?? ""
                    : "尚未解锁——继续做出不同的选择。"}
                </div>
                <div className="rm-card-meta">
                  {got ? `达成 ${times} 次` : "未解锁"}
                </div>
              </div>
            );
          })}
        </div>

        <div className="rm-history-head">
          通关路线回看（{routes.length} 条，新→旧）
        </div>
        <ol className="rm-routes">
          {reversed.map((r, idx) => (
            <li key={r.at + "-" + idx}>
              <button
                className={`rm-route e-${r.endingId}`}
                onClick={() =>
                  setOpenRoute(openRoute === idx ? null : idx)
                }
              >
                <span className="rm-route-title">
                  {r.endingTitle ?? r.endingId}
                </span>
                <span className="rm-route-steps">
                  {r.steps.length
                    ? r.steps.join(" → ")
                    : "（未作选择直接到达）"}
                </span>
                <span className="rm-route-time">{formatTime(r.at)}</span>
              </button>
              {openRoute === idx ? (
                <div className="rm-route-detail">
                  <div className="rm-route-path">
                    {r.nodePath.join(" → ")}
                  </div>
                </div>
              ) : null}
            </li>
          ))}
          {routes.length === 0 ? (
            <li className="rm-empty">暂无通关记录，先打出一个结局吧。</li>
          ) : null}
        </ol>

        <div className="panel-actions">
          {confirming ? (
            <>
              <button
                className="ghost-btn"
                onClick={() => {
                  onClear();
                  setConfirming(false);
                }}
              >
                确认清空
              </button>
              <button
                className="ghost-btn"
                onClick={() => setConfirming(false)}
              >
                取消
              </button>
            </>
          ) : (
            <button
              className="ghost-btn"
              disabled={routes.length === 0}
              onClick={() => setConfirming(true)}
            >
              清空记录
            </button>
          )}
          <button className="ghost-btn" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
