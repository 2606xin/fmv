/** 互动影游故事图数据结构 */

export interface RequireCond {
  /** 必须全部为真的标志 */
  flags?: string[];
  /** 必须全部为假/不存在的标志 */
  notFlags?: string[];
  /** 数值下限（含） */
  min?: Record<string, number>;
  /** 数值上限（含） */
  max?: Record<string, number>;
}

export interface NextIf {
  require: RequireCond;
  next: string;
}

export interface ChoiceSpot {
  /** 画面内百分比坐标（0-100），标记出现在选项亮起时，可点击 */
  x: number;
  y: number;
  /** 悬停提示的地点标签（如「巷口」「影院」） */
  label?: string;
}

export interface Choice {
  id: string;
  text: string;
  next: string;
  /** 画面位置标记：有值时在图/视频对应位置出现可点击视线标记 */
  spot?: ChoiceSpot;
  /** 选项可见条件；不满足则不显示 */
  require?: RequireCond;
  /** 选中后设置的布尔标志 */
  setFlags?: string[];
  /** 选中后清除的布尔标志 */
  clearFlags?: string[];
  /** 选中后增减的数值（信任、怀疑等） */
  inc?: Record<string, number>;
  /**
   * 按当前（已应用效果后的）状态挑选下一节点。
   * 从上到下第一条匹配的分支生效，否则使用 next。
   */
  nextIf?: NextIf[];
}

export type NodeType = "still" | "video" | "ending";

export interface StoryNode {
  id: string;
  type: NodeType;
  /** public/media 下的文件名 */
  media: string;
  /** 节点旁白/配音（public/media 下的相对路径，如 audio/n02_code.mp3）。
   * 存在时由音频驱动节奏：静帧等旁白读完；视频播完定格末帧等旁白。 */
  audio?: string;
  /** 静帧展示秒数；视频可省略（播完再出选项）。有 audio 时仅作音频缺失的兜底 */
  duration?: number;
  /** 底部字幕/旁白 */
  caption?: string;
  /** 画面内小标题（地点/时间） */
  location?: string;
  choices?: Choice[];
  /** 结局卡标题 */
  endingTitle?: string;
  /** 结局卡正文 */
  endingBody?: string;
}

export interface Story {
  id: string;
  title: string;
  subtitle: string;
  start: string;
  /** 数值初始值 */
  stats: Record<string, number>;
  /** 数值显示名 */
  statLabels: Record<string, string>;
  nodes: Record<string, StoryNode>;
}

export interface HistoryEntry {
  nodeId: string;
  choiceId?: string;
  choiceText?: string;
  caption?: string;
  at: number;
}

export interface GameState {
  storyId: string;
  nodeId: string;
  flags: Record<string, boolean>;
  stats: Record<string, number>;
  history: HistoryEntry[];
  startedAt: number;
  updatedAt: number;
}

export interface SaveSlot {
  slot: number;
  label: string;
  state: GameState;
  preview: string;
}

export interface Settings {
  volume: number;
  captionSize: "s" | "m" | "l";
}

export type Screen =
  | { name: "title" }
  | { name: "play" }
  | { name: "ending"; nodeId: string };
