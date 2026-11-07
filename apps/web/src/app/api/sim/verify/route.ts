import { verifySimToken } from "@electricademy/auth/sim-token";
import { getSimulator, listSimulators, simulatorOrigin } from "@/lib/simulators";

/**
 * POST { simulator, token } → { valid, user? }
 * Lets an embedded simulator confirm who the hub says is signed in, and their plan, before
 * unlocking Pro content. CORS is open only to the origin registered for that simulator.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { simulator?: unknown; token?: unknown } | null;
  const slug = typeof body?.simulator === "string" ? body.simulator : "";
  const sim = slug ? await getSimulator(slug) : null;
  const allowOrigin = sim ? simulatorOrigin(sim) : null;
  const origin = request.headers.get("origin");
  const cors: Record<string, string> = origin && origin === allowOrigin ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" } : { Vary: "Origin" };

  const secret = process.env.AUTH_SECRET ?? "";
  const claims = sim && typeof body?.token === "string" ? verifySimToken(body.token, secret, sim.slug) : null;
  if (!claims) return Response.json({ valid: false }, { status: 401, headers: cors });
  return Response.json(
    { valid: true, user: { id: claims.sub, name: claims.name, plan: claims.plan }, expiresAt: claims.exp },
    { headers: { ...cors, "Cache-Control": "no-store" } },
  );
}

/** CORS preflight: simulators send JSON, which needs one. Allowed for any registered simulator origin. */
export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin") ?? "";
  const allowed = (await listSimulators()).some((s) => simulatorOrigin(s) === origin);
  return new Response(null, {
    status: 204,
    headers: allowed
      ? {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
          Vary: "Origin",
        }
      : { Vary: "Origin" },
  });
}
