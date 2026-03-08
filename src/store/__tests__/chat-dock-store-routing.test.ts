import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionInfo } from "@/gateway/adapter-types";
import type { VisualAgent } from "@/gateway/types";
import { useChatDockStore } from "@/store/console-stores/chat-dock-store";
import { useOfficeStore } from "@/store/office-store";

const mockAdapter = {
  sessionsList: vi.fn<() => Promise<SessionInfo[]>>(),
  chatHistory: vi.fn<() => Promise<Array<{ id: string; role: string; content: string; timestamp: number }>>>(),
  chatSend: vi.fn(),
  chatAbort: vi.fn(),
};

vi.mock("@/gateway/adapter-provider", () => ({
  getAdapter: () => mockAdapter,
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

describe("chat-dock-store routing", () => {
  beforeEach(() => {
    resetChatDockStore();
    useOfficeStore.setState({
      agents: new Map([
        ["main", makeAgent("main")],
        ["placeholder-0", makeAgent("placeholder-0", { isPlaceholder: true, isSubAgent: true, zone: "lounge" })],
        ["sub-1", makeAgent("sub-1", { isSubAgent: true, zone: "hotDesk" })],
      ]),
    });
    mockAdapter.sessionsList.mockReset();
    mockAdapter.chatHistory.mockReset();
    mockAdapter.chatHistory.mockResolvedValue([]);
  });

  it("falls back to a stable main agent when targeting an invalid agent", () => {
    useChatDockStore.getState().setTargetAgent("placeholder-0");

    const state = useChatDockStore.getState();
    expect(state.targetAgentId).toBe("main");
    expect(state.currentSessionKey).toBe("agent:main:main");
  });

  it("prefers the latest active session for the selected agent", async () => {
    mockAdapter.sessionsList.mockResolvedValue([
      {
        key: "agent:main:main",
        agentId: "main",
        label: "default",
        createdAt: 1,
        lastActiveAt: 10,
        messageCount: 1,
      },
      {
        key: "agent:main:session-2",
        agentId: "main",
        label: "recent",
        createdAt: 2,
        lastActiveAt: 20,
        messageCount: 4,
      },
    ]);

    useChatDockStore.getState().setTargetAgent("main");
    await useChatDockStore.getState().loadSessions();

    const state = useChatDockStore.getState();
    expect(state.currentSessionKey).toBe("agent:main:session-2");
    expect(mockAdapter.chatHistory).toHaveBeenLastCalledWith("agent:main:session-2");
  });

  it("ignores chat events from other sessions", () => {
    useChatDockStore.setState({
      currentSessionKey: "agent:main:session-1",
      isStreaming: true,
    });

    useChatDockStore.getState().handleChatEvent({
      state: "delta",
      sessionKey: "agent:main:session-2",
      message: { role: "assistant", content: "wrong session" },
    });

    expect(useChatDockStore.getState().streamingMessage).toBeNull();
  });

  it("accepts chat events for the active session", () => {
    useChatDockStore.setState({
      currentSessionKey: "agent:main:session-1",
      isStreaming: true,
    });

    useChatDockStore.getState().handleChatEvent({
      state: "final",
      sessionKey: "agent:main:session-1",
      message: { id: "m1", role: "assistant", content: "hello" },
    });

    const state = useChatDockStore.getState();
    expect(state.messages.at(-1)?.content).toBe("hello");
    expect(state.isStreaming).toBe(false);
  });
});
