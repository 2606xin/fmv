import type { GameState, SaveSlot, Settings } from "../types";
import { SLOT_COUNT, formatTime } from "../engine/save";

export function SettingsPanel({
  settings,
  onChange,
  onClose,
}: {
  settings: Settings;
  onChange: (s: Settings) => void;
  onClose: () => void;
}) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="panel" onClick={(e) => e.stopPropagation()}>
        <h2>设置</h2>
        <div className="row">
          <span>音量</span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(settings.volume * 100)}
            onChange={(e) =>
              onChange({ ...settings, volume: Number(e.target.value) / 100 })
            }
          />
        </div>
        <div className="row">
          <span>字幕大小</span>
          <div className="size-pills">
            {(["s", "m", "l"] as const).map((k) => (
              <button
                key={k}
                className={settings.captionSize === k ? "on" : ""}
                onClick={() => onChange({ ...settings, captionSize: k })}
              >
                {k === "s" ? "小" : k === "m" ? "中" : "大"}
              </button>
            ))}
          </div>
        </div>
        <div className="panel-actions">
          <button className="ghost-btn" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}

export function HistoryPanel({
  state,
  onClose,
}: {
  state: GameState;
  onClose: () => void;
}) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="panel" onClick={(e) => e.stopPropagation()}>
        <h2>记录</h2>
        <ol className="history-list">
          {state.history.map((h, i) => (
            <li key={`${h.at}-${i}`}>
              {h.choiceText ? <strong>▸ {h.choiceText}</strong> : null}
              <span>{h.caption ?? h.nodeId}</span>
            </li>
          ))}
        </ol>
        <div className="panel-actions">
          <button className="ghost-btn" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}

export function PauseMenu({
  slots,
  onSave,
  onLoad,
  onSettings,
  onHistory,
  onRouteMap,
  onTitle,
  onClose,
}: {
  slots: (SaveSlot | null)[];
  onSave: (slot: number) => void;
  onLoad: (slot: number) => void;
  onSettings: () => void;
  onHistory: () => void;
  onRouteMap: () => void;
  onTitle: () => void;
  onClose: () => void;
}) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="panel" onClick={(e) => e.stopPropagation()}>
        <h2>暂停</h2>
        <div className="slots">
          {Array.from({ length: SLOT_COUNT }, (_, i) => {
            const s = slots[i];
            return (
              <div className="slot" key={i}>
                <div className="meta">
                  <b>存档 {i + 1}</b>
                  {s
                    ? `${formatTime(s.state.updatedAt)} · ${s.preview}`
                    : "空"}
                </div>
                <button onClick={() => onSave(i)}>保存</button>
                <button disabled={!s} onClick={() => s && onLoad(i)}>
                  读取
                </button>
              </div>
            );
          })}
        </div>
        <div className="panel-actions">
          <button className="ghost-btn" onClick={onClose}>
            继续
          </button>
          <button className="ghost-btn" onClick={onHistory}>
            记录
          </button>
          <button className="ghost-btn" onClick={onRouteMap}>
            路线图
          </button>
          <button className="ghost-btn" onClick={onSettings}>
            设置
          </button>
          <button className="ghost-btn" onClick={onTitle}>
            返回标题
          </button>
        </div>
      </div>
    </div>
  );
}
