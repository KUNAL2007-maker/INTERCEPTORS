"use client";

// Brand logo marks for the Transaction Flow graph.
//
// The forensic canvas used to draw every wallet as an abstract glyph (a wallet
// icon, a bank, a chain-coloured dot). This module replaces those with the real
// coin and exchange marks so an officer reads the network the way they read a
// portfolio: the coin token says which asset a wallet holds, the exchange token
// says which VASP a freeze notice must go to. The forensic *role* still comes
// from the coloured ring the renderer draws around each token (red victim, gray
// intermediate, purple relayer, green exchange) — the logo only carries identity.
//
// Everything is hand-inlined SVG (no network fetch, no /public assets) so the
// marks stay crisp at any zoom, render identically offline in a demo, and never
// depend on a CDN that could fail in front of a jury. Each logo is authored on a
// 0..32 viewBox and drawn centred on (0,0) via a scaled <g>, so it drops into an
// already-translated node group or a standalone <svg> wrapper unchanged.

import { useId } from "react";
import type { Chain } from "./domain";

// Draw children (authored in a 0..32 box) centred on the origin at `size` px.
function Centered({ size, children }: { size: number; children: React.ReactNode }) {
  const s = size / 32;
  return <g transform={`translate(${-size / 2} ${-size / 2}) scale(${s})`}>{children}</g>;
}

// ── Coin marks (chain → native asset) ────────────────────────────────────────
// Each is a full token: brand-coloured disc + white mark, matching the coins as
// they appear in any wallet UI. Keyed off the wallet's chain.

function EthereumMark() {
  return (
    <>
      <circle cx="16" cy="16" r="16" fill="#627EEA" />
      <g fill="#fff" fillRule="nonzero">
        <path fillOpacity=".602" d="M16.498 4v8.87l7.497 3.35z" />
        <path d="M16.498 4L9 16.22l7.498-3.35z" />
        <path fillOpacity=".602" d="M16.498 21.968v6.027L24 17.616z" />
        <path d="M16.498 27.995v-6.028L9 17.616z" />
        <path fillOpacity=".2" d="M16.498 20.573l7.497-4.353-7.497-3.348z" />
        <path fillOpacity=".602" d="M9 16.22l7.498 4.353v-7.701z" />
      </g>
    </>
  );
}

function BitcoinMark() {
  return (
    <>
      <circle cx="16" cy="16" r="16" fill="#F7931A" />
      <path
        fill="#fff"
        d="M23.189 14.02c.314-2.096-1.283-3.223-3.465-3.975l.708-2.84-1.728-.43-.69 2.765c-.454-.114-.92-.22-1.385-.326l.695-2.783L15.596 6l-.708 2.839c-.376-.086-.746-.17-1.104-.26l.002-.009-2.384-.595-.46 1.846s1.283.294 1.256.312c.7.175.826.638.805 1.006l-.806 3.235c.048.012.11.03.18.057l-.183-.045-1.13 4.532c-.086.212-.303.531-.793.41.018.025-1.256-.313-1.256-.313l-.858 1.978 2.25.561c.418.105.828.215 1.231.318l-.715 2.872 1.727.43.708-2.84c.472.127.93.245 1.378.357l-.706 2.828 1.728.43.715-2.866c2.948.558 5.164.333 6.097-2.333.752-2.146-.037-3.385-1.588-4.192 1.13-.26 1.98-1.003 2.207-2.538zm-3.95 5.538c-.533 2.147-4.148.986-5.32.695l.95-3.805c1.172.293 4.929.872 4.37 3.11zm.535-5.569c-.487 1.953-3.495.96-4.47.717l.86-3.45c.975.243 4.118.696 3.61 2.733z"
      />
    </>
  );
}

function TronMark() {
  return (
    <>
      <circle cx="16" cy="16" r="16" fill="#EF0027" />
      <path
        fill="#fff"
        d="M21.932 9.913L7.5 7.257l7.595 19.112 10.583-12.894-3.746-3.562zm-.232 1.17l2.208 2.099-6.038 1.093 3.83-3.192zm-5.142 2.973l-6.364-5.278 10.402 1.914-4.038 3.364zm-.453.933l-1.038 8.58L9.472 9.487l6.633 5.502zm.96.455l6.687-1.21-7.67 9.343.983-8.133z"
      />
    </>
  );
}

