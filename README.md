# 🔮 Ether Tarot

## Windows 快捷启动

在项目根目录运行：

```powershell
.\start-local.ps1
```

脚本会读取 `.env` 中的 `PORT`（未配置时使用 `8090`），自动强制关闭占用该端口的程序，然后在当前窗口执行 `npm start`。请确认该端口没有被重要服务使用。按 `Ctrl+C` 可以停止项目。

`.env` 示例：

```dotenv
PORT=8090
DEEPSEEK_API_KEY=你的密钥
```

如果 PowerShell 的执行策略阻止脚本运行，使用：

```powershell
powershell -ExecutionPolicy Bypass -File .\start-local.ps1
```

## 受控 AI 星语（DeepSeek）

项目支持在抽牌后，根据固定主题、牌面、正逆位和本地标准牌义生成简短中文解读。浏览器不接触 API Key，也不接受自由文本问题；生成内容仅供娱乐与自我反思。

要求 Node.js 20 或更高版本。安装并在 PowerShell 中启动：

```powershell
npm install
$env:DEEPSEEK_API_KEY='你的新 DeepSeek API Key'
npm start
```

然后访问 [http://localhost:8090](http://localhost:8090)。默认模型为 `deepseek-v4-pro`，使用非思考模式并将输出限制为 `max_tokens: 500`；可用 `$env:DEEPSEEK_MODEL` 覆盖，用 `$env:PORT` 修改端口。运行测试使用 `npm test`。

不要把真实密钥写入仓库或前端代码。`.env.example` 仅列出变量名；服务直接读取进程环境变量。未配置密钥或上游不可用时，抽牌和固定牌义仍然可用。

### EdgeOne Makers

项目在 `cloud-functions/api/reading.js` 提供 Makers Cloud Function。部署前请在 Makers 项目环境变量中配置 `DEEPSEEK_API_KEY`，可选配置 `DEEPSEEK_MODEL`；不要提交真实密钥。

使用 Makers CLI 本地运行：

```bash
PAGES_SOURCE=skills edgeone makers dev --name tarot-app --skip-env-sync
```

然后通过 [http://127.0.0.1:8088/](http://127.0.0.1:8088/) 访问。请勿使用 `file://` 打开页面，否则 Cloud Function 路由不可用。线上环境的 `DEEPSEEK_API_KEY` 和 `DEEPSEEK_MODEL` 应配置在 Makers 项目环境变量中，不要提交真实 `.env`。

<p align="center">
  一款通过手势操控的沉浸式浏览器塔罗体验。<br>
  借助 MediaPipe Hands 与 Three.js，在完整的 78 张塔罗牌中抽取、翻开并解读属于你的牌。
</p>

<p align="center">
  <img alt="JavaScript" src="https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=000">
  <img alt="Three.js" src="https://img.shields.io/badge/Three.js-WebGL-000?logo=threedotjs&logoColor=fff">
  <img alt="MediaPipe" src="https://img.shields.io/badge/MediaPipe-Hands-00897B?logo=google&logoColor=fff">
  <img alt="HTML5" src="https://img.shields.io/badge/HTML5-Single_Page-E34F26?logo=html5&logoColor=fff">
</p>

![Ether Tarot 启动界面](docs/main.png)

## 项目简介

Ether Tarot 将传统的塔罗抽牌仪式转化为无需触碰屏幕的互动体验。摄像头画面在浏览器本地通过 MediaPipe Hands 处理，识别结果会转换为一组简单的手势指令，并映射到 Three.js 三维场景中，让用户能够悬停、拿起、移动和翻开卡牌。

项目将实时计算机视觉输入与 3D 渲染相结合，同时提供完整的鼠标操作模式；在摄像头不可用、权限被拒绝或不便使用手势时，仍然可以完成抽牌。

## 体验展示

<table>
  <tr>
    <td width="50%" align="center"><strong>抽取卡牌</strong></td>
    <td width="50%" align="center"><strong>查看结果</strong></td>
  </tr>
  <tr>
    <td><img src="docs/mid-card.png" alt="通过手势抽取塔罗牌"></td>
    <td><img src="docs/result.png" alt="翻开的塔罗牌及抽牌历史"></td>
  </tr>
  <tr>
    <td align="center">捏合手指拿起卡牌，并在三维空间中移动。</td>
    <td align="center">确认抽牌后，查看牌面方向和对应含义。</td>
  </tr>
</table>

## 当前功能

- **小牌四元素特效**——权杖使用火焰上扬与闪烁，圣杯使用水流环绕与波纹，宝剑使用风流螺旋与流线，金币使用土粒沉降与稳定环绕。逆位保持原元素，但流向反转且扰动更强；粒子数量会按设备能力在 800、250、80 三档间选择。22 张大牌的逐牌专属特效已记录为后续设计，本版本不套用通用元素效果。

- **非接触式交互**——使用 MediaPipe 手部关键点驱动完整的抽牌流程。
- **实时 3D 场景**——通过 Three.js 渲染牌组、灯光、雾效、粒子、卡牌移动与翻牌动画。
- **三种核心手势**——张开手掌移动和悬停，捏合手指拿取卡牌，握拳确认抽牌。
- **完整塔罗牌组**——包含 22 张大阿卡那与 56 张小阿卡那，共计 78 张牌。
- **正位与逆位结果**——每次抽牌都会独立决定牌面方向并显示相应含义。
- **鼠标备用模式**——无法使用摄像头时，可随时切换至鼠标操作。
- **会话抽牌历史**——在页面历史区域查看本次会话已经抽出的牌及其方向。

## 交互流程

```text
摄像头画面
    ↓
MediaPipe 手部关键点
    ↓
手势分类（张开 / 捏合 / 握拳）
    ↓
归一化指针坐标
    ↓
Three.js 射线检测与卡牌状态
    ↓
抽取 → 移动 → 翻开 → 记录
```

| 操作方式 | 对应动作 |
| --- | --- |
| ✋ 张开手掌 | 移动指针并悬停在牌组上 |
| 👌 捏合手指 | 拿起并拖动卡牌 |
| ✊ 握拳 | 确认选择并翻开解读 |
| 🖱️ 鼠标模式 | 在不使用摄像头时移动、按下、拖动和释放 |

## 技术实现

### 手势输入

MediaPipe Hands 通过浏览器摄像头追踪一只手。程序计算特定手部关键点之间的距离，将其转换为确定的手势状态，再将手掌位置归一化为 Three.js 场景中的指针坐标。

### 3D 交互

Three.js 的射线检测器会把手势指针映射到场景对象。应用内部维护剩余牌组、当前悬停卡牌、手持卡牌、输入模式、动画锁定状态和抽牌结果等交互状态。

### 视觉反馈

灯光、指数雾效、叠加粒子、卡牌旋转和翻牌过渡用于强化不同交互阶段。界面会分别显示摄像头状态、已识别手势、剩余牌数、当前牌义和抽牌历史。

## 技术栈

| 技术 | 用途 |
| --- | --- |
| JavaScript / HTML / CSS | 应用状态、界面与交互逻辑 |
| [Three.js](https://threejs.org/) | WebGL 场景、几何体、材质、动画与射线检测 |
| [MediaPipe Hands](https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker) | 实时手部关键点检测 |
| 浏览器媒体 API | 摄像头访问与视频帧处理 |
| PowerShell `HttpListener` | 轻量级本地开发服务器 |

## 本地运行

### 环境要求

- 支持 WebGL 和摄像头访问的现代浏览器
- PowerShell，或已安装 Node.js 与 npm
- 手势模式需要可用的摄像头

### 1. 克隆项目

```bash
git clone https://github.com/Fengfengex/tarot-app.git
cd tarot-app
```

### 2. 启动本地服务器

使用项目内置的 PowerShell 服务器：

```powershell
.\server.ps1
```

随后访问 [http://localhost:8080](http://localhost:8080)。

也可以使用 Node.js：

```bash
npm install
npm start
```

浏览器提示时请允许摄像头访问。如果摄像头不可用，可通过左上角控制区域切换至鼠标模式。

> 摄像头 API 通常要求页面运行在安全上下文中。请通过 `localhost` 或 HTTPS 访问项目，不要直接双击打开 `index.html`。

## 当前开发状态

当前仓库中的 JavaScript 单页版本可以运行，核心的 3D 抽牌、手势识别、鼠标备用操作、正逆位结果和抽牌历史已经实现。

仓库同时已经完成下一版体验的设计文档与实施计划，但新版代码尚未开始迁移。规划中的 Vite、TypeScript、自动化测试、模块化状态机、完整中文牌义数据、稳定手势过滤、响应式界面和自动部署等能力，均不属于当前版本的已完成功能。

相关文档：

- [新版体验设计](docs/superpowers/specs/2026-08-01-tarot-experience-redesign-design.md)
- [新版实施计划](docs/superpowers/plans/2026-08-01-tarot-experience-redesign.md)

## 后续路线图

后续开发将按照现有实施计划逐步推进：

1. 将项目迁移到 Vite、TypeScript，并建立 Vitest 与 ESLint 验证流程。
2. 补全 78 张 Rider–Waite 塔罗牌的中英文名称及正逆位中文牌义。
3. 使用有限状态机统一手势、鼠标和触摸输入的抽牌规则。
4. 提升手势稳定性，加入连续帧确认、停留时间判断和指针平滑。
5. 重建卡牌轮盘、翻牌、粒子归档与响应式中文界面。
6. 增加异常恢复、WebGL 降级方案、静态部署与跨设备验收。

## 项目结构

```text
tarot-app/
├── index.html          # Three.js 场景、手势流程、界面和应用状态
├── tarot_img/          # 大阿卡那与小阿卡那牌面资源
├── docs/               # 项目截图、设计文档与实施计划
├── server.ps1          # 轻量级 localhost 服务器
├── package.json        # 项目元数据和开发命令
└── README.md           # 中文项目说明
```

## 项目仓库

源代码：[github.com/Fengfengex/tarot-app](https://github.com/Fengfengex/tarot-app)

---

<p align="center">
  本项目用于探索手势驱动界面、实时图形渲染与浏览器互动体验。
</p>
