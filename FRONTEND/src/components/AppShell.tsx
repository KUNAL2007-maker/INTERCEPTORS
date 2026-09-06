"use client";

import { useEffect, useRef, useState } from "react";
import { useTraceStore } from "@/lib/store";
import { useAuth } from "./AuthProvider";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { CommandDashboard } from "./views/CommandDashboard";
import { TransfersView } from "./views/TransfersView";
import { GraphView } from "./views/GraphView";
import { TraceWalletView } from "./views/TraceWalletView";
import { InvestigatorChat } from "./views/InvestigatorChat";
import { LegalNoticesView } from "./views/LegalNoticesView";
import { VictimPortalView } from "./views/VictimPortalView";
import { AuditorPortalView } from "./views/AuditorPortalView";
import { ExchangePortalView } from "./views/ExchangePortalView";
import { CasesView } from "./views/CasesView";

export type ViewKey =
  | "dashboard"
  | "cases"
  | "transfers"
  | "graph"
  | "trace"
  | "chat"
  | "notices"
  | "victim_portal"
  | "audit_logs"
  | "exchange_portal";

const LIVE_POLL_MS = 60_000;

export function AppShell() {
  const { user } = useAuth();
  const [view, setView] = useState<ViewKey>("dashboard");
  const [liveFeed, setLiveFeed] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [graphFocus, setGraphFocus] = useState<string[]>([]);

  const ROLE_ALLOWED_VIEWS: Record<string, ViewKey[]> = {
    VICTIM: ["victim_portal"],
    AUDITOR: ["audit_logs", "dashboard", "cases", "graph"],
    EXCHANGE_NODAL_OFFICER: ["exchange_portal", "notices"],
    NORMAL_INVESTIGATOR: ["dashboard", "cases", "trace", "graph", "transfers", "notices", "chat"],
    SENIOR_INVESTIGATOR: ["dashboard", "cases", "trace", "graph", "transfers", "notices", "chat", "audit_logs"],
    WORKSPACE_ADMIN: ["dashboard", "cases", "trace", "graph", "transfers", "notices", "chat", "audit_logs"],
    SUPER_ADMIN: ["dashboard", "cases", "trace", "graph", "transfers", "notices", "chat", "audit_logs"],
  };

  // Enforce role-differentiated view access and automatically switch to primary landing view
  useEffect(() => {
    if (!user) return;
    const allowed = ROLE_ALLOWED_VIEWS[user.role] || ["dashboard"];
    if (!allowed.includes(view)) {
      setView(allowed[0]);
    }
  }, [user?.role]);

  const handleSetView = (targetView: ViewKey) => {
    if (!user) {
      setView(targetView);
      return;
    }
    const allowed = ROLE_ALLOWED_VIEWS[user.role] || ["dashboard"];
    if (allowed.includes(targetView)) {
      setView(targetView);
    } else {
      setView(allowed[0]);
    }
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

  return (
    <div className="flex h-[100dvh] overflow-hidden radial-glow" style={{ backgroundColor: "var(--bg)" }}>
      <Sidebar view={view} onChange={handleSetView} open={navOpen} onClose={() => setNavOpen(false)} />
      {navOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setNavOpen(false)}
          aria-hidden
        />
      )}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          view={view}
          liveFeed={liveFeed}
          onToggleFeed={() => setLiveFeed((v) => !v)}
          onOpenNav={() => setNavOpen(true)}
        />
        <main className="flex-1 min-h-0 min-w-0 overflow-y-auto scroll-stable">
          {view === "victim_portal" && <VictimPortalView />}
          {view === "audit_logs" && <AuditorPortalView />}
          {view === "exchange_portal" && <ExchangePortalView />}
          {view === "cases" && (
            <CasesView
              onGoToTrace={() => setView("trace")}
              onGoToGraph={() => setView("graph")}
              onGoToNotices={() => setView("notices")}
            />
          )}
          {view === "dashboard" && (
            <CommandDashboard
              liveFeed={liveFeed}
              onGoToTrace={() => setView("trace")}
              onGoToCases={() => setView("cases")}
            />
          )}
          {view === "transfers" && <TransfersView onGoToTrace={() => setView("trace")} />}
          {view === "graph" && (
            <GraphView
              focusAccounts={graphFocus}
              onClearFocus={() => setGraphFocus([])}
              onOpenNotices={() => setView("notices")}
              onGoToTrace={() => setView("trace")}
            />
          )}
          {view === "trace" && <TraceWalletView onDone={() => setView("dashboard")} />}
          {chatMounted && (
            <div hidden={view !== "chat"} className="h-full">
              <InvestigatorChat
                onOpenGraph={(accounts) => {
                  setGraphFocus(accounts);
                  setView("graph");
                }}
              />
            </div>
          )}
          {view === "notices" && <LegalNoticesView onGoToTrace={() => setView("trace")} />}
        </main>
      </div>
    </div>
  );
}
