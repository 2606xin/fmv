import type {
  Choice,
  GameState,
  HistoryEntry,
  RequireCond,
  Story,
  StoryNode,
} from "../types";

export function matchesRequire(
  req: RequireCond | undefined,
  flags: Record<string, boolean>,
  stats: Record<string, number>,
): boolean {
  if (!req) return true;

  if (req.flags) {
    for (const f of req.flags) {
      if (!flags[f]) return false;
    }
  }
  if (req.notFlags) {
    for (const f of req.notFlags) {
      if (flags[f]) return false;
    }
  }
  if (req.min) {
    for (const [k, v] of Object.entries(req.min)) {
      if ((stats[k] ?? 0) < v) return false;
    }
  }
  if (req.max) {
    for (const [k, v] of Object.entries(req.max)) {
      if ((stats[k] ?? 0) > v) return false;
    }
  }
  return true;
}

export function visibleChoices(
  node: StoryNode,
  flags: Record<string, boolean>,
  stats: Record<string, number>,
): Choice[] {
  if (!node.choices) return [];
  return node.choices.filter((c) => matchesRequire(c.require, flags, stats));
}

export function applyChoiceEffects(
  flags: Record<string, boolean>,
  stats: Record<string, number>,
  choice: Choice,
): { flags: Record<string, boolean>; stats: Record<string, number> } {
  const nextFlags = { ...flags };
  const nextStats = { ...stats };

  if (choice.setFlags) {
    for (const f of choice.setFlags) nextFlags[f] = true;
  }
  if (choice.clearFlags) {
    for (const f of choice.clearFlags) nextFlags[f] = false;
  }
  if (choice.inc) {
    for (const [k, v] of Object.entries(choice.inc)) {
      nextStats[k] = (nextStats[k] ?? 0) + v;
    }
  }
  return { flags: nextFlags, stats: nextStats };
}

/** 先应用效果，再按 nextIf / next 解析下一节点。 */
export function resolveNext(
  choice: Choice,
  flags: Record<string, boolean>,
  stats: Record<string, number>,
): string {
  const applied = applyChoiceEffects(flags, stats, choice);
  if (choice.nextIf) {
    for (const branch of choice.nextIf) {
      if (matchesRequire(branch.require, applied.flags, applied.stats)) {
        return branch.next;
      }
    }
  }
  return choice.next;
}

export function getNode(story: Story, id: string): StoryNode {
  const node = story.nodes[id];
  if (!node) {
    throw new Error(`故事节点不存在: ${id}`);
  }
  return node;
}

export function createInitialState(story: Story): GameState {
  const now = Date.now();
  return {
    storyId: story.id,
    nodeId: story.start,
    flags: {},
    stats: { ...story.stats },
    history: [
      {
        nodeId: story.start,
        caption: story.nodes[story.start]?.caption,
        at: now,
      },
    ],
    startedAt: now,
    updatedAt: now,
  };
}

export function applyChoice(
  story: Story,
  state: GameState,
  choice: Choice,
): GameState {
  const { flags, stats } = applyChoiceEffects(state.flags, state.stats, choice);
  const nextId = resolveNext(choice, state.flags, state.stats);
  if (!story.nodes[nextId]) {
    throw new Error(`下一节点不存在: ${nextId}`);
  }
  const now = Date.now();
  const entry: HistoryEntry = {
    nodeId: nextId,
    choiceId: choice.id,
    choiceText: choice.text,
    caption: story.nodes[nextId]?.caption,
    at: now,
  };
  return {
    ...state,
    nodeId: nextId,
    flags,
    stats,
    history: [...state.history, entry],
    updatedAt: now,
  };
}
