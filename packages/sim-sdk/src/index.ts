/**
 * @electricademy/sim-sdk — the contract between the Electricademy hub and
 * simulators (standalone apps embedded in an iframe or opened in a new tab).
 *
 * Opt-in: a simulator that never loads this SDK keeps working standalone.
 *
 *   Simulator → Hub : "ready", "progress", "completed"
 *   Hub → Simulator : "session"  (who the user is; short-lived token for API calls)
 */

export const PROTOCOL = "electricademy.sim.v1" as const;

export type SimToHubMessage =
  | { protocol: typeof PROTOCOL; type: "ready"; simulator: string }
  | { protocol: typeof PROTOCOL; type: "progress"; simulator: string; module: string; percent: number }
  | { protocol: typeof PROTOCOL; type: "completed"; simulator: string; module: string; score?: number };

export type HubToSimMessage = {
  protocol: typeof PROTOCOL;
  type: "session";
  user: { id: string; name: string | null; plan: "anonymous" | "free" | "pro" } | null;
  /** Short-lived signed token the simulator may send to the hub API. */
  token: string | null;
};

export type SimMessage = SimToHubMessage | HubToSimMessage;

export function isSimMessage(data: unknown): data is SimMessage {
  return typeof data === "object" && data !== null && (data as { protocol?: unknown }).protocol === PROTOCOL;
}

type Poster = Pick<Window, "postMessage">;

/** Used inside a simulator. No-ops when not embedded in the hub. */
export function createSimClient(simulator: string, opts: { hubOrigin: string; target?: Poster | null }) {
  const target = opts.target !== undefined ? opts.target : typeof window !== "undefined" && window.parent !== window ? window.parent : null;
  const send = (msg: Omit<SimToHubMessage, "protocol" | "simulator">) => {
    target?.postMessage({ protocol: PROTOCOL, simulator, ...msg }, opts.hubOrigin);
  };
  return {
    embedded: target !== null,
    ready: () => send({ type: "ready" }),
    progress: (module: string, percent: number) =>
      send({ type: "progress", module, percent: Math.max(0, Math.min(100, percent)) } as Omit<SimToHubMessage, "protocol" | "simulator">),
    completed: (module: string, score?: number) => send({ type: "completed", module, score } as Omit<SimToHubMessage, "protocol" | "simulator">),
  };
}

/**
 * Used by the hub. Accepts messages only from allow-listed simulator origins.
 * Returns an unsubscribe function.
 */
export function listenToSimulators(
  allowedOrigins: readonly string[],
  onMessage: (msg: SimToHubMessage, origin: string) => void,
  target: Pick<Window, "addEventListener" | "removeEventListener"> = window,
): () => void {
  const allowed = new Set(allowedOrigins);
  const handler = (event: MessageEvent) => {
    if (!allowed.has(event.origin) || !isSimMessage(event.data) || event.data.type === "session") return;
    onMessage(event.data, event.origin);
  };
  target.addEventListener("message", handler as EventListener);
  return () => target.removeEventListener("message", handler as EventListener);
}
