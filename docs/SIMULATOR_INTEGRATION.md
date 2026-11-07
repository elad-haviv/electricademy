# Connecting a simulator to Electricademy

A simulator (hv-edu, genset-edu, protect-edu, agl-edu, …) keeps working on its own. When it is
opened inside Electricademy (`/simulators/<slug>`), it can report progress and learn who is
signed in. All of this is optional and does nothing when the simulator runs standalone.

The protocol is `postMessage` between the iframe and the hub, versioned as `electricademy.sim.v1`.
The reference implementation is [`packages/sim-sdk`](../packages/sim-sdk/src/index.ts); it is
under 100 lines with no dependencies, so a simulator can copy it or use the plain snippet below.

## Messages

| Direction | `type` | Fields | When |
|---|---|---|---|
| Simulator → hub | `ready` | `simulator` | Once, after the app has loaded |
| Simulator → hub | `progress` | `simulator`, `module`, `percent` (0–100) | When the learner advances |
| Simulator → hub | `completed` | `simulator`, `module`, `score?` (0–100) | When a module/exercise is finished |
| Hub → simulator | `session` | `user` (`{ id, name, plan }` or `null`), `token` | In reply to `ready` |

Rules:
- Always post to the hub origin (`https://electricademy.haviv.pro`), never `"*"`.
- Accept `session` only from that origin.
- `module` is your own stable id (max 80 chars), e.g. `"B1"` or `"find-the-short"`. It shows on the learner's dashboard.
- Send `progress` freely; the hub keeps only improvements. The first `completed` per module awards XP.

## Minimal integration (no build step)

```html
<script>
  (function () {
    var HUB = "https://electricademy.haviv.pro";
    var P = "electricademy.sim.v1";
    var SIM = "agl-edu"; // the slug in the hub's simulator table
    if (window.parent === window) return; // standalone: do nothing

    function send(msg) {
      msg.protocol = P;
      msg.simulator = SIM;
      window.parent.postMessage(msg, HUB);
    }
    window.electricademy = {
      progress: function (module, percent) { send({ type: "progress", module: module, percent: percent }); },
      completed: function (module, score) { send({ type: "completed", module: module, score: score }); },
      session: null,
    };
    window.addEventListener("message", function (e) {
      if (e.origin !== HUB || !e.data || e.data.protocol !== P || e.data.type !== "session") return;
      window.electricademy.session = { user: e.data.user, token: e.data.token };
      window.dispatchEvent(new CustomEvent("electricademy:session", { detail: window.electricademy.session }));
    });
    send({ type: "ready" });
  })();
</script>
```

Then, wherever the lab knows the learner finished something:

```js
window.electricademy?.completed("find-the-short", 100);
```

## Gating Pro content inside a simulator

The `session.user.plan` value is a hint for the UI. Before unlocking anything that matters,
verify the token with the hub (CORS allows only the simulator's registered origin):

```js
const res = await fetch("https://electricademy.haviv.pro/api/sim/verify", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ simulator: "agl-edu", token: session.token }),
});
const { valid, user } = await res.json(); // user.plan: "free" | "pro"
```

Tokens last 15 minutes and are bound to one simulator. Note that a simulator served from its own
public URL can always be opened directly, so this protects Pro *content inside* the lab, not the
URL itself; serving the lab only through the hub (proxy or auth) is a separate step.