function PolygonMark() {
  return (
    <>
      <circle cx="16" cy="16" r="16" fill="#8247E5" />
      <path
        fill="#fff"
        d="M21.092 12.693c-.369-.215-.848-.215-1.254 0l-2.879 1.654-1.955 1.078-2.879 1.653c-.369.216-.848.216-1.254 0l-2.288-1.294c-.369-.215-.627-.61-.627-1.042v-2.547c0-.431.221-.826.627-1.042l2.25-1.257c.37-.215.85-.215 1.256 0l2.25 1.257c.369.216.627.61.627 1.042v1.654l1.955-1.115v-1.653c0-.431-.221-.826-.627-1.042l-4.17-2.372c-.369-.215-.848-.215-1.254 0l-4.245 2.372c-.406.216-.627.61-.627 1.042v4.77c0 .43.221.825.627 1.04l4.245 2.373c.369.215.848.215 1.254 0l2.879-1.618 1.955-1.114 2.879-1.617c.369-.216.848-.216 1.254 0l2.25 1.257c.37.215.628.61.628 1.042v2.546c0 .432-.222.827-.628 1.042l-2.25 1.294c-.369.216-.848.216-1.254 0l-2.25-1.257c-.369-.216-.627-.61-.627-1.042v-1.653l-1.955 1.114v1.654c0 .431.221.826.627 1.042l4.245 2.372c.369.216.848.216 1.254 0l4.245-2.372c.369-.216.627-.61.627-1.042v-4.77c0-.431-.221-.826-.627-1.042l-4.208-2.41z"
      />
    </>
  );
}

function SolanaMark({ gradientId }: { gradientId: string }) {
  return (
    <>
      <circle cx="16" cy="16" r="16" fill="#131722" />
      <defs>
        <linearGradient id={gradientId} x1="4" y1="24" x2="28" y2="8" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#9945FF" />
          <stop offset="1" stopColor="#14F195" />
        </linearGradient>
      </defs>
      <g fill={`url(#${gradientId})`}>
        <path d="M9.925 19.687a.59.59 0 0 1 .415-.17h14.366a.29.29 0 0 1 .207.497l-2.838 2.815a.59.59 0 0 1-.415.171H7.294a.291.291 0 0 1-.207-.498l2.838-2.815z" />
        <path d="M9.925 9.17A.59.59 0 0 1 10.34 9h14.366a.29.29 0 0 1 .207.497l-2.838 2.815a.59.59 0 0 1-.415.171H7.294a.291.291 0 0 1-.207-.498L9.925 9.17z" />
        <path d="M22.075 14.395a.59.59 0 0 0-.415-.17H7.294a.291.291 0 0 0-.207.497l2.838 2.815c.11.109.26.17.415.17h14.366a.291.291 0 0 0 .207-.498l-2.838-2.814z" />
      </g>
    </>
  );
}

/**
 * The coin token for a wallet's chain, centred on (0,0) and scaled to `size`
 * (full diameter). Drop it inside a node's translated <g>, or inside a
 * standalone <svg viewBox="-16 -16 32 32"> for the legend.
 */
export function CoinLogo({ chain, size }: { chain: Chain; size: number }) {
  // useId keeps the Solana gradient unique per instance; strip ":" so the id is
  // a valid url(#…) reference in every browser.
  const gradientId = `sol-${useId().replace(/:/g, "")}`;
  return (
    <Centered size={size}>
      {chain === "ETHEREUM" && <EthereumMark />}
      {chain === "BITCOIN" && <BitcoinMark />}
      {chain === "TRON" && <TronMark />}
      {chain === "POLYGON" && <PolygonMark />}
      {chain === "SOLANA" && <SolanaMark gradientId={gradientId} />}
    </Centered>
  );
}

// ── Exchange / VASP marks ────────────────────────────────────────────────────
// Binance and Kraken carry their real, drawable marks (the four-diamond "B" and
// the tentacle silhouette). The Indian and offshore desks that have no simple
// vector mark get a branded monogram token — the exact brand colour plus a bold
// initial, the same "app-icon" treatment real trading dashboards use. Anything
// unrecognised falls back to a generic exchange (bank) token so it still reads
// as a VASP freeze target.

type ExchangeKey = "binance" | "wazirx" | "coindcx" | "kraken" | "kucoin" | "generic";

// Match a free-text VASP name ("Binance", "Binance International", "WazirX …")
// to a known mark, case- and suffix-insensitively.
function exchangeKey(name?: string | null): ExchangeKey {
  const n = (name ?? "").toLowerCase();
  if (!n.trim()) return "generic";
  if (n.includes("binance")) return "binance";
  if (n.includes("wazirx") || n.includes("wazir")) return "wazirx";
  if (n.includes("coindcx") || n.includes("dcx")) return "coindcx";
  if (n.includes("kraken")) return "kraken";
  if (n.includes("kucoin")) return "kucoin";
  return "generic";
}

