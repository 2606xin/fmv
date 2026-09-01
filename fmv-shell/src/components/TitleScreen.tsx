export function TitleScreen({
  title,
  subtitle,
  canContinue,
  onStart,
  onContinue,
  onSettings,
  onRouteMap,
}: {
  title: string;
  subtitle: string;
  canContinue: boolean;
  onStart: () => void;
  onContinue: () => void;
  onSettings: () => void;
  onRouteMap: () => void;
}) {
  return (
    <div className="title-screen">
      <div className="bg">
        <video
          src="/media/title.mp4"
          poster="/media/title.jpg"
          autoPlay
          muted
          loop
          playsInline
        />
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
        <button className="menu-item" onClick={onRouteMap}>
          路线图
        </button>
        <button className="menu-item" onClick={onSettings}>
          设置
        </button>
      </nav>
    </div>
  );
}
