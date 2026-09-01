import type { StoryNode } from "../types";

export function EndingCard({
  node,
  onTitle,
}: {
  node: StoryNode;
  onTitle: () => void;
}) {
  return (
    <div className="ending">
      <div className="tag">THE END</div>
      <h2>{node.endingTitle ?? "结局"}</h2>
      <p>{node.endingBody ?? node.caption}</p>
      <button className="back" onClick={onTitle}>
        返回标题
      </button>
    </div>
  );
}
