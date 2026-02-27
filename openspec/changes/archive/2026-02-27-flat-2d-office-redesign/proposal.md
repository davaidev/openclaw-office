## Why

当前 2D Office 平面图采用简单的 SVG 矩形区域 + 圆点图标表示 Agent，视觉表现过于抽象和简陋——四个空荡荡的色块区域（Desk Zone / Meeting Zone / Hot Desk Zone / Lounge Zone）中只有几个小圆点散落其中，缺乏空间氛围感和"数字办公室"的沉浸体验。目标设计（参考图）展示了一个更具拟人感的扁平化俯视平面图：带有等距风格的桌椅家具、Agent 以带名字标签和状态色的头像坐在工位上、会议区有圆桌和多位 Agent 围坐、协作关系通过对话气泡和动态流线可视化表达、休息区有沙发和绿植等装饰元素。这种设计能让用户直观感知"谁在工作、谁在开会、谁在休息"，大幅提升产品的可用性和体验。

## What Changes

- **全面重设计 2D 平面图视觉风格**：将纯色矩形区域替换为带有家具元素（桌子、椅子、圆桌、沙发、绿植、咖啡杯）的扁平化等距俯视场景
- **重设计 Agent 表现形态**：将简单圆点 + Bot 图标替换为带有圆形头像（使用已有的 SvgAvatarData 生成确定性面孔）+ 名称标签 + 状态色环的拟人化角色表示
- **增强工位区**：每个 Agent 坐在独立工位上，工位包含桌面和座椅的扁平化等距插图，Agent 头像悬浮于椅子上方
- **增强会议区**：使用大圆桌 + 环形座位布局，协作中的 Agent 围坐圆桌，头顶显示对话气泡（"..."占位或实际 speechBubble 内容）
- **增强热工位区**：Sub-Agent 出现时动态分配到可用桌位，以"临时工"视觉呈现
- **增强休息区**：Idle 状态 Agent 可可视化移动到休息区的沙发上，配合绿植和咖啡杯等装饰
- **增强状态可视化**：
  - `idle`：绿色状态环 + Agent 在工位上放松姿态
  - `thinking`：蓝色脉冲动画 + 头顶思考指示
  - `tool_calling`：橙色状态环 + 桌面弹出工具名称标签
  - `speaking`：紫色状态环 + 上方 Markdown 气泡
  - `error`：红色闪烁 + 头顶错误标识
  - `spawning`：青色动画 + 子 Agent 从父 Agent 方向滑入
- **协作流线可视化**：Agent 间协作关系通过带箭头的动态曲线连接，线条粗细/亮度反映协作强度
- **动态数量自适应**：Agent 数量从 1 到 100+ 时，工位自动扩展、网格自适应、区域大小可动态调整

## Capabilities

### New Capabilities
- `flat-office-furniture`: 扁平化等距家具 SVG 组件系统——桌子、椅子、圆桌、沙发、绿植等可复用 SVG 组件
- `rich-agent-avatar`: 增强版 Agent 头像组件——圆形头像 + 名称标签 + 状态色环 + 动画效果，替换现有 AgentDot
- `dynamic-zone-layout`: 动态区域布局系统——根据 Agent 数量自适应调整区域大小和工位排列
- `agent-state-animation`: Agent 状态动画系统——thinking 脉冲、speaking 气泡、tool_calling 工具标签、error 闪烁等 CSS 动画

### Modified Capabilities

（无已有 spec 需要修改）

## Impact

- **直接影响的代码**：
  - `src/components/office-2d/FloorPlan.tsx` — 主平面图重写
  - `src/components/office-2d/AgentDot.tsx` — 替换为新 AgentAvatar 组件
  - `src/components/office-2d/ZoneLabel.tsx` — 适配新布局
  - `src/components/office-2d/ConnectionLine.tsx` — 增强协作线条
  - `src/lib/constants.ts` — Zone 尺寸、颜色、网格配置更新
  - `src/lib/position-allocator.ts` — 适配新的家具工位布局
  - `src/components/overlays/SpeechBubble.tsx` — 适配新坐标系
- **新增文件**：
  - `src/components/office-2d/furniture/` — 家具 SVG 组件目录
  - `src/components/office-2d/AgentAvatar.tsx` — 新 Agent 表现组件
  - `src/components/office-2d/StateAnimations.tsx` — 状态动画定义
- **无破坏性变更**：3D 模式、Store、Gateway 连接、侧边栏面板均不受影响
- **样式依赖**：新增 CSS 动画 keyframes（在 globals.css 或 Tailwind 层）
- **i18n**：Zone 名称和状态标签复用现有翻译 key，无需新增
