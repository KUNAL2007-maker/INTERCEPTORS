import { NextResponse } from "next/server";

// Liveness probe for Render's health check (and uptime monitors). Deliberately
// unauthenticated and side-effect free so it works before any login: it reports
// that the Next.js process is up and which optional integrations are CONFIGURED
// — by presence of the env var, not by reaching the service, and never the
// secret value itself.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "interceptors-web",
    time: new Date().toISOString(),
    integrations: {
      mlSidecar: Boolean(process.env.ML_SERVICE_URL),
      neo4j: Boolean(process.env.NEO4J_URI),
      alchemy: Boolean(process.env.ALCHEMY_API_KEY),
      trongrid: Boolean(process.env.TRONGRID_API_KEY),
      gemini: Boolean(process.env.GEMINI_API_KEY),
    },
  });
}
