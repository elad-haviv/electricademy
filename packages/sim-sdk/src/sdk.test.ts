import { describe, expect, it, vi } from "vitest";
import { createSimClient, isSimMessage, listenToSimulators, PROTOCOL } from "./index";

describe("sim-sdk", () => {
  it("posts protocol messages to the hub origin", () => {
    const postMessage = vi.fn();
    const client = createSimClient("hv-edu", { hubOrigin: "https://hub.test", target: { postMessage } });
    client.progress("im-unit", 150);
    expect(postMessage).toHaveBeenCalledWith(
      { protocol: PROTOCOL, simulator: "hv-edu", type: "progress", module: "im-unit", percent: 100 },
      "https://hub.test",
    );
  });

  it("is a no-op when standalone", () => {
    const client = createSimClient("hv-edu", { hubOrigin: "https://hub.test", target: null });
    expect(client.embedded).toBe(false);
    expect(() => client.ready()).not.toThrow();
  });

  it("filters by origin and protocol", () => {
    const listeners: ((e: MessageEvent) => void)[] = [];
    const target = {
      addEventListener: (_: string, h: EventListener) => listeners.push(h as (e: MessageEvent) => void),
      removeEventListener: vi.fn(),
    };
    const onMessage = vi.fn();
    listenToSimulators(["https://sim.test"], onMessage, target);
    const msg = { protocol: PROTOCOL, type: "ready", simulator: "x" };
    listeners[0]!({ origin: "https://evil.test", data: msg } as MessageEvent);
    listeners[0]!({ origin: "https://sim.test", data: { hello: 1 } } as MessageEvent);
    listeners[0]!({ origin: "https://sim.test", data: msg } as MessageEvent);
    expect(onMessage).toHaveBeenCalledTimes(1);
    expect(isSimMessage(msg)).toBe(true);
  });
});
