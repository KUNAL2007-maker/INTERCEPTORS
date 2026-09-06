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
import { NationalCoordinationView } from "./views/NationalCoordinationView";
import { SystemAdminView } from "./views/SystemAdminView";
import { normalizeRole } from "@/lib/rbac-abac";

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
  | "exchange_portal"
  | "national_coordination"
  | "system_admin";

const LIVE_POLL_MS = 60_000;

export function AppShell() {
  const { user } = useAuth();
  const [view, setView] = useState<ViewKey>("dashboard");
  const [liveFeed, setLiveFeed] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [graphFocus, setGraphFocus] = useState<string[]>([]);

  const ROLE_ALLOWED_VIEWS: Record<string, ViewKey[]> = {
    VICTIM: ["victim_portal"],
    COURT_REVIEWER: ["cases", "audit_logs", "graph"],
    VASP_COMPLIANCE_OFFICER: ["exchange_portal"],
    NATIONAL_COORDINATION_ANALYST: ["national_coordination"],
    SYSTEM_ADMIN: ["system_admin", "audit_logs"],
    INVESTIGATING_OFFICER: ["dashboard", "graph", "chat", "notices"],
    CYBERCRIME_SUPERVISOR: ["dashboard", "audit_logs", "cases"],
    SENIOR_INVESTIGATOR: ["dashboard", "graph", "notices", "audit_logs", "cases"],

    // Legacy role aliases for backward compatibility
    AUDITOR: ["cases", "audit_logs", "graph"],
    EXCHANGE_NODAL_OFFICER: ["exchange_portal"],
    NORMAL_INVESTIGATOR: ["dashboard", "graph", "chat", "notices"],
    WORKSPACE_ADMIN: ["dashboard", "audit_logs", "cases"],
    SUPER_ADMIN: ["system_admin", "audit_logs"]
  };

  // Enforce role-differentiated view access and automatically switch to primary landing view on user/role switch
  const prevUserRef = useRef<string | null>(null);
  useEffect(() => {
    if (!user) return;
    const userKey = `${user.id}:${user.role}`;
    if (prevUserRef.current !== userKey) {
      prevUserRef.current = userKey;
      const norm = normalizeRole(user.role);
      const allowed = ROLE_ALLOWED_VIEWS[norm] || ROLE_ALLOWED_VIEWS[user.role] || ["dashboard"];
      setView(allowed[0]);
    }
  }, [user?.id, user?.role]);

  const handleSetView = (targetView: ViewKey) => {
    if (!user) {
      setView(targetView);
      return;
    }
    const norm = normalizeRole(user.role);
    const allowed = ROLE_ALLOWED_VIEWS[norm] || ROLE_ALLOWED_VIEWS[user.role] || ["dashboard"];
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
          {view === "national_coordination" && <NationalCoordinationView />}
          {view === "system_admin" && <SystemAdminView />}
          {view === "cases" && (
            <CasesView
              onGoToTrace={() => handleSetView("trace")}
              onGoToGraph={() => handleSetView("graph")}
              onGoToNotices={() => handleSetView("notices")}
            />
          )}
          {view === "dashboard" && (
            <CommandDashboard
              liveFeed={liveFeed}
              onGoToTrace={() => handleSetView("trace")}
              onGoToCases={() => handleSetView("cases")}
              onGoToGraph={() => handleSetView("graph")}
              onGoToNotices={() => handleSetView("notices")}
              onGoToChat={() => handleSetView("chat")}
            />
          )}
          {view === "transfers" && <TransfersView onGoToTrace={() => handleSetView("trace")} />}
          {view === "graph" && (
            <GraphView
              focusAccounts={graphFocus}
              onClearFocus={() => setGraphFocus([])}
              onOpenNotices={() => handleSetView("notices")}
              onGoToTrace={() => handleSetView("trace")}
            />
          )}
          {view === "trace" && (
            <TraceWalletView
              onDone={() => handleSetView("dashboard")}
              onGoToGraph={() => handleSetView("graph")}
              onGoToNotices={() => handleSetView("notices")}
            />
          )}
          {chatMounted && (
            <div hidden={view !== "chat"} className="h-full">
              <InvestigatorChat
                onOpenGraph={(accounts) => {
                  setGraphFocus(accounts);
                  handleSetView("graph");
                }}
              />
            </div>
          )}
          {view === "notices" && <LegalNoticesView onGoToTrace={() => handleSetView("trace")} />}
        </main>
      </div>
    </div>
  );
}
