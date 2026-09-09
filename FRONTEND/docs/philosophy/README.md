# Philosophy and Reference Documentation

## Provenance

These documents were imported (ported/copied verbatim as Markdown) from the public
repository **github.com/techyhafiz/SIH2K26**, specifically:

- `PROTOTYPE_01_PHILOSOPHY/` — the project philosophy, algorithm decisions, stack and
  data architecture, and AI/ML doctrine notes. Mirrored here under
  `PROTOTYPE_01_PHILOSOPHY/`.
- `HAFIZ/` — the HAFIZ reference set: the ALCHEMY_ENCYCLOPEDIA (11-part API reference
  plus its README), the ALCHEMY master handbook / deep-crawl / platform-and-RPC specs,
  the BLOCKCHAIN_FOUNDATIONS_AND_MULTI_CHAIN_GUIDE, the HAFIZ_DIARY and its cheat sheet,
  and the D1/D2 monitor and graph module READMEs. Mirrored here under `HAFIZ_GUIDES/`.

Imported on 2026-09-09.

## Status: reference material only

This directory is **reference documentation**, not runtime code. It informs and provides
background for the application's existing grounding firewall and its blockchain/Alchemy
data handling; nothing here is imported, executed, or otherwise wired into the running
app. Only Markdown documentation was copied — no Python, no application code, and no
dependency manifests were brought across from the source repository.

## Security note: redacted credentials

The source repository contained a live Alchemy API key committed in plaintext (inside
Python source files, which were **not** copied here). That key must be treated as
**compromised and burned**. As a safeguard, every file written into this directory was
scanned and any real API key or secret pattern (Alchemy provider keys, OpenAI-style
secret keys, Google API keys, and the specific leaked key) was replaced with:

    <REDACTED — compromised key, rotate before any use>

The imported Markdown contained no real secret values — only documentation placeholders
such as `{apiKey}` and `YOUR_API_KEY`, which were intentionally left intact because they
are illustrative, not credentials. Any Alchemy (or other provider) credential referenced
by these documents must be freshly provisioned and rotated before use; do not attempt to
reuse anything from the upstream source.
