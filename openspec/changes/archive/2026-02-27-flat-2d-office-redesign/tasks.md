## 1. 基础设施与常量更新

- [x] 1.1 更新 `src/lib/constants.ts` 中的 Zone 尺寸常量，为新的家具布局留出合理空间（调整 Zone padding / margin 参数）
- [x] 1.2 在 `src/lib/constants.ts` 中新增家具尺寸常量（DESK_WIDTH, DESK_HEIGHT, CHAIR_SIZE, MEETING_TABLE_RADIUS 等）和工位单元尺寸（DESK_UNIT_WIDTH, DESK_UNIT_HEIGHT）
- [x] 1.3 在 `src/styles/globals.css` 中新增状态动画的 CSS keyframes（pulse, spin, glow, blink, spawn, fadeOut）

## 2. 家具 SVG 组件（flat-office-furniture）

- [x] 2.1 创建 `src/components/office-2d/furniture/Desk.tsx` — 扁平化等距工位桌面 SVG 组件（含桌面、显示器/笔记本轮廓装饰），支持 light/dark 主题
- [x] 2.2 创建 `src/components/office-2d/furniture/Chair.tsx` — 俯视办公椅 SVG 组件（圆形座垫 + 靠背），支持 light/dark 主题
- [x] 2.3 创建 `src/components/office-2d/furniture/MeetingTable.tsx` — 圆形会议桌 SVG 组件（径向渐变 + 阴影），支持动态半径
- [x] 2.4 创建 `src/components/office-2d/furniture/Sofa.tsx` — 沙发 SVG 组件（支持不同朝向），支持 light/dark 主题
- [x] 2.5 创建 `src/components/office-2d/furniture/Plant.tsx` — 绿植装饰 SVG 组件
- [x] 2.6 创建 `src/components/office-2d/furniture/CoffeeCup.tsx` — 咖啡杯装饰 SVG 组件
- [x] 2.7 创建 `src/components/office-2d/furniture/index.ts` — barrel export 所有家具组件

## 3. 工位单元组件（DeskUnit）

- [x] 3.1 创建 `src/components/office-2d/DeskUnit.tsx` — 复合组件，组合 Desk + Chair + AgentAvatar（或空桌位），接收 `agent: VisualAgent | null` 和位置参数
- [x] 3.2 使用 React.memo 包裹 DeskUnit 和所有家具组件，确保 Agent 状态变化时家具不重渲染

## 4. 增强版 Agent 头像组件（rich-agent-avatar）

- [x] 4.1 创建 `src/components/office-2d/AgentAvatar.tsx` — 新头像组件，包含：圆形 clipPath 面部 SVG（基于 SvgAvatarData）、状态色环（3px 边框）、名称标签
- [x] 4.2 实现面部 SVG 渲染逻辑：根据 SvgAvatarData 的 faceShape/hairStyle/eyeStyle/skinColor/hairColor 渲染简化面部图形
- [x] 4.3 实现名称标签：foreignObject + HTML div，支持文字截断（>12 字符显示 ...），毛玻璃背景
- [x] 4.4 实现 Sub-Agent 角标：isSubAgent 为 true 时在头像右下角显示小型链接图标
- [x] 4.5 实现工具名称标签：tool_calling 状态时在头像旁显示 currentTool.name 的橙色小标签
- [x] 4.6 实现交互：点击 selectAgent、hover 显示工具提示（name + statusLabel）

## 5. 状态动画系统（agent-state-animation）

- [x] 5.1 实现 thinking 动画：色环蓝色脉冲 + 右上方三点动画指示器
- [x] 5.2 实现 tool_calling 动画：色环橙色 + 旋转效果 + 工具名称标签（淡入/淡出）
- [x] 5.3 实现 speaking 动画：色环紫色光晕 + 对话气泡图标指示
- [x] 5.4 实现 error 动画：色环红色闪烁 + 右上方红色感叹号角标
- [x] 5.5 实现 spawning 入场动画：缩放 0→1（0.5s ease-out）+ 青色主题
- [x] 5.6 实现退场动画：缩放 1→0（0.3s ease-in）
- [x] 5.7 实现状态过渡的 CSS transition（300ms 颜色过渡）

## 6. 动态区域布局（dynamic-zone-layout）

- [x] 6.1 重构 `src/lib/position-allocator.ts`：返回"工位单元"坐标而非简单点坐标，包含桌/椅/头像三者的锚点
- [x] 6.2 实现 desk zone 自适应网格：根据 Agent 数量动态计算列数和行数（1-4→2列, 5-8→2列多行, 9-12→3列, 13+→4列）
- [x] 6.3 实现位置稳定性：Agent 增减时已有 Agent 的工位位置不跳变（基于 agentId hash 的确定性分配）
- [x] 6.4 实现 hotDesk zone 布局：Sub-Agent 的紧凑型工位分配
- [x] 6.5 实现会议区动态座位：基于协作 Agent 数量的圆形座位布局，空桌时显示空椅子

## 7. FloorPlan 主组件重构

- [x] 7.1 重构 `src/components/office-2d/FloorPlan.tsx`：按新的 SVG 层级结构组织（地板→区域→家具→连线→Agent）
- [x] 7.2 实现区域背景增强：更细腻的渐变、圆角、阴影效果
- [x] 7.3 渲染固定工位区：遍历 Agent 列表，为每个 Agent 生成 DeskUnit，空位渲染空桌椅
- [x] 7.4 渲染会议区：中心 MeetingTable + 协作 Agent 环形排列
- [x] 7.5 渲染热工位区：Sub-Agent 的 DeskUnit 列表
- [x] 7.6 渲染休息区：固定布置的 Sofa、Plant、CoffeeCup 装饰
- [x] 7.7 协作连线增强：根据 strength 调整粗细和透明度，高强度连线添加脉冲动画

## 8. SpeechBubble 适配

- [x] 8.1 更新 `src/components/overlays/SpeechBubble.tsx` 的定位逻辑，适配新的 AgentAvatar 头像尺寸和坐标

## 9. 测试更新

- [x] 9.1 更新 `src/components/office-2d/__tests__/AgentDot.test.tsx`，重命名为 AgentAvatar.test.tsx，适配新组件 DOM 结构
- [x] 9.2 为 DeskUnit 组件添加基础渲染测试（有 Agent / 空桌位两种情况）
- [x] 9.3 验证 position-allocator 的新布局逻辑（确保 Agent 增减时位置稳定性）

## 10. 清理与验证

- [x] 10.1 移除旧的 `AgentDot.tsx` 组件（确认所有引用已替换为 AgentAvatar）
- [x] 10.2 运行 `pnpm typecheck` 确保类型安全
- [x] 10.3 运行 `pnpm test` 确保所有测试通过
- [x] 10.4 运行 `pnpm lint` 确保代码规范
- [x] 10.5 使用 dev server 手动验证：4 Agent 场景（idle / thinking / tool_calling / speaking / error 各状态）、Sub-Agent 入场/退场、协作连线、暗色主题切换
