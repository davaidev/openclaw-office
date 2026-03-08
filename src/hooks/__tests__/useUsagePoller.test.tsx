import { act, render } from "@testing-library/react";
import { createRef } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GatewayRpcClient } from "@/gateway/rpc-client";
import { useUsagePoller, resolveTokenSnapshot } from "@/hooks/useUsagePoller";
import { useOfficeStore } from "@/store/office-store";

function resetStore() {
  useOfficeStore.setState({
    agents: new Map(),
    links: [],
    globalMetrics: {
      activeAgents: 0,
      totalAgents: 0,
      totalTokens: 1234,
      tokenRate: 12,
      collaborationHeat: 0,
    },
    connectionStatus: "connected",
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

function HookHarness({ rpcRef }: { rpcRef: React.RefObject<GatewayRpcClient | null> }) {
  useUsagePoller(rpcRef);
  return null;
}

describe("useUsagePoller", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetStore();
  });

  it("normalizes flat usage status responses", () => {
    expect(
      resolveTokenSnapshot({
        total: 180,
        byAgent: { main: 120, reviewer: 60 },
      }),
    ).toEqual({
      total: 180,
      byAgent: { main: 120, reviewer: 60 },
    });
  });

  it("normalizes nested usage status responses", () => {
    expect(
      resolveTokenSnapshot({
        usage: {
          totalTokens: 320,
          byAgent: { main: 300, reviewer: 20 },
        },
      }),
    ).toEqual({
      total: 320,
      byAgent: { main: 300, reviewer: 20 },
    });
  });

  it("returns null for responses without usable token fields", () => {
    expect(resolveTokenSnapshot({})).toBeNull();
  });

  it("falls back to event history after repeated polling failures without zeroing prior metrics", async () => {
    useOfficeStore.setState({
      eventHistory: [
        { timestamp: 1, agentId: "main", stream: "tool", summary: "a", agentName: "Main" },
        { timestamp: 2, agentId: "main", stream: "tool", summary: "b", agentName: "Main" },
      ],
    });

    const request = vi.fn().mockRejectedValue(new Error("unavailable"));
    const rpcRef = createRef<GatewayRpcClient | null>();
    rpcRef.current = { request } as unknown as GatewayRpcClient;

    render(<HookHarness rpcRef={rpcRef} />);

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
      await vi.advanceTimersByTimeAsync(60_000);
      await vi.advanceTimersByTimeAsync(60_000);
    });

    const state = useOfficeStore.getState();
    expect(state.tokenHistory.length).toBeGreaterThanOrEqual(1);
    expect(state.tokenHistory.at(-1)?.total).toBe(200);
    expect(state.globalMetrics.totalTokens).toBe(200);
    expect(request.mock.calls.length).toBeGreaterThanOrEqual(6);
  });
});
