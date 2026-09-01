export function TitleScreen({
  title,
  subtitle,
  canContinue,
  onStart,
  onContinue,
  onSettings,
}: {
  title: string;
  subtitle: string;
  canContinue: boolean;
  onStart: () => void;
  onContinue: () => void;
  onSettings: () => void;
}) {
  return (
    <div className="title-screen">
      <div className="bg">
        <img src="/media/title.jpg" alt="" />
      </div>
      <div className="eyebrow">互动影游</div>
      <h1>{title}</h1>
      <p className="subtitle">{subtitle}</p>
      <nav className="menu">
        <button className="menu-item" onClick={onStart}>
          开始游戏
        </button>
        <button
          className="menu-item"
          onClick={onContinue}
          disabled={!canContinue}
        >
          继续游戏
        </button>
        <button className="menu-item" onClick={onSettings}>
          设置
        </button>
      </nav>
    </div>
  );
}
