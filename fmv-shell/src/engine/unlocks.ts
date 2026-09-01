import type { GameState } from "../types";

const KEY = "fmv-shell:unlocks";
const MAX_ROUTES = 30;

export type AchievedRoute = {
  endingId: string;
  endingTitle?: string;
  steps: string[];
  nodePath: string[];
  at: number;
};

export type StoryUnlocks = {
  endings: string[];
  routes: AchievedRoute[];
};

type UnlockDb = Record<string, StoryUnlocks>;

function readDb(): UnlockDb {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    return JSON.parse(raw) as UnlockDb;
  } catch {
    return {};
  }
}

function writeDb(db: UnlockDb): void {
  localStorage.setItem(KEY, JSON.stringify(db));
}

export function loadUnlocks(storyId: string): StoryUnlocks {
  return readDb()[storyId] ?? { endings: [], routes: [] };
}

export function recordRoute(storyId: string, route: AchievedRoute): void {
  const db = readDb();
  const u = db[storyId] ?? { endings: [], routes: [] };
  // 连续两次完全相同的路线不重复记（结局页重渲染/续档再进结局）
  const last = u.routes[u.routes.length - 1];
  const sig = route.endingId + "|" + route.steps.join("→");
  if (last && last.endingId + "|" + last.steps.join("→") === sig) return;
  if (!u.endings.includes(route.endingId)) u.endings.push(route.endingId);
  u.routes.push(route);
  if (u.routes.length > MAX_ROUTES) u.routes = u.routes.slice(-MAX_ROUTES);
  db[storyId] = u;
  writeDb(db);
}

export function clearUnlocks(storyId: string): void {
  const db = readDb();
  delete db[storyId];
  writeDb(db);
}

/** 从一局的状态提取路线（choices 文案链 + 节点路径）。 */
export function routeOfState(state: GameState, endingTitle?: string): AchievedRoute {
  return {
    endingId: state.nodeId,
    endingTitle,
    steps: state.history
      .slice(1)
      .map((h) => h.choiceText ?? "")
      .filter(Boolean),
    nodePath: state.history.map((h) => h.nodeId),
    at: Date.now(),
  };
}
