## ADDED Requirements

### Requirement: 拟人化 Agent 头像组件

系统 SHALL 提供 AgentAvatar 组件替代现有的 AgentDot，每个 Agent 以圆形头像 + 名称标签 + 状态色环形式呈现。AgentAvatar SHALL 使用 `generateSvgAvatar(agentId)` 生成的 `SvgAvatarData`（脸型、发型、眼型、肤色、发色、衬衫色）在 SVG 内联渲染确定性面孔。

#### Scenario: 渲染 Agent 面部头像
- **WHEN** FloorPlan 渲染一个 VisualAgent
- **THEN** SHALL 显示一个 40px 圆形头像，内部包含基于 SvgAvatarData 的简化面部图形（椭圆/圆形脸、发型轮廓、眼睛），使用 clipPath 裁剪为圆形

#### Scenario: 头像确定性一致
- **WHEN** 同一 agentId 的 Agent 在不同时间被渲染
- **THEN** 头像外观 SHALL 完全一致（相同脸型、发型、配色）

#### Scenario: 区分 Sub-Agent 与主 Agent
- **WHEN** 一个 VisualAgent 的 isSubAgent 为 true
- **THEN** 头像 SHALL 在右下角显示一个小型角标（如闪电或链接图标），以视觉区分临时子 Agent

### Requirement: 名称标签

每个 AgentAvatar 下方 SHALL 显示 Agent 名称标签。标签 SHALL 使用 `foreignObject` 渲染 HTML 元素，支持自适应宽度和毛玻璃背景效果。

#### Scenario: 正常长度名称
- **WHEN** Agent 名称长度 ≤ 12 个字符
- **THEN** 名称标签 SHALL 完整显示，居中对齐于头像下方

#### Scenario: 过长名称截断
- **WHEN** Agent 名称长度 > 12 个字符
- **THEN** 名称标签 SHALL 截断并显示省略号（...），hover 时通过 title 属性显示完整名称

### Requirement: 状态色环

AgentAvatar 的圆形边框（外圈）SHALL 使用 `STATUS_COLORS[agent.status]` 对应的颜色渲染，宽度为 3px。色环颜色 SHALL 随 Agent 状态实时变化。

#### Scenario: 空闲状态
- **WHEN** Agent status 为 idle
- **THEN** 色环颜色 SHALL 为 `#22c55e`（绿色），无动画

#### Scenario: 思考状态
- **WHEN** Agent status 为 thinking
- **THEN** 色环颜色 SHALL 为 `#3b82f6`（蓝色），且色环有脉冲动画效果

#### Scenario: 工具调用状态
- **WHEN** Agent status 为 tool_calling
- **THEN** 色环颜色 SHALL 为 `#f97316`（橙色），头像下方 SHALL 额外显示当前工具名称（agent.currentTool.name）的小标签

#### Scenario: 错误状态
- **WHEN** Agent status 为 error
- **THEN** 色环颜色 SHALL 为 `#ef4444`（红色），且有闪烁动画效果

### Requirement: 头像交互

AgentAvatar SHALL 支持点击选中和 hover 提示。

#### Scenario: 点击选中
- **WHEN** 用户点击某个 AgentAvatar
- **THEN** SHALL 调用 `selectAgent(agent.id)`，该 Agent 的头像 SHALL 显示选中态（外圈扩大 + 发光效果），且右侧面板显示该 Agent 详情

#### Scenario: Hover 提示
- **WHEN** 用户将鼠标悬停在 AgentAvatar 上
- **THEN** SHALL 在头像上方显示工具提示，内容为 `{agent.name} · {statusLabel}`
