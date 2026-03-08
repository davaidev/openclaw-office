import { act, render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { VisualAgent } from "@/gateway/types";
import { useChatDockStore } from "@/store/console-stores/chat-dock-store";
import { useOfficeStore } from "@/store/office-store";
import { AppShell } from "../AppShell";

vi.mock("@/lib/webgl-detect", () => ({
  isWebGLAvailable: () => true,
}));

vi.mock("@/components/chat/ChatDialog", () => ({
  ChatDialog: () => null,
}));

vi.mock("@/components/chat/ChatDockBar", () => ({
  ChatDockBar: () => null,
}));

vi.mock("@/components/shared/RestartBanner", () => ({
  RestartBanner: () => null,
}));

vi.mock("@/components/shared/ToastContainer", () => ({
  ToastContainer: () => null,
}));

vi.mock("../Sidebar", () => ({
  Sidebar: () => null,
}));

function makeAgent(
  id: string,
  overrides: Partial<VisualAgent> = {},
): VisualAgent {
  return {
    id,
    name: id,
    status: "idle",
    position: { x: 0, y: 0 },
    currentTool: null,
    speechBubble: null,
    lastActiveAt: Date.now(),
    toolCallCount: 0,
    toolCallHistory: [],
    runId: null,
    isSubAgent: false,
    isPlaceholder: false,
    parentAgentId: null,
    childAgentIds: [],
    zone: "desk",
    originalPosition: null,
    movement: null,
    confirmed: true,
    ...overrides,
  };
}

function resetChatDockStore() {
  useChatDockStore.setState({
    messages: [],
    isStreaming: false,
    currentSessionKey: "agent:main:main",
    dockExpanded: false,
    targetAgentId: null,
    sessions: [],
    error: null,
    activeRunId: null,
    streamingMessage: null,
    isHistoryLoaded: false,
    isHistoryLoading: false,
  });
}

describe("AppShell chat target routing", () => {
  beforeEach(() => {
    resetChatDockStore();
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
      connectionStatus: "connected",
      connectionError: null,
      selectedAgentId: null,
      viewMode: "2d",
      eventHistory: [],
      sidebarCollapsed: false,
      lastSessionsSnapshot: null,
      currentPage: "office",
      theme: "dark",
      bloomEnabled: true,
      operatorScopes: [],
      tokenHistory: [],
      agentCosts: {},
      runIdMap: new Map(),
      sessionKeyMap: new Map(),
    });
  });

  it("selects the stable main agent as default target", async () => {
    useOfficeStore.setState({
      agents: new Map([
        ["main", makeAgent("main")],
        ["placeholder-0", makeAgent("placeholder-0", { isPlaceholder: true, isSubAgent: true, zone: "lounge" })],
      ]),
    });

    render(
      <MemoryRouter>
        <AppShell />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(useChatDockStore.getState().targetAgentId).toBe("main");
    });
  });

  it("does not route sidebar selection to an invalid chat target", async () => {
    useOfficeStore.setState({
      agents: new Map([
        ["main", makeAgent("main")],
        ["placeholder-0", makeAgent("placeholder-0", { isPlaceholder: true, isSubAgent: true, zone: "lounge" })],
      ]),
    });
    useChatDockStore.setState({ targetAgentId: "main", currentSessionKey: "agent:main:main" });

    render(
      <MemoryRouter>
        <AppShell />
      </MemoryRouter>,
    );

    act(() => {
      useOfficeStore.setState({ selectedAgentId: "placeholder-0" });
    });

    await waitFor(() => {
      expect(useChatDockStore.getState().targetAgentId).toBe("main");
    });
  });

  it("syncs sidebar selection when a confirmed main agent is selected", async () => {
    useOfficeStore.setState({
      agents: new Map([
        ["main", makeAgent("main")],
        ["reviewer", makeAgent("reviewer")],
      ]),
    });
    useChatDockStore.setState({ targetAgentId: "main", currentSessionKey: "agent:main:main" });

    render(
      <MemoryRouter>
        <AppShell />
      </MemoryRouter>,
    );

    act(() => {
      useOfficeStore.setState({ selectedAgentId: "reviewer" });
    });

    await waitFor(() => {
      expect(useChatDockStore.getState().targetAgentId).toBe("reviewer");
    });
  });
});
