# 零点接头 · FMV 互动影游

真人互动影游项目仓库，包含两个目录：

| 目录 | 是什么 | 日常开发 |
|---|---|---|
| `fmv-shell/` | 游戏本体：Vite + React/TS + Electron 桌面播放器 | 绝大部分开发都在这里 |
| `media-ai/` | AI 素材生产管线：TTS 配音、图生视频、合成脚本与中间产物 | 一般不用动 |

## 快速开始（游戏本体）

需要 Node 18 及以上。

```bash
cd fmv-shell
npm install
npm run dev        # 开发模式，浏览器打开终端提示的地址
```

生产构建、Electron 桌面 .app 打包见 `fmv-shell/README.md` 与 `fmv-shell/electron-builder.yml`。

macOS 分发提示：.app 传给他人（微信/AirDrop）后若提示「文件已损坏」，是 electron-builder
签名不完整叠加 quarantine 属性所致，完整重签即可解决：

```bash
codesign --force --deep -s - "零点接头.app"
```

## 改剧情 / 换素材（不需要 media-ai）

1. 把新素材（mp4 / jpg / png / webp）放进 `fmv-shell/public/media/`
2. 打开 `fmv-shell/public/story.json`，改对应节点的 `media` 字段为文件名

操作方式、存档机制详见 `fmv-shell/README.md`。

## media-ai 目录说明

内部 AI 素材生产管线，脚本依赖本机服务与配置，仅用于重新生成配音 / 视频；
成品已全部就位于 `fmv-shell/public/media/`，改剧情换素材用不到它。
