import { useState } from "react";
import { Bot, User } from "lucide-react";
import type { VisualAgent } from "@/gateway/types";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";
import { useOfficeStore } from "@/store/office-store";

interface AgentDotProps {
  agent: VisualAgent;
}

export function AgentDot({ agent }: AgentDotProps) {
  const selectedAgentId = useOfficeStore((s) => s.selectedAgentId);
  const selectAgent = useOfficeStore((s) => s.selectAgent);
  const theme = useOfficeStore((s) => s.theme);
  const [hovered, setHovered] = useState(false);

  const isSelected = selectedAgentId === agent.id;
  const radius = isSelected ? 20 : 16;
  const color = STATUS_COLORS[agent.status];
  const isDark = theme === "dark";

  // Determine icon based on agent name or type (fallback to Bot)
  const isHuman = agent.name.toLowerCase().includes("user") || agent.name.toLowerCase().includes("human");
  const Icon = isHuman ? User : Bot;

  return (
    <g
      transform={`translate(${agent.position.x}, ${agent.position.y})`}
      style={{ cursor: "pointer" }}
      onClick={() => selectAgent(agent.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Outer glow for selected state */}
      {isSelected && (
        <circle 
          r={radius + 6} 
          fill={color} 
          opacity={0.2} 
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />
      )}

      {/* Main background with status color border */}
      <circle
        r={radius}
        fill={isDark ? "#1e293b" : "#ffffff"}
        stroke={color}
        strokeWidth={isSelected ? 3 : 2}
        style={{
          transition: "all 300ms ease",
          filter: `drop-shadow(0 2px 4px rgba(0,0,0,0.1))`,
        }}
      />

      {/* Icon */}
      <foreignObject x={-radius} y={-radius} width={radius * 2} height={radius * 2}>
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={radius * 1.2} color={color} strokeWidth={2.5} />
        </div>
      </foreignObject>

      {/* Tooltip */}
      {hovered && (
        <foreignObject x={-75} y={-radius - 40} width={150} height={36} style={{ pointerEvents: 'none' }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "max-content",
              margin: "0 auto",
              padding: "4px 12px",
              borderRadius: "8px",
              backgroundColor: isDark ? "rgba(30, 41, 59, 0.7)" : "rgba(255, 255, 255, 0.7)",
              backdropFilter: "blur(8px)",
              color: isDark ? "#e2e8f0" : "#374151",
              fontSize: "12px",
              fontWeight: 500,
              boxShadow: isDark ? "0 4px 6px rgba(0,0,0,0.3)" : "0 4px 6px rgba(0,0,0,0.1)",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}`,
            }}
          >
            {agent.name} · {STATUS_LABELS[agent.status]}
          </div>
        </foreignObject>
      )}
    </g>
  );
}
