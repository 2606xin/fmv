import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Choice, GameState, Settings, Story } from "./types";
import {
  applyChoice,
  createInitialState,
  getNode,
  visibleChoices,
} from "./engine/resolver";
import {
  autosave,
  hasContinue,
  loadAutosave,
  loadSettings,
  loadSlots,
  saveSettings,
  writeSlot,
} from "./engine/save";
import { TitleScreen } from "./components/TitleScreen";
import { MediaStage } from "./components/MediaStage";
import { ChoiceOverlay } from "./components/ChoiceOverlay";
import { EndingCard } from "./components/EndingCard";
import { RouteMapPanel } from "./components/RouteMapPanel";
import { useHoverSound } from "./components/useHoverSound";
import {
  HistoryPanel,
  PauseMenu,
  SettingsPanel,
} from "./components/Panels";
import {
  clearUnlocks,
  loadUnlocks,
  recordRoute,
  routeOfState,
} from "./engine/unlocks";
import type { StoryUnlocks } from "./engine/unlocks";

type Overlay = "none" | "pause" | "settings" | "history" | "routemap";

function previewOf(state: GameState, story: Story): string {
  const n = story.nodes[state.nodeId];
  return n?.endingTitle || n?.location || n?.caption?.slice(0, 18) || n?.id || "";
}

