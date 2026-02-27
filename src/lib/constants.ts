import type { AgentVisualStatus } from "@/gateway/types";
import i18n from "@/i18n";

export const SVG_WIDTH = 1200;
export const SVG_HEIGHT = 700;

export const ZONES = {
  desk: { x: 40, y: 40, width: 540, height: 300, label: "固定工位区" },
  meeting: { x: 620, y: 40, width: 540, height: 300, label: "会议区" },
  hotDesk: { x: 40, y: 380, width: 540, height: 280, label: "热工位区" },
  lounge: { x: 620, y: 380, width: 540, height: 280, label: "休息区" },
} as const;

export const ZONE_COLORS = {
  desk: "#e8edf5",
  meeting: "#e0eaf5",
  hotDesk: "#e5e8f0",
  lounge: "#e8e5f0",
} as const;

export const ZONE_COLORS_DARK = {
  desk: "#1e293b",
  meeting: "#1a2744",
  hotDesk: "#1e2433",
  lounge: "#231e33",
} as const;

export const STATUS_COLORS: Record<AgentVisualStatus, string> = {
  idle: "#22c55e",
  thinking: "#3b82f6",
  tool_calling: "#f97316",
  speaking: "#a855f7",
  spawning: "#06b6d4",
  error: "#ef4444",
  offline: "#6b7280",
};

export const STATUS_LABELS: Record<AgentVisualStatus, string> = {
  idle: "空闲",
  thinking: "思考中",
  tool_calling: "工具调用",
  speaking: "回复中",
  spawning: "创建中",
  error: "错误",
  offline: "离线",
};

export function getZoneLabel(zone: keyof typeof ZONES): string {
  return i18n.t(`common:zones.${zone}`);
}

export function getStatusLabel(status: AgentVisualStatus): string {
  return i18n.t(`common:agent.statusLabels.${status}`);
}

export const DESK_GRID_COLS = 4;
export const DESK_GRID_ROWS = 3;
export const DESK_MAX_AGENTS = DESK_GRID_COLS * DESK_GRID_ROWS;

export const HOT_DESK_GRID_COLS = 4;
export const HOT_DESK_GRID_ROWS = 3;

// 家具尺寸常量 (flat isometric 2D)
export const FURNITURE = {
  desk: { width: 100, height: 60 },
  chair: { size: 30 },
  meetingTable: { minRadius: 60, maxRadius: 100 },
  sofa: { width: 110, height: 50 },
  plant: { width: 28, height: 36 },
  coffeeCup: { size: 14 },
} as const;

// 工位单元（Desk + Chair + AgentAvatar）
export const DESK_UNIT = {
  width: 140,
  height: 110,
  avatarRadius: 20,
  avatarOffsetY: -8,
} as const;

// Agent 头像
export const AVATAR = {
  radius: 20,
  selectedRadius: 24,
  strokeWidth: 3,
  nameLabelMaxChars: 12,
} as const;

// 3D 场景常量
// SVG 1200×700 maps to 3D building 16×12 world units
export const SCALE_X_2D_TO_3D = 16 / SVG_WIDTH;
export const SCALE_Z_2D_TO_3D = 12 / SVG_HEIGHT;
export const SCALE_2D_TO_3D = 0.01; // legacy — kept for tests
export const DESK_HEIGHT = 0.42;
export const CHARACTER_Y = 0;
export const MEETING_TABLE_RADIUS = 1.2;
export const MEETING_SEAT_RADIUS = 1.7;
