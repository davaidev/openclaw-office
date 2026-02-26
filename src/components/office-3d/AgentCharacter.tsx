import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import Markdown from "react-markdown";
import type { Group } from "three";
import type { VisualAgent } from "@/gateway/types";
import { generateAvatar3dColor } from "@/lib/avatar-generator";
import { STATUS_LABELS } from "@/lib/constants";
import { position2dTo3d } from "@/lib/position-allocator";
import { useOfficeStore } from "@/store/office-store";
import { ErrorIndicator } from "./ErrorIndicator";
import { SkillHologram } from "./SkillHologram";
import { ThinkingIndicator } from "./ThinkingIndicator";

interface AgentCharacterProps {
  agent: VisualAgent;
}

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export function AgentCharacter({ agent }: AgentCharacterProps) {
  const groupRef = useRef<Group>(null);
  const bodyRef = useRef<Group>(null);
  const spawnElapsed = useRef(0);
  const spawnDone = useRef(!agent.isSubAgent);
  const selectAgent = useOfficeStore((s) => s.selectAgent);
  const selectedAgentId = useOfficeStore((s) => s.selectedAgentId);
  const [hovered, setHovered] = useState(false);

  const isSelected = selectedAgentId === agent.id;
  const isSubAgent = agent.isSubAgent;
  const isOffline = agent.status === "offline";

  const baseColor = isSubAgent ? "#60a5fa" : generateAvatar3dColor(agent.id);
  const bodyOpacity = isOffline ? 0.4 : isSubAgent ? 0.6 : 1;
  const displayColor = isOffline ? "#6b7280" : baseColor;

  const [targetX, , targetZ] = position2dTo3d(agent.position);

  useFrame((state, delta) => {
    if (!groupRef.current) {
      return;
    }
    const t = state.clock.elapsedTime;

    // Spawn scale-in animation for sub-agents (800ms, easeOutBack)
    if (!spawnDone.current) {
      spawnElapsed.current += delta;
      const progress = Math.min(spawnElapsed.current / 0.8, 1);
      const scale = easeOutBack(progress);
      groupRef.current.scale.setScalar(scale);
      if (progress >= 1) {
        spawnDone.current = true;
      }
      return;
    }

    // Smooth position lerp (for meeting zone transitions)
    const lerpFactor = 1 - Math.pow(0.05, delta);
    const pos = groupRef.current.position;
    pos.x += (targetX - pos.x) * lerpFactor;
    pos.z += (targetZ - pos.z) * lerpFactor;

    if (bodyRef.current) {
      bodyRef.current.position.y = Math.sin(t * 2) * 0.02;
    }

    if (isSubAgent) {
      const pulse = 1.0 + Math.sin(t * 3) * 0.05;
      groupRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group
      ref={groupRef}
      position={[targetX, 0, targetZ]}
      scale={isSubAgent && !spawnDone.current ? 0 : 1}
      onClick={(e) => {
        e.stopPropagation();
        selectAgent(agent.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
    >
      <group ref={bodyRef}>
        <mesh position={[0, 0.35, 0]} castShadow>
          <capsuleGeometry args={[0.15, 0.4, 8, 16]} />
          <meshStandardMaterial
            color={displayColor}
            transparent={bodyOpacity < 1}
            opacity={bodyOpacity}
          />
        </mesh>

        <mesh position={[0, 0.7, 0]} castShadow>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial
            color={displayColor}
            transparent={bodyOpacity < 1}
            opacity={bodyOpacity}
          />
        </mesh>
      </group>

      {agent.status === "thinking" && <ThinkingIndicator />}
      {agent.status === "tool_calling" && agent.currentTool && (
        <SkillHologram tool={{ name: agent.currentTool.name }} position={[0.3, 0.5, -0.3]} />
      )}
      {agent.status === "error" && <ErrorIndicator />}

      {/* Speaking bubble — uses transform={false} to render at fixed screen size */}
      {agent.status === "speaking" && agent.speechBubble && (
        <Html position={[0, 1.2, 0]} center transform={false} style={{ pointerEvents: "none" }}>
          <div className="speech-bubble-3d pointer-events-none w-[280px] max-w-[320px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs leading-relaxed text-gray-800 shadow-lg">
            <Markdown>{agent.speechBubble.text.slice(0, 400)}</Markdown>
          </div>
        </Html>
      )}

      {isSelected && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.25, 0.3, 32]} />
          <meshStandardMaterial
            color="#3b82f6"
            emissive="#3b82f6"
            emissiveIntensity={0.5}
            transparent
            opacity={0.8}
          />
        </mesh>
      )}

      {hovered && (
        <Html position={[0, 1.1, 0]} center transform={false} style={{ pointerEvents: "none" }}>
          <div className="pointer-events-none whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-[11px] text-white shadow">
            {agent.name} — {STATUS_LABELS[agent.status]}
          </div>
        </Html>
      )}
    </group>
  );
}
