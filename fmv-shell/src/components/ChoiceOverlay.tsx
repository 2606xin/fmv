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
  const spots = choices.filter((c) => c.spot);
  return (
    <>
      {spots.length ? (
        <div className="spots" aria-hidden={false}>
          {spots.map((c, i) => (
            <button
              key={`spot-${c.id}`}
              className="spot"
              style={{ left: `${c.spot!.x}%`, top: `${c.spot!.y}%` }}
              onClick={() => onPick(c)}
              aria-label={c.spot!.label ?? c.text}
            >
              <span className="spot-dot" />
              <span className="spot-ring" />
              <span className="spot-tip">
                <em>{c.spot!.label ?? c.text}</em>
                <i>{c.text}</i>
              </span>
              {spots.length > 1 ? (
                <span className="spot-num">{NUMS[i] ?? ""}</span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
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
    </>
  );
}
