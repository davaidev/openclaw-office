## ADDED Requirements

### Requirement: 工位区自适应布局

固定工位区（desk zone）SHALL 根据当前主 Agent 数量动态调整工位排列。工位以 DeskUnit 为单位，按网格排列，网格参数根据 Agent 数量自适应：

- 1-4 个 Agent：2 列布局
- 5-8 个 Agent：2 列布局，行数增加
- 9-12 个 Agent：3 列布局
- 13+ 个 Agent：4 列布局，工位单元缩小

工位间距 SHALL 自动计算以充分利用 Zone 内可用空间。

#### Scenario: 4 个 Agent 的工位排列
- **WHEN** 系统有 4 个非 Sub-Agent 的主 Agent
- **THEN** 固定工位区 SHALL 以 2 列 × 2 行排列 4 个 DeskUnit，每个 DeskUnit 包含桌椅和对应的 AgentAvatar

#### Scenario: 新增 Agent 时布局重算
- **WHEN** 通过 addAgent 新增一个主 Agent（总数从 4 增至 5）
- **THEN** 固定工位区 SHALL 重新计算布局为 2 列 × 3 行（第三行仅占一个位置），新 Agent 分配到空闲工位，已有 Agent 的工位位置 SHALL 保持稳定（不因重排而跳变）

#### Scenario: Agent 移除时保持稳定
- **WHEN** 通过 removeAgent 移除一个 Agent
- **THEN** 该工位变为空桌位，其他 Agent 的位置 SHALL NOT 变化

### Requirement: 会议区动态座位

会议区 SHALL 在有 Agent 协作时显示圆桌和环形座位。座位数量 SHALL 等于当前协作 Agent 数量，均匀分布在圆桌周围。无协作 Agent 时，会议区 SHALL 仅显示空圆桌。

#### Scenario: 2 个 Agent 协作
- **WHEN** 两个 Agent 通过相同 sessionKey 产生协作链接
- **THEN** 会议区 SHALL 显示圆桌，两个 Agent 的头像分布在圆桌对面两侧

#### Scenario: 多 Agent 协作
- **WHEN** 5 个 Agent 在同一个 session 中协作
- **THEN** 会议区圆桌 SHALL 扩大，5 个头像均匀分布在圆桌周围（72° 间隔）

#### Scenario: 无协作时
- **WHEN** 没有 Agent 处于协作状态
- **THEN** 会议区 SHALL 显示空圆桌和空椅子，不显示任何头像

### Requirement: 热工位区 Sub-Agent 布局

热工位区 SHALL 用于 Sub-Agent 的临时工位。布局逻辑与固定工位区类似，但工位单元可以更紧凑。Sub-Agent 出现时动态分配工位，结束时该工位变为空桌位。

#### Scenario: Sub-Agent 出现
- **WHEN** addSubAgent 创建一个新 Sub-Agent
- **THEN** 热工位区 SHALL 为其分配一个空闲工位，渲染对应的 DeskUnit 和 AgentAvatar

#### Scenario: Sub-Agent 结束
- **WHEN** removeSubAgent 移除一个 Sub-Agent
- **THEN** 该工位恢复为空桌位（保留桌椅，移除头像）

### Requirement: 休息区装饰布局

休息区 SHALL 以装饰为主，包含固定的家具布置（沙发、绿植、咖啡杯）。休息区的家具位置 SHALL 是固定的（不随 Agent 数量变化），营造休闲氛围。

#### Scenario: 休息区渲染
- **WHEN** FloorPlan 组件渲染
- **THEN** 休息区 SHALL 始终显示预设的装饰家具（至少 2 个沙发、2 个绿植、1 个咖啡杯），无论是否有 Agent 在休息

### Requirement: 协作连线增强

Agent 间的协作连线 SHALL 从简单贝塞尔曲线升级为带有方向指示（从 source 到 target）和动态脉冲效果的视觉元素。连线的粗细和透明度 SHALL 反映协作强度（`link.strength`）。

#### Scenario: 活跃协作连线
- **WHEN** 两个 Agent 之间存在 strength ≥ 0.5 的协作链接
- **THEN** SHALL 渲染一条 3px 粗的渐变曲线（source 颜色 → target 颜色），带有沿曲线移动的脉冲光点动画

#### Scenario: 弱协作连线
- **WHEN** 两个 Agent 之间存在 0.3 ≤ strength < 0.5 的协作链接
- **THEN** SHALL 渲染一条 1.5px 粗的半透明曲线，无脉冲动画
