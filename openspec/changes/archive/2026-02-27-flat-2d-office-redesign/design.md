## Context

当前 2D 平面图（`FloorPlan.tsx`）使用纯 SVG 矩形作为四个区域背景，每个 Agent 以 32px 圆圈 + Lucide Bot 图标表示（`AgentDot.tsx`）。Zone 定义在 `constants.ts` 中为固定的 1200×700 SVG 坐标系中的四个矩形区域。Agent 位置通过 `position-allocator.ts` 的 4×3 网格分配。视觉层级单薄——无家具、无空间感、无工作场景氛围。

目标设计（参考图）展示了一个扁平化等距（flat isometric）俯视视角的数字办公室：桌椅家具提供空间上下文，Agent 以拟人化头像坐在工位上，会议区有大圆桌和围坐的 Agent，休息区有沙发和绿植。Agent 工作状态通过名称标签、状态色环和动画清晰表达。

已有基础设施可复用：
- `SvgAvatarData`（`avatar-generator.ts`）可用于生成确定性的 Agent 面孔
- Zustand Store 中的 `VisualAgent.zone` / `VisualAgent.status` 提供完整的状态数据
- `position-allocator.ts` 的网格分配逻辑可扩展为"桌+椅"单元分配
- `SpeechBubbleOverlay` 可继续作为 HTML overlay 使用
- `ConnectionLine` 的贝塞尔曲线逻辑可增强视觉效果

## Goals / Non-Goals

**Goals:**
- 将 2D 平面图从"简单矩形+圆点"升级为"扁平化等距风格的数字办公室"，具有桌椅家具、拟人化头像、状态动画
- 保持现有数据流不变（Store → 组件），仅替换渲染层
- Agent 数量从 1 到 50+ 时，布局自适应且保持可读性
- 每种 Agent 状态（idle / thinking / tool_calling / speaking / error / spawning）有清晰可区分的视觉表达
- Sub-Agent 与父 Agent 的关系通过视觉层级表达（子 Agent 在热工位区，与父 Agent 有连线）
- 性能：50 个 Agent 时保持 ≥30fps

**Non-Goals:**
- 不改变 3D 模式（`office-3d/` 组件保持不变）
- 不改变 Store 数据模型或 Gateway 事件处理逻辑
- 不引入新的外部依赖库（纯 SVG + CSS 实现）
- 不做真正的 2.5D 透视投影（使用简单的等距变换近似即可）
- 不做 Agent 拖拽交互（Agent 位置仍由系统自动分配）

## Decisions

### D1: 家具渲染方案 — 内联 SVG 组件 vs 外部 SVG 资源文件

**选择：内联 SVG React 组件**

将桌子、椅子、圆桌、沙发、绿植等家具作为 React 函数组件实现，每个组件返回 `<g>` 元素包裹的 SVG 路径。

- 优点：与 React 渲染管线一致，可通过 props 控制颜色/大小/旋转；无额外网络请求；AI 可直接编写和修改
- 对比方案：外部 `.svg` 文件通过 `<use>` 引用——灵活性差，无法动态配色；加载管理复杂
- 对比方案：PNG sprite sheet——无法缩放，文件体积大

**家具组件清单：**
| 组件名 | 用途 | 尺寸约 |
|--------|------|--------|
| `Desk` | 工位桌面（含显示器/笔记本等暗示） | 120×80 |
| `Chair` | 办公椅（俯视扁平化） | 40×40 |
| `MeetingTable` | 圆形会议桌 | r=80 |
| `Sofa` | 双人/三人沙发 | 140×60 |
| `Plant` | 绿植装饰 | 30×40 |
| `CoffeeCup` | 咖啡杯装饰 | 15×15 |

### D2: Agent 表现形态 — 增强型头像 vs 全身小人

**选择：圆形头像 + 名称标签 + 状态色环**

Agent 使用 40px 圆形头像（利用 `SvgAvatarData` 生成确定性面孔的内联 SVG），下方显示名称标签，圆形边框颜色表示当前状态。

- 优点：信息密度高（同时传达身份 + 名称 + 状态）；在 Agent 数量多时不占过多空间；实现复杂度适中
- 对比方案：全身卡通小人——需要大量美术素材，不同姿态需要独立动画，实现成本过高
- 对比方案：保持现有 Bot 图标——所有 Agent 长得一样，无法区分身份

**头像结构：**
```
<g> (AgentAvatar)
  ├── <circle> 状态色环（外圈，带动画）
  ├── <clipPath> + <circle> 头像裁切
  │   └── <g> 面部 SVG（利用 SvgAvatarData 生成的脸型/发型/眼睛/肤色）
  ├── <foreignObject> 名称标签（圆角背景 + 文字）
  └── <foreignObject> 状态指示器（thinking动画/tool名称/错误图标）
</g>
```

### D3: 区域布局策略 — 固定比例 vs 动态分配

**选择：基础固定 + Agent 密度自适应**

保持 4 区域 2×2 布局的基础框架（这是办公室的物理空间概念，不应变化），但区域内的工位数量和排列根据实际 Agent 数量动态调整：

