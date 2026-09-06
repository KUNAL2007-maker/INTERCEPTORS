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

export type ViewKey =
  | "dashboard"
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

  // Automatically switch active view when role changes to give instant differentiated landing experience
  useEffect(() => {
    if (!user) return;
    if (user.role === "VICTIM") {
      setView("victim_portal");
    } else if (user.role === "AUDITOR") {
      setView("audit_logs");
    } else if (user.role === "EXCHANGE_NODAL_OFFICER") {
      setView("exchange_portal");
    } else {
      if (view === "victim_portal" || view === "exchange_portal" || (view === "audit_logs" && user.role !== "SUPER_ADMIN")) {
        setView("dashboard");
      }
    }
  }, [user?.role]);

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
      <Sidebar view={view} onChange={setView} open={navOpen} onClose={() => setNavOpen(false)} />
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
          {view === "dashboard" && (
            <CommandDashboard liveFeed={liveFeed} onGoToTrace={() => setView("trace")} />
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
