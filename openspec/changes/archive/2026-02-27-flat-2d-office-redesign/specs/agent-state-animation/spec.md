## ADDED Requirements

### Requirement: 思考状态动画

当 Agent status 为 `thinking` 时，SHALL 在头像上显示明确的思考指示。

#### Scenario: thinking 脉冲动画
- **WHEN** Agent status 变为 thinking
- **THEN** AgentAvatar 的状态色环 SHALL 以 1.5 秒周期进行透明度脉冲（0.5 ↔ 1.0），蓝色光晕在色环外 2px 处扩散

#### Scenario: thinking 图标指示
- **WHEN** Agent 处于 thinking 状态
- **THEN** 头像右上方 SHALL 显示一个小型思考指示器（三个小圆点 "..." 的动画，类似打字指示器）

### Requirement: 工具调用状态动画

当 Agent status 为 `tool_calling` 时，SHALL 在头像区域显示当前正在使用的工具信息。

#### Scenario: 显示工具名称标签
- **WHEN** Agent status 为 tool_calling 且 currentTool 不为 null
- **THEN** 头像下方（名称标签之上或一侧）SHALL 显示一个小型标签，内容为工具名称（currentTool.name），标签背景色为橙色（#f97316）

#### Scenario: 工具调用结束
- **WHEN** Agent status 从 tool_calling 转为 thinking 或 idle
- **THEN** 工具名称标签 SHALL 以淡出动画（200ms）消失

### Requirement: 说话状态动画

当 Agent status 为 `speaking` 时，SHALL 在头像上方显示对话指示。

#### Scenario: speaking 对话指示
- **WHEN** Agent status 为 speaking 且有 speechBubble
- **THEN** 头像上方 SHALL 显示语音波纹或对话气泡图标（紫色），配合现有的 SpeechBubbleOverlay 一起展现 Agent 正在输出的内容

#### Scenario: speaking 色环光晕
- **WHEN** Agent status 为 speaking
- **THEN** 状态色环 SHALL 显示紫色（#a855f7）并有轻微的光晕扩散动画（1 秒周期）

### Requirement: 错误状态动画

当 Agent status 为 `error` 时，SHALL 以高可见度的方式警示用户。

#### Scenario: 错误闪烁
- **WHEN** Agent status 为 error
- **THEN** AgentAvatar 的状态色环 SHALL 以 0.8 秒周期进行红色闪烁（opacity 0.4 ↔ 1.0）

#### Scenario: 错误图标
- **WHEN** Agent status 为 error
- **THEN** 头像右上方 SHALL 显示一个红色感叹号角标（⚠），固定可见

### Requirement: Sub-Agent 入场动画

当新 Sub-Agent 被创建时，SHALL 以动画效果呈现其出现。

#### Scenario: 子 Agent 入场
- **WHEN** addSubAgent 创建一个新的 Sub-Agent
- **THEN** 新 Agent 的 AgentAvatar SHALL 以缩放动画从 0 到 1 出现（0.5 秒 ease-out），颜色为 spawning 的青色（#06b6d4）

#### Scenario: 子 Agent 退场
- **WHEN** removeSubAgent 移除一个 Sub-Agent
- **THEN** 该 Agent 的 AgentAvatar SHALL 以缩放动画从 1 到 0 消失（0.3 秒 ease-in），然后从 DOM 中移除

### Requirement: 状态过渡平滑

Agent 状态变化时，色环颜色和动画效果 SHALL 平滑过渡，避免突兀的跳变。

#### Scenario: 从 idle 到 thinking 的过渡
- **WHEN** Agent status 从 idle 变为 thinking
- **THEN** 色环颜色 SHALL 在 300ms 内从绿色平滑过渡到蓝色（CSS transition），脉冲动画同步启动

#### Scenario: 从 tool_calling 到 speaking 的过渡
- **WHEN** Agent status 从 tool_calling 变为 speaking
- **THEN** 色环颜色 SHALL 在 300ms 内从橙色过渡到紫色，工具标签淡出的同时语音指示器淡入
