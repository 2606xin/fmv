import type { Choice } from "../types";

const NUMS = ["１", "２", "３", "４"];

export function ChoiceOverlay({
  choices,
  onPick,
}: {
  choices: Choice[];
  onPick: (c: Choice) => void;
}) {
  if (!choices.length) return null;
  return (
    <div className="choices" role="listbox" aria-label="选项">
      {choices.map((c, i) => (
        <button
          key={c.id}
          className="choice"
          role="option"
          onClick={() => onPick(c)}
        >
          <span className="num">{NUMS[i] ?? String(i + 1)}</span>
          <span>{c.text}</span>
        </button>
      ))}
    </div>
  );
}
