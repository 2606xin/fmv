import { useMemo, useState } from "react";
import type { Story, StoryNode } from "../types";
import type { AchievedRoute } from "../engine/unlocks";
import { formatTime } from "../engine/save";

function thumbOf(n: StoryNode): string {
  const stem = n.media.replace(/\.(mp4|png|webp)$/i, ".jpg");
  return `/media/thumbs/${stem}`;
}

/**
 * 路线图 v2：剧情回顾画廊（悬停出详情卡、点击直达场景）+ 通关路线记录。
 * 直达 = 以初始数值进入该场景的「回顾模式」。
 */
export function RouteMapPanel({
  story,
  routes,
  onClear,
  onJump,
  onClose,
}: {
  story: Story;
  routes: AchievedRoute[];
  storyId: string;
  onClear: () => void;
  onJump: (nodeId: string) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"scenes" | "runs">("scenes");
  const [openRoute, setOpenRoute] = useState<number | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const endings = Object.values(story.nodes).filter((n) => n.type === "ending");
  const achieved = new Set(routes.map((r) => r.endingId));
  const scenes = useMemo(
    () => Object.values(story.nodes).filter((n) => n.type !== "ending"),
    [story],
  );
  // 到访统计：历次通关路线的节点路径并集
  const visitCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of routes) for (const id of r.nodePath) m.set(id, (m.get(id) ?? 0) + 1);
    return m;
  }, [routes]);
  const reversed = [...routes].reverse();
  const detailNode = detail ? story.nodes[detail] : null;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="panel route-map-panel" onClick={(e) => e.stopPropagation()}>
        <h2>路线图</h2>

        <div className="rm-tabs">
          <button className={tab === "scenes" ? "on" : ""} onClick={() => setTab("scenes")}>
            剧情回顾
          </button>
          <button className={tab === "runs" ? "on" : ""} onClick={() => setTab("runs")}>
            通关路线 {routes.length > 0 ? `(${routes.length})` : ""}
          </button>
          <span className="rm-sub">
            已解锁结局 {achieved.size}/{endings.length}
          </span>
        </div>

        {tab === "scenes" ? (
          <>
            <p className="rm-note">
              悬停查看场景卡 · 点击卡片选择 · 「前往」以回顾模式直接进入该场景
            </p>
            <div className="rm-gallery">
              {scenes.map((n) => {
                const v = visitCount.get(n.id) ?? 0;
                return (
                  <button
                    key={n.id}
                    className={`rm-scene ${v ? "" : "locked"} ${detail === n.id ? "sel" : ""}`}
                    onClick={() => setDetail(detail === n.id ? null : n.id)}
                  >
                    <img src={thumbOf(n)} alt="" loading="lazy" />
                    <span className="rm-scene-name">{n.location ?? n.id}</span>
                    <span className="rm-scene-meta">
                      {v ? `到访 ${v} 次` : "尚未到达"}
                    </span>
                  </button>
                );
              })}
              {endings.map((n) => {
                const got = achieved.has(n.id);
                return (
                  <button
                    key={n.id}
                    className={`rm-scene end e-${n.id} ${got ? "" : "locked"} ${detail === n.id ? "sel" : ""}`}
                    onClick={() => setDetail(detail === n.id ? null : n.id)}
                  >
                    <img
                      src={thumbOf(n)}
                      alt=""
                      loading="lazy"
                      className={got ? "" : "blur"}
                    />
                    <span className="rm-scene-name">
                      {got ? n.endingTitle : "？？？"}
                    </span>
                    <span className="rm-scene-meta">
                      {got ? `达成 ${routes.filter((r) => r.endingId === n.id).length} 次` : "未解锁"}
                    </span>
                  </button>
                );
              })}
            </div>

            {detailNode ? (
              <div className={`rm-detail end-${detailNode.id}`}>
                <img src={thumbOf(detailNode)} alt="" />
                <div className="rm-detail-body">
                  <div className="rm-detail-head">
                    <span className="rm-detail-node">{detailNode.id}</span>
                    <b>
                      {detailNode.type === "ending"
                        ? detailNode.endingTitle
                        : detailNode.location}
                    </b>
                  </div>
                  <p className="rm-detail-cap">
                    {detailNode.type === "ending"
                      ? detailNode.endingBody
                      : detailNode.caption}
                  </p>
                  {(() => {
                    const v = visitCount.get(detailNode.id) ?? 0;
                    const got =
                      detailNode.type === "ending" ? achieved.has(detailNode.id) : v > 0;
                    return got ? (
                      <button className="rm-jump" onClick={() => onJump(detailNode.id)}>
                        ▸ 前往此场景（回顾模式）
                      </button>
                    ) : (
                      <span className="rm-locked-tip">尚未到达，先在游戏里走到这里</span>
                    );
                  })()}
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <>
            <ol className="rm-routes">
              {reversed.map((r, idx) => (
                <li key={r.at + "-" + idx}>
                  <button
                    className={`rm-route e-${r.endingId}`}
                    onClick={() => setOpenRoute(openRoute === idx ? null : idx)}
                  >
                    <span className="rm-route-title">{r.endingTitle ?? r.endingId}</span>
                    <span className="rm-route-steps">
                      {r.steps.length ? r.steps.join(" → ") : "（未作选择直接到达）"}
                    </span>
                    <span className="rm-route-time">{formatTime(r.at)}</span>
                  </button>
                  {openRoute === idx ? (
                    <div className="rm-route-detail">
                      <div className="rm-route-path">{r.nodePath.join(" → ")}</div>
                    </div>
                  ) : null}
                </li>
              ))}
              {routes.length === 0 ? (
                <li className="rm-empty">暂无通关记录，先打出一个结局吧。</li>
              ) : null}
            </ol>
            {confirming ? (
              <div className="panel-actions">
                <button className="ghost-btn" onClick={() => { onClear(); setConfirming(false); }}>
                  确认清空
                </button>
                <button className="ghost-btn" onClick={() => setConfirming(false)}>
                  取消
                </button>
              </div>
            ) : (
              <div className="panel-actions">
                <button className="ghost-btn" disabled={routes.length === 0} onClick={() => setConfirming(true)}>
                  清空记录
                </button>
              </div>
            )}
          </>
        )}

        <div className="panel-actions">
          <button className="ghost-btn" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