/** True when we hold a dedicated mark for this VASP (vs. the generic fallback). */
export function hasExchangeLogo(name?: string | null): boolean {
  return exchangeKey(name) !== "generic";
}

// The five VASP marks we showcase in the legend, in a stable order.
export const EXCHANGE_LEGEND: { name: string; label: string }[] = [
  { name: "Binance", label: "Binance" },
  { name: "WazirX", label: "WazirX" },
  { name: "CoinDCX", label: "CoinDCX" },
  { name: "Kraken", label: "Kraken" },
  { name: "KuCoin", label: "KuCoin" },
];

// A brand-coloured disc with a bold white initial — the monogram fallback.
function Monogram({ color, letter }: { color: string; letter: string }) {
  return (
    <>
      <circle cx="16" cy="16" r="16" fill={color} />
      <text
        x="16"
        y="16.5"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="17"
        fontWeight={800}
        fill="#fff"
        fontFamily="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
      >
        {letter}
      </text>
    </>
  );
}

function BinanceMark() {
  return (
    <>
      <circle cx="16" cy="16" r="16" fill="#F3BA2F" />
      <path
        fill="#fff"
        d="M12.116 14.404L16 10.52l3.886 3.886 2.26-2.26L16 6l-6.144 6.144 2.26 2.26zM6 16l2.26-2.26L10.52 16l-2.26 2.26L6 16zm6.116 1.596L16 21.48l3.886-3.886 2.26 2.259L16 26l-6.144-6.144-.003-.003 2.263-2.257zM21.48 16l2.26-2.26L26 16l-2.26 2.26L21.48 16zm-3.188-.002h.002V16L16 18.294l-2.291-2.29-.004-.004.004-.003.401-.402.195-.195L16 13.706l2.293 2.293z"
      />
    </>
  );
}

function KrakenMark() {
  // Purple disc + a stylised tentacle silhouette: a dome with four legs.
  return (
    <>
      <circle cx="16" cy="16" r="16" fill="#5741D9" />
      <path
        fill="#fff"
        d="M16 6.4c-4.42 0-8 3.44-8 7.68v9.2c0 .73.6 1.32 1.34 1.32.74 0 1.34-.59 1.34-1.32v-3.09c0-.4.66-.4.66 0v3.09c0 .73.6 1.32 1.33 1.32.74 0 1.34-.59 1.34-1.32v-3.09c0-.4.66-.4.66 0v3.09c0 .73.6 1.32 1.33 1.32.74 0 1.34-.59 1.34-1.32v-3.09c0-.4.66-.4.66 0v3.09c0 .73.6 1.32 1.34 1.32.73 0 1.33-.59 1.33-1.32v-9.2C24 9.84 20.42 6.4 16 6.4z"
      />
    </>
  );
}

function GenericExchangeMark() {
  // Neutral teal disc + a bank/building glyph — reads as "exchange, freeze here".
  return (
    <>
      <circle cx="16" cy="16" r="16" fill="#0f9d76" />
      <g stroke="#fff" strokeWidth="1.8" strokeLinecap="round" fill="none">
        <path d="M8 13 L16 8 L24 13" />
        <line x1="10" y1="13" x2="10" y2="22" />
        <line x1="14" y1="13" x2="14" y2="22" />
        <line x1="18" y1="13" x2="18" y2="22" />
        <line x1="22" y1="13" x2="22" y2="22" />
        <line x1="7.5" y1="22.5" x2="24.5" y2="22.5" />
      </g>
    </>
  );
}

/**
 * The exchange token for a VASP name, centred on (0,0) and scaled to `size`
 * (full diameter). Falls back to a generic bank token for unknown desks.
 */
export function ExchangeLogo({ vasp, size }: { vasp?: string | null; size: number }) {
  const key = exchangeKey(vasp);
  return (
    <Centered size={size}>
      {key === "binance" && <BinanceMark />}
      {key === "kraken" && <KrakenMark />}
      {key === "wazirx" && <Monogram color="#2C6DF6" letter="W" />}
      {key === "coindcx" && <Monogram color="#4C5CE0" letter="D" />}
      {key === "kucoin" && <Monogram color="#23AF91" letter="K" />}
      {key === "generic" && <GenericExchangeMark />}
    </Centered>
  );
}
