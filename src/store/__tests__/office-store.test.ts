import { describe, it, expect, beforeEach, vi } from "vitest";
import type { AgentEventPayload } from "@/gateway/types";
import { useOfficeStore } from "@/store/office-store";

function resetStore() {
  useOfficeStore.setState({
    agents: new Map(),
    links: [],
    globalMetrics: {
      activeAgents: 0,
      totalAgents: 0,
      totalTokens: 0,
      tokenRate: 0,
      collaborationHeat: 0,
    },
    connectionStatus: "disconnected",
    connectionError: null,
    selectedAgentId: null,
    viewMode: "2d",
    eventHistory: [],
    sidebarCollapsed: false,
    lastSessionsSnapshot: null,
    theme: "dark",
    bloomEnabled: true,
    operatorScopes: [],
    tokenHistory: [],
    agentCosts: {},
    runIdMap: new Map(),
    sessionKeyMap: new Map(),
  });
}

function setRunIdMap(entries: [string, string][]) {
  useOfficeStore.setState({ runIdMap: new Map(entries) });
}

describe("office-store", () => {
  beforeEach(() => {
    resetStore();
  });

  describe("initAgents", () => {
    it("initializes agents from summary list", () => {
      const { initAgents } = useOfficeStore.getState();
      initAgents([
        { id: "agent-1", name: "Coder" },
        { id: "agent-2", name: "Reviewer", identity: { name: "Rev" } },
      ]);

      const state = useOfficeStore.getState();
      // 2 real agents + 8 placeholder agents (maxSubAgents default)
      const realAgents = Array.from(state.agents.values()).filter((a) => !a.isPlaceholder);
      expect(realAgents).toHaveLength(2);
      expect(state.agents.get("agent-1")?.name).toBe("Coder");
      expect(state.agents.get("agent-2")?.name).toBe("Rev");
      expect(state.globalMetrics.totalAgents).toBe(2);
    });
  });

  describe("processAgentEvent", () => {
    it("lifecycle start → thinking status", () => {
      useOfficeStore.getState().initAgents([{ id: "a1", name: "Alpha" }]);
      setRunIdMap([["run-1", "a1"]]);

      useOfficeStore.getState().processAgentEvent({
        runId: "run-1",
        seq: 1,
        stream: "lifecycle",
        ts: Date.now(),
        data: { phase: "start" },
      });

      const agent = useOfficeStore.getState().agents.get("a1");
      expect(agent?.status).toBe("thinking");
    });

    it("tool start → tool_calling, increments count", () => {
      useOfficeStore.getState().initAgents([{ id: "a1", name: "Alpha" }]);
      setRunIdMap([["run-1", "a1"]]);

      useOfficeStore.getState().processAgentEvent({
        runId: "run-1",
        seq: 2,
        stream: "tool",
        ts: Date.now(),
        data: { phase: "start", name: "search" },
      });

      const agent = useOfficeStore.getState().agents.get("a1");
      expect(agent?.status).toBe("tool_calling");
      expect(agent?.currentTool?.name).toBe("search");
      expect(agent?.toolCallCount).toBe(1);
    });

    it("full lifecycle: idle → thinking → tool → speaking → idle", () => {
      useOfficeStore.getState().initAgents([{ id: "a1", name: "Alpha" }]);
      setRunIdMap([["run-1", "a1"]]);

      const events: AgentEventPayload[] = [
        { runId: "run-1", seq: 1, stream: "lifecycle", ts: 1, data: { phase: "start" } },
        { runId: "run-1", seq: 2, stream: "tool", ts: 2, data: { phase: "start", name: "web" } },
        { runId: "run-1", seq: 3, stream: "tool", ts: 3, data: { phase: "end", name: "web" } },
        { runId: "run-1", seq: 4, stream: "assistant", ts: 4, data: { text: "Done!" } },
        { runId: "run-1", seq: 5, stream: "lifecycle", ts: 5, data: { phase: "end" } },
      ];

      const expectedStatuses = ["thinking", "tool_calling", "thinking", "speaking", "idle"];

      for (let i = 0; i < events.length; i++) {
        useOfficeStore.getState().processAgentEvent(events[i]);
        const agent = useOfficeStore.getState().agents.get("a1");
        expect(agent?.status).toBe(expectedStatuses[i]);
      }
    });

    it("creates unconfirmed agent for unknown runId in corridor zone", () => {
      useOfficeStore.getState().processAgentEvent({
        runId: "unknown-run",
        seq: 1,
        stream: "lifecycle",
        ts: Date.now(),
        data: { phase: "start" },
      });

      const state = useOfficeStore.getState();
      const agent = state.agents.get("unknown-run");
      expect(agent).toBeDefined();
      expect(agent?.confirmed).toBe(false);
      expect(agent?.zone).toBe("corridor");
      expect(agent?.status).toBe("thinking");
    });

    it("prefers confirmed main agents for ordinary session routing", () => {
      useOfficeStore.getState().initAgents([{ id: "main", name: "Main" }]);
      useOfficeStore.getState().addSubAgent("main", {
        sessionKey: "agent:main:subagent:sub-1",
        agentId: "sub-1",
        label: "Sub-1",
        task: "",
        requesterSessionKey: "agent:main:main",
        startedAt: Date.now(),
      });
      useOfficeStore.setState((state) => {
        state.sessionKeyMap.set("agent:main:shared", ["sub-1", "main"]);
      });

      useOfficeStore.getState().processAgentEvent({
        runId: "run-main",
        seq: 1,
        stream: "assistant",
        ts: Date.now(),
        data: { text: "hello" },
        sessionKey: "agent:main:shared",
      });

      expect(useOfficeStore.getState().agents.get("main")?.status).toBe("speaking");
      expect(useOfficeStore.getState().agents.get("sub-1")?.status).toBe("idle");
    });

    it("retires unresolved ephemeral agents instead of auto-confirming them", () => {
      vi.useFakeTimers();

      useOfficeStore.getState().processAgentEvent({
        runId: "ephemeral-run",
        seq: 1,
        stream: "lifecycle",
        ts: Date.now(),
        data: { phase: "start" },
      });

      expect(useOfficeStore.getState().agents.get("ephemeral-run")?.confirmed).toBe(false);

      vi.advanceTimersByTime(5_000);

      const state = useOfficeStore.getState();
      expect(state.agents.has("ephemeral-run")).toBe(false);
      expect(state.runIdMap.has("ephemeral-run")).toBe(false);
      vi.useRealTimers();
    });

    it("does not retire confirmed UUID-like main agents", () => {
      useOfficeStore.getState().initAgents([
        { id: "5533959a-1a5e-4b44-a39a-a0799f71db92", name: "UUID Agent" },
      ]);

      useOfficeStore.getState().processAgentEvent({
        runId: "run-uuid",
        seq: 1,
        stream: "assistant",
        ts: Date.now(),
        data: {
          agentId: "5533959a-1a5e-4b44-a39a-a0799f71db92",
          text: "uuid agent text",
        },
        sessionKey: "agent:5533959a-1a5e-4b44-a39a-a0799f71db92:main",
      });

      const agent = useOfficeStore.getState().agents.get("5533959a-1a5e-4b44-a39a-a0799f71db92");
      expect(agent).toBeDefined();
      expect(agent?.confirmed).toBe(true);
      expect(agent?.status).toBe("speaking");
    });

    it("merges ephemeral runtime entities into explicit agent identities when evidence arrives", () => {
      useOfficeStore.getState().processAgentEvent({
        runId: "run-late-identity",
        seq: 1,
        stream: "lifecycle",
        ts: 1,
        data: { phase: "start" },
      });

      expect(useOfficeStore.getState().agents.get("run-late-identity")?.confirmed).toBe(false);

      useOfficeStore.getState().processAgentEvent({
        runId: "run-late-identity",
        seq: 2,
        stream: "assistant",
        ts: 2,
        data: { agentId: "main-real", text: "resolved" },
        sessionKey: "agent:main-real:main",
      });

      const state = useOfficeStore.getState();
      expect(state.agents.has("run-late-identity")).toBe(false);
      expect(state.agents.get("main-real")?.confirmed).toBe(true);
      expect(state.runIdMap.get("run-late-identity")).toBe("main-real");
    });
  });

  describe("selectAgent", () => {
    it("selects and deselects agent", () => {
      const { selectAgent } = useOfficeStore.getState();

      selectAgent("a1");
      expect(useOfficeStore.getState().selectedAgentId).toBe("a1");

      selectAgent("a1");
      expect(useOfficeStore.getState().selectedAgentId).toBeNull();
    });
  });

  describe("event history", () => {
    it("records events up to limit", () => {
      useOfficeStore.getState().initAgents([{ id: "a1", name: "A" }]);
      setRunIdMap([["r1", "a1"]]);

      for (let i = 0; i < 250; i++) {
        useOfficeStore.getState().processAgentEvent({
          runId: "r1",
          seq: i,
          stream: "lifecycle",
          ts: i,
          data: { phase: "start" },
        });
      }

      expect(useOfficeStore.getState().eventHistory.length).toBeLessThanOrEqual(200);
    });
  });

  describe("token snapshots", () => {
    it("updates global token metrics from the latest snapshot", () => {
      const { pushTokenSnapshot } = useOfficeStore.getState();

      pushTokenSnapshot({
        timestamp: 60_000,
        total: 120,
        byAgent: { main: 120 },
      });

      pushTokenSnapshot({
        timestamp: 120_000,
        total: 240,
        byAgent: { main: 240 },
      });

      const state = useOfficeStore.getState();
      expect(state.tokenHistory).toHaveLength(2);
      expect(state.globalMetrics.totalTokens).toBe(240);
      expect(state.globalMetrics.tokenRate).toBe(120);
    });

    it("keeps latest metrics when snapshot history is trimmed", () => {
      const { pushTokenSnapshot } = useOfficeStore.getState();

      for (let i = 1; i <= 35; i++) {
        pushTokenSnapshot({
          timestamp: i * 60_000,
          total: i * 10,
          byAgent: { main: i * 10 },
        });
      }

      const state = useOfficeStore.getState();
      expect(state.tokenHistory).toHaveLength(30);
      expect(state.globalMetrics.totalTokens).toBe(350);
      expect(state.globalMetrics.tokenRate).toBe(10);
    });
  });

  describe("extended fields", () => {
    it("initializes parentAgentId / childAgentIds / zone / originalPosition", () => {
      useOfficeStore.getState().initAgents([{ id: "a1", name: "A" }]);
      const agent = useOfficeStore.getState().agents.get("a1")!;
      expect(agent.parentAgentId).toBeNull();
      expect(agent.childAgentIds).toEqual([]);
      expect(agent.zone).toBe("desk");
      expect(agent.originalPosition).toBeNull();
    });
  });

  describe("viewMode", () => {
    it("setViewMode switches to 3d", () => {
      useOfficeStore.getState().setViewMode("3d");
      expect(useOfficeStore.getState().viewMode).toBe("3d");
    });

    it("setViewMode switches back to 2d", () => {
      useOfficeStore.getState().setViewMode("3d");
      useOfficeStore.getState().setViewMode("2d");
      expect(useOfficeStore.getState().viewMode).toBe("2d");
    });
  });

  describe("theme", () => {
    it("defaults to dark", () => {
      expect(useOfficeStore.getState().theme).toBe("dark");
    });

    it("setTheme switches to light", () => {
      useOfficeStore.getState().setTheme("light");
      expect(useOfficeStore.getState().theme).toBe("light");
    });

    it("setTheme persists to localStorage", () => {
      const spy = vi.spyOn(Storage.prototype, "setItem");
      useOfficeStore.getState().setTheme("light");
      expect(spy).toHaveBeenCalledWith("openclaw-theme", "light");
      spy.mockRestore();
    });

    it("setTheme switches back to dark", () => {
      useOfficeStore.getState().setTheme("light");
      useOfficeStore.getState().setTheme("dark");
      expect(useOfficeStore.getState().theme).toBe("dark");
    });
  });

  describe("bloomEnabled", () => {
    it("defaults to true (normal DPR)", () => {
      expect(useOfficeStore.getState().bloomEnabled).toBe(true);
    });

    it("setBloomEnabled toggles", () => {
      useOfficeStore.getState().setBloomEnabled(false);
      expect(useOfficeStore.getState().bloomEnabled).toBe(false);
      useOfficeStore.getState().setBloomEnabled(true);
      expect(useOfficeStore.getState().bloomEnabled).toBe(true);
    });
  });

  describe("globalMetrics", () => {
    it("counts active agents correctly", () => {
      useOfficeStore.getState().initAgents([
        { id: "a1", name: "A" },
        { id: "a2", name: "B" },
        { id: "a3", name: "C" },
      ]);
      setRunIdMap([
        ["r1", "a1"],
        ["r2", "a2"],
      ]);

      useOfficeStore.getState().processAgentEvent({
        runId: "r1",
        seq: 1,
        stream: "lifecycle",
        ts: 1,
        data: { phase: "start" },
      });
      useOfficeStore.getState().processAgentEvent({
        runId: "r2",
        seq: 1,
        stream: "lifecycle",
        ts: 1,
        data: { phase: "start" },
      });

      expect(useOfficeStore.getState().globalMetrics.activeAgents).toBe(2);
      expect(useOfficeStore.getState().globalMetrics.totalAgents).toBe(3);
    });
  });
});