- 固定工位区（desk）：默认 2 列布局，每列 Agent 按行向下排列，间距随 Agent 数量弹性调整
- 会议区（meeting）：中心圆桌 + 环形座位，座位数等于协作 Agent 数
- 热工位区（hotDesk）：Sub-Agent 的动态工位，与 desk 类似但更紧凑
- 休息区（lounge）：装饰为主（沙发、绿植），仅在特定条件下放置 Agent

**工位单元（DeskUnit）：** 一个 `Desk` + 一个 `Chair` + 一个 `AgentAvatar` 组成逻辑单元，整体宽度约 140px，高度约 120px（含名称标签）。

### D4: 状态动画实现 — SVG SMIL vs CSS Animation vs JS 帧动画

**选择：CSS Animation (via class toggle)**

使用 CSS `@keyframes` 定义动画，通过 Agent 状态作为 CSS class 切换触发。SVG 元素通过 `foreignObject` 包裹的 HTML div 应用 CSS 动画。

- 优点：性能好（GPU 加速）、声明式、与 Tailwind 体系兼容、易于调试
- 对比方案：SVG SMIL——浏览器兼容性不一致，调试困难
- 对比方案：JS requestAnimationFrame——手动管理复杂，50+ Agent 同时动画时帧率风险

**动画定义：**
| 状态 | 动画效果 | CSS 实现 |
|------|---------|---------|
| `idle` | 静态绿色环 | 无动画 |
| `thinking` | 蓝色脉冲呼吸 | `@keyframes pulse { 0%,100% { opacity:0.6 } 50% { opacity:1 } }` 1.5s infinite |
| `tool_calling` | 橙色旋转环 | `@keyframes spin { to { transform: rotate(360deg) } }` 2s linear infinite |
| `speaking` | 紫色光晕扩散 | `@keyframes glow { 0%,100% { box-shadow: 0 0 4px } 50% { box-shadow: 0 0 12px } }` |
| `error` | 红色闪烁 | `@keyframes blink { 0%,100% { opacity:1 } 50% { opacity:0.4 } }` 0.8s infinite |
| `spawning` | 青色缩放入场 | `@keyframes spawn { from { transform:scale(0); opacity:0 } to { transform:scale(1); opacity:1 } }` 0.5s ease-out |

### D5: 家具布局坐标 — 相对于 Zone 还是绝对坐标

**选择：相对于 Zone 原点的偏移量**

家具位置和工位位置均以 Zone 的 `(x, y)` 为原点进行偏移计算。这样当未来需要调整 Zone 尺寸时，只需改 Zone 定义，内部布局自动跟随。

`position-allocator.ts` 将扩展为返回"工位单元"位置（包含桌+椅+头像的锚点坐标），而非简单的点坐标。

### D6: SVG 层级结构

```
<svg viewBox="0 0 1200 700">
  <defs> ... (滤镜、渐变、clipPath) </defs>

  <!-- Layer 0: 地板背景 -->
  <rect> 整体背景 </rect>

  <!-- Layer 1: 区域背景 -->
  <g id="zones"> 四个区域矩形 + 标签 </g>

  <!-- Layer 2: 家具装饰 -->
  <g id="furniture">
    <g id="desk-zone-furniture"> 工位桌椅 </g>
    <g id="meeting-zone-furniture"> 圆桌 </g>
    <g id="hotdesk-zone-furniture"> 临时桌椅 </g>
    <g id="lounge-zone-furniture"> 沙发、绿植 </g>
  </g>

  <!-- Layer 3: 协作连线 -->
  <g id="connections"> ConnectionLine 组件 </g>

  <!-- Layer 4: Agent 头像（最顶层，保证可交互） -->
  <g id="agents"> AgentAvatar 组件 </g>
</svg>

<!-- Layer 5: HTML Overlay（speech bubbles, tooltips） -->
<div> SpeechBubbleOverlay / 状态面板 </div>
```

## Risks / Trade-offs

- **[SVG 复杂度与性能]** 家具 SVG 路径增加 DOM 节点数（估算 50 Agent 场景约 2000+ SVG 节点）→ 对于静态家具使用 `React.memo` 避免重渲染；家具层只在 Agent 数量变化时重算
- **[头像面部 SVG 渲染成本]** 每个 Agent 的面部由 5-6 个 SVG 元素组成，50 Agent = 300+ 面部元素 → 可接受，SVG 在此规模下性能远优于 Canvas；必要时可降级为纯色圆形 + 首字母
- **[等距视角的交互遮挡]** 等距布局中下方的元素可能被上方元素遮挡 → 通过合理的间距和 z-index（SVG 绘制顺序）管理；Agent 头像始终在最上层
- **[Agent 数量极端值]** 超过 50 个 Agent 时工位区可能拥挤 → 提供紧凑模式（缩小工位单元），或自动隐藏家具仅保留头像
- **[CSS 动画叠加]** 多个 Agent 同时有动画时可能影响帧率 → 使用 `will-change: transform, opacity` 提示 GPU 加速；动画仅对可见区域 Agent 生效
- **[已有测试兼容]** `AgentDot.test.tsx` 针对现有 AgentDot 组件 → 需要更新测试以匹配新的 AgentAvatar 组件 DOM 结构