export default function App() {
  const [story, setStory] = useState<Story | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"title" | "play">("title");
  const [state, setState] = useState<GameState | null>(null);
  const [awaitingChoice, setAwaitingChoice] = useState(false);
  const [skipToken, setSkipToken] = useState(0);
  const [overlay, setOverlay] = useState<Overlay>("none");
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [canCont, setCanCont] = useState(false);
  const [slots, setSlots] = useState(() => loadSlots());
  const [showHud, setShowHud] = useState(false);
  const bgmRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const b = bgmRef.current;
    if (b) b.volume = Math.min(1, settings.volume * 0.18);
  }, [settings.volume]);

  const startBgm = useCallback(() => {
    const b = bgmRef.current;
    if (!b) return;
    b.volume = Math.min(1, settings.volume * 0.18);
    b.play().catch(() => {
      /* 浏览器在首次用户手势前会拦截，下次交互再试 */
    });
  }, [settings.volume]);
  const [unlocks, setUnlocks] = useState<StoryUnlocks>(() => ({
    endings: [],
    routes: [],
  }));
  const recordedRun = useRef("");
  const hoverSound = useHoverSound(settings.volume);

  useEffect(() => {
    fetch("/story.json")
      .then((r) => {
        if (!r.ok) throw new Error("无法读取 story.json");
        return r.json();
      })
      .then((data: Story) => {
        setStory(data);
        setCanCont(hasContinue());
        setUnlocks(loadUnlocks(data.id));
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const node = story && state ? getNode(story, state.nodeId) : null;
  const isEnding = node?.type === "ending";

  // 到达结局时记录本局路线（startedAt+nodeId 防重复）
  useEffect(() => {
    if (!story || !state || !isEnding) return;
    const sig = `${state.startedAt}:${state.nodeId}`;
    if (recordedRun.current === sig) return;
    recordedRun.current = sig;
    recordRoute(story.id, routeOfState(state, node?.endingTitle));
    setUnlocks(loadUnlocks(story.id));
  }, [story, state, isEnding, node?.endingTitle]);
  const choices = useMemo(() => {
    if (!node || !state || !awaitingChoice || isEnding) return [];
    return visibleChoices(node, state.flags, state.stats);
  }, [node, state, awaitingChoice, isEnding]);

  const persist = useCallback(
    (next: GameState, s: Story) => {
      autosave(next, previewOf(next, s));
      setCanCont(true);
    },
    [],
  );

  const startNew = useCallback(() => {
    if (!story) return;
    const s = createInitialState(story);
    setState(s);
    setMode("play");
    setAwaitingChoice(false);
    setSkipToken(0);
    setOverlay("none");
    startBgm();
    persist(s, story);
  }, [story, persist, startBgm]);

  const continueGame = useCallback(() => {
    const a = loadAutosave();
    if (!a || !story) return;
    setState(a.state);
    setMode("play");
    setAwaitingChoice(a.state.nodeId ? story.nodes[a.state.nodeId]?.type === "ending" : false);
    setSkipToken(0);
    setOverlay("none");
    startBgm();
  }, [story, startBgm]);

  const pick = useCallback(
    (c: Choice) => {
      if (!story || !state) return;
      const next = applyChoice(story, state, c);
      setState(next);
      setAwaitingChoice(false);
      setSkipToken(0);
      persist(next, story);
    },
    [story, state, persist],
  );

  const onMediaEnded = useCallback(() => {
    setAwaitingChoice(true);
  }, []);

  const skip = useCallback(() => {
    if (overlay !== "none" || isEnding) return;
    setSkipToken((n) => n + 1);
    setAwaitingChoice(true);
  }, [overlay, isEnding]);

  const toTitle = useCallback(() => {
    setMode("title");
    setOverlay("none");
    setCanCont(hasContinue());
    setSlots(loadSlots());
  }, []);

  /** 剧情回顾：以初始数值直接进入某场景（flags/stats 归零） */
  const jumpToNode = useCallback(
    (nodeId: string) => {
      if (!story || !story.nodes[nodeId]) return;
      const base = createInitialState(story);
      setState({
        ...base,
        nodeId,
        history: [
          { nodeId, caption: story.nodes[nodeId]?.caption, at: Date.now() },
        ],
        updatedAt: Date.now(),
      });
      setMode("play");
      setAwaitingChoice(false);
      setSkipToken(0);
      setOverlay("none");
    },
    [story],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === "Escape") {
        if (mode !== "play") {
          if (overlay === "settings") setOverlay("none");
          return;
        }
        if (overlay === "none") setOverlay("pause");
        else setOverlay("none");
        return;
      }
      if (overlay !== "none") return;
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        if (mode === "play" && !isEnding && !awaitingChoice) skip();
        return;
      }
      if (mode === "play" && awaitingChoice && !isEnding) {
        const n = Number(e.key);
        if (n >= 1 && n <= 4 && choices[n - 1]) {
          pick(choices[n - 1]);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, overlay, awaitingChoice, isEnding, choices, pick, skip]);

  useEffect(() => {
    let t: number;
    const show = () => {
      setShowHud(true);
      window.clearTimeout(t);
      t = window.setTimeout(() => setShowHud(false), 2200);
    };
    window.addEventListener("mousemove", show);
    return () => {
      window.removeEventListener("mousemove", show);
      window.clearTimeout(t);
    };
  }, []);

  if (error) {
    return (
      <div className="app">
        <p className="boot">读取失败：{error}</p>
      </div>
    );
  }
  if (!story) {
    return (
      <div className="app">
        <p className="boot">载入中…</p>
      </div>
    );
  }

  return (
    <div className="app">
      <div
        className={`stage size-${settings.captionSize} ${showHud ? "show-hud" : ""}`}
      >
        {mode === "title" || !state || !node ? (
          <>
            <TitleScreen
              title={story.title}
              subtitle={story.subtitle}
              canContinue={canCont}
              onStart={startNew}
              onContinue={continueGame}
              onSettings={() => setOverlay("settings")}
              onRouteMap={() => setOverlay("routemap")}
            />
          </>
        ) : (
          <>
            <MediaStage
              node={node}
              volume={settings.volume}
              onEnded={onMediaEnded}
              skipToken={skipToken}
            />
            {node.location ? (
              <div className="location-tag">{node.location}</div>
            ) : null}
            <div className="stats-chip">
              <span>
                {story.statLabels.trust ?? "信任"} {state.stats.trust ?? 0}
              </span>
              <span>
                {story.statLabels.suspicion ?? "怀疑"} {state.stats.suspicion ?? 0}
              </span>
            </div>
            {node.caption && !isEnding ? (
              <div className="caption">{node.caption}</div>
            ) : null}
            {isEnding ? (
              <EndingCard node={node} volume={settings.volume} onTitle={toTitle} />
            ) : (
              <>
                <ChoiceOverlay choices={choices} onPick={pick} />
                {!awaitingChoice ? (
                  <div className="skip-hint">空格 跳过</div>
                ) : null}
                <div className="hud">
                  <button onClick={skip}>跳过</button>
                  <button onClick={() => setOverlay("history")}>记录</button>
                  <button onClick={() => setOverlay("routemap")}>路线图</button>
                  <button onClick={() => setOverlay("settings")}>设置</button>
                  <button onClick={() => setOverlay("pause")}>菜单</button>
                </div>
              </>
            )}
          </>
        )}

        <div className="grain" />
        <div className="vignette" />
        <div className="letterbox" />
        <audio ref={bgmRef} src="/media/audio/bgm.mp3" loop preload="auto" />
        {hoverSound}

        {overlay === "settings" ? (
          <SettingsPanel
            settings={settings}
            onChange={setSettings}
            onClose={() => setOverlay("none")}
          />
        ) : null}
        {overlay === "history" && state ? (
          <HistoryPanel state={state} onClose={() => setOverlay("none")} />
        ) : null}
        {overlay === "pause" && state ? (
          <PauseMenu
            slots={slots}
            onSave={(i) => {
              writeSlot(i, state, previewOf(state, story));
              setSlots(loadSlots());
            }}
            onLoad={(i) => {
              const s = loadSlots()[i];
              if (!s) return;
              setState(s.state);
              setAwaitingChoice(false);
              setSkipToken(0);
              setOverlay("none");
              persist(s.state, story);
            }}
            onSettings={() => setOverlay("settings")}
            onHistory={() => setOverlay("history")}
            onRouteMap={() => setOverlay("routemap")}
            onTitle={toTitle}
            onClose={() => setOverlay("none")}
          />
        ) : null}
        {overlay === "routemap" && story ? (
          <RouteMapPanel
            story={story}
            storyId={story.id}
            routes={unlocks.routes}
            onClear={() => {
              clearUnlocks(story.id);
              setUnlocks(loadUnlocks(story.id));
            }}
            onJump={jumpToNode}
            onClose={() => setOverlay("none")}
          />
        ) : null}
      </div>
    </div>
  );
}
