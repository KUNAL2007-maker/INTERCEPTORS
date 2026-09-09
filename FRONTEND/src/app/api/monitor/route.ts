import { NextResponse } from "next/server";
import { extractUserClaims } from "@/lib/auth-crypto";
import { getUserById, recordAuditLog } from "@/lib/db";
import { normalizeRole, hasPermission, PERMISSIONS } from "@/lib/rbac-abac";
import { getMonitor } from "@/lib/monitor";

// The monitor holds live process state (the background loop + subscribers) and
// reaches providers, so this must run on the Node.js runtime, not the Edge one.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AuditUser = { id: string | number; name: string; role: string };

function audit(user: AuditUser, action: string, decision: "GRANTED" | "DENIED", reason: string) {
  recordAuditLog({
    user_id: user.id,
    user_name: user.name,
    user_role: user.role,
    action,
    resource_type: "WALLET_MONITOR",
    decision,
    reason,
  });
}

/** Resolve the caller and confirm they hold wallet:monitor, or return a Response. */
async function gate(
  req: Request
): Promise<{ user: AuditUser } | { error: NextResponse }> {
  const claims = await extractUserClaims(req);
  if (!claims) {
    return {
      error: NextResponse.json(
        { error: "Unauthorized: authentication required for wallet monitoring." },
        { status: 401 }
      ),
    };
  }
  const user = (getUserById(claims.id) || (claims as unknown)) as AuditUser;
  const role = normalizeRole(user.role);
  if (!hasPermission(role, PERMISSIONS.WALLET_MONITOR)) {
    audit(user, "MONITOR_ACCESS", "DENIED", `Access Denied: ${user.role} does not hold wallet:monitor.`);
    return {
      error: NextResponse.json(
        { error: "Access Denied: your role cannot use real-time wallet monitoring." },
        { status: 403 }
      ),
    };
  }
  return { user };
}

// GET — current monitor state (watchlist, recent alerts, quota, status). Reading
// this also lazily starts the background loop, so opening the Monitor view is
// what brings the loop to life; it stays idle until then.
export async function GET(req: Request) {
  const g = await gate(req);
  if ("error" in g) return g.error;

  const monitor = getMonitor();
  monitor.ensureStarted();
  return NextResponse.json(monitor.snapshot());
}

// POST — mutate the watchlist. { action: "add" | "remove" | "pause" | "resume", ... }
export async function POST(req: Request) {
  const g = await gate(req);
  if ("error" in g) return g.error;
  const { user } = g;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const action = typeof body.action === "string" ? body.action : "";
  const monitor = getMonitor();
  monitor.ensureStarted();

  try {
    switch (action) {
      case "add": {
        const seed = typeof body.seed === "string" ? body.seed : "";
        const label = typeof body.label === "string" ? body.label : undefined;
        const caseRef = typeof body.caseRef === "string" ? body.caseRef : undefined;
        const res = monitor.addWatch({ seed, label, caseRef, addedBy: user.name });
        if (!res.ok) {
          return NextResponse.json({ error: res.error }, { status: 400 });
        }
        audit(user, "MONITOR_WATCH_ADD", "GRANTED", `Added ${res.watch.chain} address ${res.watch.seed} to the watchlist.`);
        return NextResponse.json({ ok: true, watch: res.watch, snapshot: monitor.snapshot() });
      }
      case "remove": {
        const key = typeof body.key === "string" ? body.key : "";
        const removed = monitor.removeWatch(key);
        if (removed) audit(user, "MONITOR_WATCH_REMOVE", "GRANTED", `Removed ${key} from the watchlist.`);
        return NextResponse.json({ ok: removed, snapshot: monitor.snapshot() });
      }
      case "pause":
      case "resume": {
        const key = typeof body.key === "string" ? body.key : "";
        const ok = monitor.setPaused(key, action === "pause");
        if (ok) audit(user, "MONITOR_WATCH_TOGGLE", "GRANTED", `${action === "pause" ? "Paused" : "Resumed"} ${key}.`);
        return NextResponse.json({ ok, snapshot: monitor.snapshot() });
      }
      default:
        return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }
  } catch (err) {
    console.error("[CryptoTrace] monitor API error:", err);
    return NextResponse.json({ error: "The monitor service errored." }, { status: 500 });
  }
}
