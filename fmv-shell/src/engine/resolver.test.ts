import { describe, expect, it } from "vitest";
import {
  applyChoice,
  applyChoiceEffects,
  createInitialState,
  matchesRequire,
  resolveNext,
  visibleChoices,
} from "./resolver";
import type { Choice, Story, StoryNode } from "../types";

const baseChoice = (over: Partial<Choice>): Choice => ({
  id: "c",
  text: "走",
  next: "b",
  ...over,
});

describe("matchesRequire", () => {
  it("无条件时始终通过", () => {
    expect(matchesRequire(undefined, {}, {})).toBe(true);
  });

  it("要求全部 flags 为真", () => {
    expect(matchesRequire({ flags: ["a", "b"] }, { a: true }, {})).toBe(false);
    expect(
      matchesRequire({ flags: ["a", "b"] }, { a: true, b: true }, {}),
    ).toBe(true);
  });

  it("notFlags 存在则为假", () => {
    expect(matchesRequire({ notFlags: ["x"] }, {}, {})).toBe(true);
    expect(matchesRequire({ notFlags: ["x"] }, { x: true }, {})).toBe(false);
    expect(matchesRequire({ notFlags: ["x"] }, { x: false }, {})).toBe(true);
  });

  it("min / max 含边界", () => {
    expect(matchesRequire({ min: { trust: 2 } }, {}, { trust: 1 })).toBe(false);
    expect(matchesRequire({ min: { trust: 2 } }, {}, { trust: 2 })).toBe(true);
    expect(matchesRequire({ max: { suspicion: 1 } }, {}, { suspicion: 2 })).toBe(
      false,
    );
    expect(matchesRequire({ max: { suspicion: 1 } }, {}, { suspicion: 1 })).toBe(
      true,
    );
    expect(matchesRequire({ min: { trust: 1 } }, {}, {})).toBe(false);
  });
});

describe("visibleChoices", () => {
  it("过滤不满足条件的选项", () => {
    const node: StoryNode = {
      id: "n",
      type: "still",
      media: "x.jpg",
      choices: [
        baseChoice({ id: "1", text: "A", next: "a" }),
        baseChoice({
          id: "2",
          text: "B",
          next: "b",
          require: { flags: ["sawTail"] },
        }),
      ],
    };
    expect(visibleChoices(node, {}, {}).map((c) => c.id)).toEqual(["1"]);
    expect(visibleChoices(node, { sawTail: true }, {}).map((c) => c.id)).toEqual(
      ["1", "2"],
    );
  });
});

describe("applyChoiceEffects", () => {
  it("设置标志并累加数值", () => {
    const r = applyChoiceEffects(
      { old: true },
      { trust: 1, suspicion: 0 },
      baseChoice({
        setFlags: ["knowsCode"],
        clearFlags: ["old"],
        inc: { trust: 1, suspicion: 2 },
      }),
    );
    expect(r.flags.knowsCode).toBe(true);
    expect(r.flags.old).toBe(false);
    expect(r.stats).toEqual({ trust: 2, suspicion: 2 });
  });
});

describe("resolveNext", () => {
  it("无 nextIf 时返回 next", () => {
    expect(resolveNext(baseChoice({ next: "x" }), {}, {})).toBe("x");
  });

  it("nextIf 在应用效果后求值，第一条匹配获胜", () => {
    const choice = baseChoice({
      next: "ghost",
      setFlags: ["gaveReal"],
      inc: { suspicion: 1 },
      nextIf: [
        { require: { flags: ["sawTail"], notFlags: ["warned"] }, next: "caught" },
        { require: { min: { suspicion: 2 } }, next: "caught" },
      ],
    });
    expect(resolveNext(choice, {}, { suspicion: 0 })).toBe("ghost");
    expect(resolveNext(choice, { sawTail: true }, { suspicion: 0 })).toBe(
      "caught",
    );
    expect(resolveNext(choice, { sawTail: true, warned: true }, { suspicion: 0 })).toBe(
      "ghost",
    );
    expect(resolveNext(choice, {}, { suspicion: 1 })).toBe("caught");
  });
});

describe("applyChoice / createInitialState", () => {
  const story: Story = {
    id: "t",
    title: "测",
    subtitle: "",
    start: "a",
    stats: { trust: 0, suspicion: 0 },
    statLabels: {},
    nodes: {
      a: {
        id: "a",
        type: "still",
        media: "a.jpg",
        caption: "开始",
        choices: [
          baseChoice({
            id: "go",
            text: "前进",
            next: "ghost",
            setFlags: ["gaveReal"],
            nextIf: [
              {
                require: { flags: ["sawTail"], notFlags: ["warned"] },
                next: "caught",
              },
            ],
          }),
        ],
      },
      ghost: { id: "ghost", type: "ending", media: "g.jpg", endingTitle: "影" },
      caught: { id: "caught", type: "ending", media: "c.jpg", endingTitle: "网" },
    },
  };

  it("开局落在 start 并带初始数值", () => {
    const s = createInitialState(story);
    expect(s.nodeId).toBe("a");
    expect(s.stats.trust).toBe(0);
    expect(s.history[0].nodeId).toBe("a");
  });

  it("选择后写入历史并跳到解析出的节点", () => {
    const s0 = createInitialState(story);
    s0.flags.sawTail = true;
    const next = applyChoice(story, s0, story.nodes.a.choices![0]);
    expect(next.nodeId).toBe("caught");
    expect(next.flags.gaveReal).toBe(true);
    expect(next.history.at(-1)?.choiceText).toBe("前进");
  });
});
