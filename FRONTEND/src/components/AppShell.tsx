"use client";

import { useEffect, useRef, useState } from "react";
import { useTraceStore } from "@/lib/store";
import { useAuth } from "./AuthProvider";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { CommandDashboard } from "./views/CommandDashboard";
import { TransfersView } from "./views/TransfersView";
import { GraphView } from "./views/GraphView";
import { CrimeCanvasView } from "./views/CrimeCanvasView";
import { MonitorView } from "./views/MonitorView";
import { TraceWalletView } from "./views/TraceWalletView";
import { InvestigatorChat } from "./views/InvestigatorChat";
import { LegalNoticesView } from "./views/LegalNoticesView";
import { VictimPortalView } from "./views/VictimPortalView";
import { AuditorPortalView } from "./views/AuditorPortalView";
import { ExchangePortalView } from "./views/ExchangePortalView";
import { CasesView } from "./views/CasesView";
import { NationalCoordinationView } from "./views/NationalCoordinationView";
import { SystemAdminView } from "./views/SystemAdminView";
import { allowedViews, landingView, type ViewKey } from "@/lib/access";

export type { ViewKey };

const LIVE_POLL_MS = 60_000;

export function AppShell() {
  const { user } = useAuth();
  const [view, setView] = useState<ViewKey>("dashboard");
  const [liveFeed, setLiveFeed] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [graphFocus, setGraphFocus] = useState<string[]>([]);

  // Land the user on their role's primary view whenever the identity changes.
  const prevUserRef = useRef<string | null>(null);
  useEffect(() => {
    if (!user) return;
    const userKey = `${user.id}:${user.role}`;
    if (prevUserRef.current !== userKey) {
      prevUserRef.current = userKey;
      setView(landingView(user.role));
    }
  }, [user?.id, user?.role]);

  const handleSetView = (targetView: ViewKey) => {
    if (!user) {
      setView(targetView);
      return;
    }
    const allowed = allowedViews(user.role);
    setView(allowed.includes(targetView) ? targetView : allowed[0]);
  };

  const { trace, status, refreshTrace } = useTraceStore();
  const hasTrace = !!trace;

  const refresh = useRef(refreshTrace);
  useEffect(() => {
    refresh.current = refreshTrace;
  }, [refreshTrace]);

  useEffect(() => {
    if (!liveFeed || !hasTrace || status !== "ready") return;
    void refresh.current();
    const id = setInterval(() => void refresh.current(), LIVE_POLL_MS);
    return () => clearInterval(id);
  }, [liveFeed, hasTrace, status]);

  const [chatMounted, setChatMounted] = useState(false);
  useEffect(() => {
    if (view === "chat") setChatMounted(true);
  }, [view]);

  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setNavOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOpen]);

  // Render gate. `view` is already constrained by handleSetView, but deriving
  // the rendered view from the allow-list too means a stale state value can
  // never mount a component the role is not entitled to.
  const permitted = user ? allowedViews(user.role) : (["dashboard"] as ViewKey[]);
  const active: ViewKey = permitted.includes(view) ? view : permitted[0];

  return (
    <div className="flex h-[100dvh] overflow-hidden" style={{ backgroundColor: "var(--bg)" }}>
      <Sidebar view={active} onChange={handleSetView} open={navOpen} onClose={() => setNavOpen(false)} />
      {navOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setNavOpen(false)}
          aria-hidden
        />
      )}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          view={active}
          liveFeed={liveFeed}
          onToggleFeed={() => setLiveFeed((v) => !v)}
          onOpenNav={() => setNavOpen(true)}
        />
        <main className="flex-1 min-h-0 min-w-0 overflow-y-auto scroll-stable">
          {active === "victim_portal" && <VictimPortalView />}
          {active === "audit_logs" && <AuditorPortalView />}
          {active === "exchange_portal" && <ExchangePortalView />}
          {active === "national_coordination" && <NationalCoordinationView />}
          {active === "system_admin" && <SystemAdminView />}
          {active === "cases" && (
            <CasesView
              onGoToTrace={() => handleSetView("trace")}
              onGoToGraph={() => handleSetView("graph")}
              onGoToNotices={() => handleSetView("notices")}
            />
          )}
          {active === "dashboard" && (
            <CommandDashboard
              liveFeed={liveFeed}
              onGoToTrace={() => handleSetView("trace")}
              onGoToCases={() => handleSetView("cases")}
              onGoToGraph={() => handleSetView("graph")}
              onGoToNotices={() => handleSetView("notices")}
              onGoToChat={() => handleSetView("chat")}
            />
          )}
          {active === "transfers" && <TransfersView onGoToTrace={() => handleSetView("trace")} />}
          {active === "graph" && (
            <GraphView
              focusAccounts={graphFocus}
              onClearFocus={() => setGraphFocus([])}
              onOpenNotices={() => handleSetView("notices")}
              onGoToTrace={() => handleSetView("trace")}
            />
          )}
          {active === "canvas" && <CrimeCanvasView onGoToTrace={() => handleSetView("trace")} />}
          {active === "monitor" && <MonitorView />}
          {active === "trace" && (
            <TraceWalletView
              onDone={() => handleSetView("dashboard")}
              onGoToGraph={() => handleSetView("graph")}
              onGoToNotices={() => handleSetView("notices")}
            />
          )}
          {chatMounted && permitted.includes("chat") && (
            <div hidden={active !== "chat"} className="h-full">
              <InvestigatorChat
                onOpenGraph={(accounts) => {
                  setGraphFocus(accounts);
                  handleSetView("graph");
                }}
              />
            </div>
          )}
          {active === "notices" && <LegalNoticesView onGoToTrace={() => handleSetView("trace")} />}
        </main>
      </div>
    </div>
  );
}
