# 零点接头 · 互动影游外壳

桌面优先的真人互动影游播放器。内容与程序分离：改 JSON、丢媒体文件即可加一场戏。

内置短篇原著演示，无需任何实拍素材即可开玩。

## 运行

需要 Node 18 或更高。媒体已预生成。重做占位画面见 scripts 目录。

安装依赖后启动开发服务器，浏览器打开终端提示的地址（默认端口 5173）。

另提供生产构建、预览与单元测试脚本，见 package.json。

建议窗口 1280x720 或 1920x1080。画面固定十六比九。

## 操作

- 数字键 1 到 4：选择对应选项
- 空格：跳过当前视频或静帧
- Esc：暂停菜单（存档、读档、设置）

游戏内右上角（鼠标移动后出现）：跳过、记录、设置、菜单。
标题页：开始游戏 / 继续游戏（读取自动存档）/ 设置。
每次作出选择会写入浏览器本地存储自动存档；暂停菜单提供三个手动存档位。

## 用自己的视频或图片替换演示

1. 把文件放进 public/media/（mp4、jpg、png、webp）。
2. 打开 public/story.json，改对应节点的 media 字段为文件名。
3. 视频节点 type 设为 video；静帧 type 设为 still 并给 duration（秒）。静帧会自动缓慢推镜。
4. 刷新浏览器即可，无需改代码。

不要用外链。媒体必须是 public/media 下的本地文件。

## 故事图 schema

public/story.json 根对象：

- id：故事标识，存档会记录
- title / subtitle：标题页文案
- start：起始节点 id
- stats：数值初值（如 trust、suspicion）
- statLabels：数值中文名
- nodes：id 到节点的字典

节点字段：id、type（still、video、ending）、media（public/media 文件名）、duration（静帧秒数）、caption（底部旁白）、location（左上角地点）、choices（二至四个选项）、endingTitle / endingBody（仅结局）。

选项字段：id、text、next、require（可见条件）、setFlags、clearFlags、inc（数值增减）、nextIf（应用效果之后按条件改下一节点，从上到下第一条命中）。

require 可含 flags（须全真）、notFlags（须全假）、min、max。

加一场戏等于：加一个 node，在 public/media 放一个文件，再从某选项的 next 指过去。

## 演示故事

《零点接头》。一九九四年沿海小城，交通员「灰羽」必须在零点把缩微胶片送到废弃红星影院。接头人可能是老周，也可能是一场局。

三条分岔：背暗号或先观察；相信红裙女人或拒绝；真胶片或空胶片。

主要结局：

- 影子：脱身，线还在，灰羽从名册上消失。
- 落网：胶片被摊在灯下，零点那条线到此为止。
- 倒钩：空胶片被对方当真，你把钩子留在雨里。

占位媒体由 ffmpeg 在本目录内生成（暗色渐变加中文场记），无外链、无真人照片、无版权影像。

## 技术

Vite、React、TypeScript。无后端、无统计、无 Steamworks。存档仅在本机浏览器存储。

## 命令一览

在本目录执行：

    npm install
    npm run dev
    npm run build
    npm test

开发服务器默认 0.0.0.0 端口 5173。
