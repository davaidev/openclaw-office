## ADDED Requirements

### Requirement: 扁平化等距家具 SVG 组件

系统 SHALL 提供一组扁平化等距风格的 SVG React 组件，用于在 2D 平面图中渲染办公室家具。每个组件 SHALL 接收位置坐标（x, y）和可选的尺寸/颜色参数，返回一个 `<g>` 元素包裹的 SVG 路径组合。所有家具组件 SHALL 使用一致的等距视角（约 30° 俯视角度的 2D 近似）。

#### Scenario: 渲染工位桌面
- **WHEN** FloorPlan 组件渲染固定工位区
- **THEN** 每个已分配的工位位置 SHALL 渲染一个 Desk 组件，包含桌面矩形（带圆角和阴影效果）和桌面上的装饰元素（显示器/笔记本轮廓），颜色与当前主题（light/dark）匹配

#### Scenario: 渲染办公椅
- **WHEN** FloorPlan 组件渲染工位
- **THEN** 每个 Desk 旁边 SHALL 渲染一个 Chair 组件，表现为简化的俯视办公椅形状（圆形座垫 + 靠背暗示），与 Desk 保持合理的空间关系

#### Scenario: 渲染会议圆桌
- **WHEN** 会议区被渲染
- **THEN** 会议区中心 SHALL 渲染一个 MeetingTable 组件，表现为圆形桌面（带径向渐变和阴影），直径根据当前协作 Agent 数量动态调整（最小 120px，最大 200px）

#### Scenario: 渲染休息区家具
- **WHEN** 休息区被渲染
- **THEN** 休息区 SHALL 包含至少 2 个 Sofa 组件（不同朝向）、2-3 个 Plant 组件、和 1-2 个 CoffeeCup 组件，共同营造休闲氛围

#### Scenario: 暗色主题适配
- **WHEN** 用户切换到暗色主题（theme === "dark"）
- **THEN** 所有家具组件的填充色和阴影效果 SHALL 切换为暗色系配色（桌面变深色、阴影加重、装饰元素亮度降低）

### Requirement: 家具组件性能优化

家具组件 SHALL 使用 `React.memo` 包裹，防止在 Agent 状态变化时触发不必要的重渲染。家具层 SHALL 仅在以下条件变化时重新渲染：Agent 数量变化导致工位数变化、主题切换、Zone 尺寸变化。

#### Scenario: Agent 状态变化不触发家具重渲染
- **WHEN** 某个 Agent 的 status 从 idle 变为 thinking
- **THEN** 家具组件 SHALL NOT 重新渲染（通过 React DevTools 可验证渲染计数不变）

#### Scenario: Agent 增减触发工位家具更新
- **WHEN** 新 Agent 通过 initAgents 或 addAgent 加入
- **THEN** 对应 Zone 的家具层 SHALL 增加一组新的 Desk + Chair 工位单元

### Requirement: 工位单元复合组件

系统 SHALL 提供 DeskUnit 复合组件，将 Desk + Chair + AgentAvatar 组合为一个逻辑单元。DeskUnit SHALL 接收 `agent: VisualAgent | null` 参数，agent 为 null 时渲染空桌位（仅桌椅，无头像）。

#### Scenario: 有 Agent 的工位
- **WHEN** DeskUnit 接收到一个 VisualAgent 实例
- **THEN** SHALL 渲染桌面、椅子和 Agent 头像（AgentAvatar），头像位于椅子上方，且头像具有交互能力（点击选中、hover 提示）

#### Scenario: 空工位
- **WHEN** DeskUnit 的 agent 参数为 null
- **THEN** SHALL 仅渲染桌面和空椅子，不显示头像，表现为"空闲工位"
