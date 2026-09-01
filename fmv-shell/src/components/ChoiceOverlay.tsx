import type { Choice } from "../types";

const NUMS = ["１", "２", "３", "４"];

/** 方向箭头：弧线箭头（按 dir 度旋转，0=向右）或环绕箭头（orbit） */
function SpotArrow({ dir, orbit }: { dir?: number; orbit?: boolean }) {
  if (orbit) {
    return (
      <svg className="spot-arrow orbit" viewBox="0 0 44 44" width="46" height="46">
        <path
          d="M22 7 A15 15 0 1 1 9.6 24.4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M5.4 19.6 L9.9 26 L15.6 21.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg
      className="spot-arrow"
      viewBox="0 0 48 26"
      width="54"
      height="30"
      style={{ ["--dir" as string]: `${dir ?? 0}deg` }}
    >
      <path
        d="M4 20 Q 22 2 40 11"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M32.6 3.8 L42.4 11.4 L32 17.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChoiceOverlay({
  choices,
  onPick,
}: {
  choices: Choice[];
  onPick: (c: Choice) => void;
}) {
  if (!choices.length) return null;
  const spotted = choices.filter((c) => c.spot);
  const allSpots = spotted.length === choices.length;

  return (
    <>
      {spotted.length ? (
        <div className="spots">
          {spotted.map((c, i) => (
            <button
              key={`spot-${c.id}`}
              className="spot"
              style={{ left: `${c.spot!.x}%`, top: `${c.spot!.y}%` }}
              onClick={() => onPick(c)}
              aria-label={`${c.spot!.label ?? ""}：${c.text}`}
            >
              <span className="spot-dot" />
              <span className="spot-ring" />
              <SpotArrow dir={c.spot!.dir} orbit={c.spot!.orbit} />
              <span className="spot-tip">
                <em>{c.spot!.label ?? ""}</em>
                <i>{c.text}</i>
              </span>
              {allSpots && spotted.length > 1 ? (
                <span className="spot-num">{NUMS[i] ?? ""}</span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}

      {allSpots ? (
        <div className="spot-hint">点击画面中的光点做出选择 · 数字键同样可用</div>
      ) : (
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
      )}
    </>
  );
}
