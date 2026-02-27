import { useMemo } from "react";
import { SpeechBubbleOverlay } from "@/components/overlays/SpeechBubble";
import { SVG_WIDTH, SVG_HEIGHT, ZONES, ZONE_COLORS, ZONE_COLORS_DARK } from "@/lib/constants";
import { calculateDeskSlots, calculateMeetingSeatsSvg } from "@/lib/position-allocator";
import { useOfficeStore } from "@/store/office-store";
import { AgentAvatar } from "./AgentAvatar";
import { ConnectionLine } from "./ConnectionLine";
import { ZoneLabel } from "./ZoneLabel";
import { DeskUnit } from "./DeskUnit";
import { MeetingTable, Sofa, Plant, CoffeeCup, Chair } from "./furniture";
import type { VisualAgent } from "@/gateway/types";

export function FloorPlan() {
  const agents = useOfficeStore((s) => s.agents);
  const links = useOfficeStore((s) => s.links);
  const theme = useOfficeStore((s) => s.theme);

  const agentList = Array.from(agents.values());
  const isDark = theme === "dark";
  const zoneColors = isDark ? ZONE_COLORS_DARK : ZONE_COLORS;
  const zoneStroke = isDark ? "#334155" : "#c8d0dc";

  const deskAgents = useMemo(
    () => agentList.filter((a) => a.zone === "desk" && !a.isSubAgent),
    [agentList],
  );
  const hotDeskAgents = useMemo(
    () => agentList.filter((a) => a.zone === "hotDesk" || a.isSubAgent),
    [agentList],
  );
  const meetingAgents = useMemo(
    () => agentList.filter((a) => a.zone === "meeting"),
    [agentList],
  );

  const deskSlots = useMemo(
    () => calculateDeskSlots(ZONES.desk, deskAgents.length, Math.max(deskAgents.length, 4)),
    [deskAgents.length],
  );

  const hotDeskSlots = useMemo(
    () => calculateDeskSlots(ZONES.hotDesk, hotDeskAgents.length, Math.max(hotDeskAgents.length, 2)),
    [hotDeskAgents.length],
  );

  const meetingCenter = {
    x: ZONES.meeting.x + ZONES.meeting.width / 2,
    y: ZONES.meeting.y + ZONES.meeting.height / 2,
  };

  const meetingTableRadius = Math.min(
    60 + meetingAgents.length * 8,
    Math.min(ZONES.meeting.width, ZONES.meeting.height) / 2 - 40,
  );

  const meetingSeats = useMemo(
    () => calculateMeetingSeatsSvg(meetingAgents.length, meetingCenter, meetingTableRadius + 36),
    [meetingAgents.length, meetingCenter.x, meetingCenter.y, meetingTableRadius],
  );

  return (
    <div className="relative h-full w-full bg-gray-50 dark:bg-gray-950">
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="zone-shadow" x="-5%" y="-5%" width="110%" height="110%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity={isDark ? 0.3 : 0.05} />
          </filter>
          {Object.entries(zoneColors).map(([key, color]) => (
            <linearGradient key={`grad-${key}`} id={`grad-${key}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity={1} />
              <stop offset="100%" stopColor={color} stopOpacity={0.6} />
            </linearGradient>
          ))}
        </defs>

        {/* Layer 1: Zone backgrounds */}
        {Object.entries(ZONES).map(([key, zone]) => (
          <rect
            key={key}
            x={zone.x}
            y={zone.y}
            width={zone.width}
            height={zone.height}
            rx={16}
            fill={`url(#grad-${key})`}
            stroke={zoneStroke}
            strokeWidth={1}
            filter="url(#zone-shadow)"
          />
        ))}

        {/* Zone labels */}
        {Object.entries(ZONES).map(([key, zone]) => (
          <ZoneLabel key={`label-${key}`} zone={zone} zoneKey={key as keyof typeof ZONES} />
        ))}

        {/* Layer 2: Furniture – Desk zone */}
        <DeskZoneFurniture
          deskSlots={deskSlots}
          deskAgents={deskAgents}
        />

        {/* Layer 2: Furniture – Meeting zone */}
        <MeetingTable
          x={meetingCenter.x}
          y={meetingCenter.y}
          radius={meetingTableRadius}
          isDark={isDark}
        />
        <MeetingChairs seats={meetingSeats} meetingAgentCount={meetingAgents.length} isDark={isDark} />

        {/* Layer 2: Furniture – Hot desk zone */}
        <HotDeskZoneFurniture
          slots={hotDeskSlots}
          agents={hotDeskAgents}
        />

        {/* Layer 2: Furniture – Lounge zone */}
        <LoungeDecor isDark={isDark} />

        {/* Layer 3: Collaboration lines */}
        {links.map((link) => {
          const source = agents.get(link.sourceId);
          const target = agents.get(link.targetId);
          if (!source || !target) {
            return null;
          }
          return (
            <ConnectionLine
              key={`${link.sourceId}-${link.targetId}`}
              x1={source.position.x}
              y1={source.position.y}
              x2={target.position.x}
              y2={target.position.y}
              strength={link.strength}
            />
          );
        })}

        {/* Layer 4: Meeting agents (rendered directly, not inside DeskUnit) */}
        {meetingAgents.map((agent, i) => {
          const seat = meetingSeats[i];
          if (!seat) {
            return null;
          }
          return (
            <AgentAvatar
              key={agent.id}
              agent={{ ...agent, position: seat }}
            />
          );
        })}
      </svg>

      {/* Layer 5: HTML Overlay speech bubbles */}
      {agentList
        .filter((a) => a.speechBubble)
        .map((agent) => (
          <SpeechBubbleOverlay key={`bubble-${agent.id}`} agent={agent} />
        ))}
    </div>
  );
}

/* --- Sub-components --- */

function DeskZoneFurniture({
  deskSlots,
  deskAgents,
}: {
  deskSlots: Array<{ unitX: number; unitY: number }>;
  deskAgents: VisualAgent[];
}) {
  const agentBySlot = useMemo(() => {
    const map = new Map<number, VisualAgent>();
    for (const agent of deskAgents) {
      let hash = 0;
      for (let i = 0; i < agent.id.length; i++) {
        hash = ((hash << 5) - hash + agent.id.charCodeAt(i)) | 0;
      }
      const idx = Math.abs(hash) % deskSlots.length;
      let slot = idx;
      while (map.has(slot)) {
        slot = (slot + 1) % deskSlots.length;
      }
      map.set(slot, agent);
    }
    return map;
  }, [deskAgents, deskSlots.length]);

  return (
    <g>
      {deskSlots.map((slot, i) => (
        <DeskUnit
          key={`desk-${i}`}
          x={slot.unitX}
          y={slot.unitY}
          agent={agentBySlot.get(i) ?? null}
        />
      ))}
    </g>
  );
}

function HotDeskZoneFurniture({
  slots,
  agents,
}: {
  slots: Array<{ unitX: number; unitY: number }>;
  agents: VisualAgent[];
}) {
  return (
    <g>
      {slots.map((slot, i) => (
        <DeskUnit
          key={`hotdesk-${i}`}
          x={slot.unitX}
          y={slot.unitY}
          agent={agents[i] ?? null}
        />
      ))}
    </g>
  );
}

function MeetingChairs({
  seats,
  meetingAgentCount,
  isDark,
}: {
  seats: Array<{ x: number; y: number }>;
  meetingAgentCount: number;
  isDark: boolean;
}) {
  const meetingCenter = {
    x: ZONES.meeting.x + ZONES.meeting.width / 2,
    y: ZONES.meeting.y + ZONES.meeting.height / 2,
  };

  if (meetingAgentCount > 0) {
    return (
      <g>
        {seats.map((s, i) => (
          <Chair key={`mc-${i}`} x={s.x} y={s.y} isDark={isDark} />
        ))}
      </g>
    );
  }

  // Empty meeting room: show 6 placeholder chairs around the table
  const emptyCount = 6;
  const emptyRadius = 100;
  return (
    <g>
      {Array.from({ length: emptyCount }, (_, i) => {
        const angle = (2 * Math.PI * i) / emptyCount - Math.PI / 2;
        return (
          <Chair
            key={`mc-empty-${i}`}
            x={Math.round(meetingCenter.x + Math.cos(angle) * emptyRadius)}
            y={Math.round(meetingCenter.y + Math.sin(angle) * emptyRadius)}
            isDark={isDark}
          />
        );
      })}
    </g>
  );
}

function LoungeDecor({ isDark }: { isDark: boolean }) {
  const lz = ZONES.lounge;
  return (
    <g>
      <Sofa x={lz.x + 120} y={lz.y + 80} rotation={0} isDark={isDark} />
      <Sofa x={lz.x + 120} y={lz.y + 200} rotation={180} isDark={isDark} />
      <Sofa x={lz.x + 380} y={lz.y + 140} rotation={90} isDark={isDark} />
      <Plant x={lz.x + 50} y={lz.y + 60} />
      <Plant x={lz.x + 260} y={lz.y + 50} />
      <Plant x={lz.x + 480} y={lz.y + 240} />
      <CoffeeCup x={lz.x + 200} y={lz.y + 130} />
      <CoffeeCup x={lz.x + 320} y={lz.y + 90} />
    </g>
  );
}
