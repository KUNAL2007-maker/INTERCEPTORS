import { extractUserClaims } from "@/lib/auth-crypto";
import { getUserById, recordAuditLog } from "@/lib/db";
import { normalizeRole, hasPermission, PERMISSIONS } from "@/lib/rbac-abac";
import { getMonitor, type MonitorEvent } from "@/lib/monitor";

// A long-lived Server-Sent Events stream: the browser opens ONE EventSource and
// receives alerts as the server detects them, so the client never polls the
// chain itself. Node.js runtime (holds an open stream + process state); must not
// be statically cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Nudge past proxy buffers every 25s so the connection is not reaped as idle
// during quiet periods (Render's router, corporate proxies).
const HEARTBEAT_MS = 25_000;

export async function GET(req: Request) {
  // EventSource authenticates via the same-origin `auth_token` cookie the browser
  // sends automatically — extractUserClaims reads it exactly as the other routes do.
  const claims = await extractUserClaims(req);
  if (!claims) {
    return new Response("Unauthorized", { status: 401 });
  }
  const user = (getUserById(claims.id) || (claims as unknown)) as { id: string | number; name: string; role: string };
  const role = normalizeRole(user.role);
  if (!hasPermission(role, PERMISSIONS.WALLET_MONITOR)) {
    recordAuditLog({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      action: "MONITOR_STREAM",
      resource_type: "WALLET_MONITOR",
      decision: "DENIED",
      reason: `Access Denied: ${user.role} does not hold wallet:monitor.`,
    });
    return new Response("Forbidden", { status: 403 });
  }

  const monitor = getMonitor();
  monitor.ensureStarted();

  const encoder = new TextEncoder();
  let closed = false;
  let unsubscribe: (() => void) | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (evt: MonitorEvent | { type: "comment" }) => {
        if (closed) return;
        try {
          if (evt.type === "comment") {
            controller.enqueue(encoder.encode(`: ping\n\n`));
          } else {
            controller.enqueue(encoder.encode(`event: ${evt.type}\ndata: ${JSON.stringify(evt.data)}\n\n`));
          }
        } catch {
          cleanup(); // controller already closed
        }
      };

      const cleanup = () => {
        if (closed) return;
        closed = true;
        if (unsubscribe) unsubscribe();
        if (heartbeat) clearInterval(heartbeat);
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      // 1) Prime the client with the full current state.
      send({ type: "snapshot", data: monitor.snapshot() });
      // 2) Stream every subsequent monitor event.
      unsubscribe = monitor.subscribe(send);
      // 3) Keep-alive.
      heartbeat = setInterval(() => send({ type: "comment" }), HEARTBEAT_MS);
      // 4) Tear down when the client disconnects.
      req.signal.addEventListener("abort", cleanup);
      if (req.signal.aborted) cleanup();
    },
    cancel() {
      closed = true;
      if (unsubscribe) unsubscribe();
      if (heartbeat) clearInterval(heartbeat);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Disable proxy buffering (nginx and friends) so events flush immediately.
      "X-Accel-Buffering": "no",
    },
  });
}
