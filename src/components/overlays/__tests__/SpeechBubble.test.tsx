import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { VisualAgent } from "@/gateway/types";
import { SpeechBubbleOverlay } from "../SpeechBubble";

function makeAgent(overrides: Partial<VisualAgent> = {}): VisualAgent {
  return {
    id: "agent-1",
    name: "Agent 1",
    status: "speaking",
    position: { x: 500, y: 300 },
    currentTool: null,
    speechBubble: { text: "Hello **world**", timestamp: Date.now() },
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

describe("SpeechBubbleOverlay", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("renders speaking content without requiring an expand click", () => {
    render(<SpeechBubbleOverlay agent={makeAgent()} />);
    expect(screen.getByTestId("speech-bubble-overlay")).toBeInTheDocument();
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("world")).toBeInTheDocument();
  });

  it("supports manual dismissal", () => {
    render(<SpeechBubbleOverlay agent={makeAgent()} />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.queryByTestId("speech-bubble-overlay")).not.toBeInTheDocument();
  });

  it("keeps long messages visible longer after speaking stops", () => {
    const longText = "Long message ".repeat(30);
    const { rerender } = render(
      <SpeechBubbleOverlay
        agent={makeAgent({ speechBubble: { text: longText, timestamp: Date.now() } })}
      />,
    );

    rerender(
      <SpeechBubbleOverlay
        agent={makeAgent({
          status: "idle",
          speechBubble: { text: longText, timestamp: Date.now() },
        })}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(11_000);
    });
    expect(screen.getByTestId("speech-bubble-overlay")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(19_001);
    });
    expect(screen.queryByTestId("speech-bubble-overlay")).not.toBeInTheDocument();
  });

  it("adjusts anchor alignment near viewport edges", () => {
    const { rerender } = render(
      <SpeechBubbleOverlay agent={makeAgent({ position: { x: 80, y: 300 } })} />,
    );
    expect(screen.getByTestId("speech-bubble-anchor").getAttribute("style")).toContain(
      "translate(-10%, -100%)",
    );
    expect(screen.getByTestId("speech-bubble-arrow-left")).toBeInTheDocument();

    rerender(<SpeechBubbleOverlay agent={makeAgent({ position: { x: 920, y: 300 } })} />);
    expect(screen.getByTestId("speech-bubble-anchor").getAttribute("style")).toContain(
      "translate(-90%, -100%)",
    );
    expect(screen.getByTestId("speech-bubble-arrow-right")).toBeInTheDocument();
  });
});
