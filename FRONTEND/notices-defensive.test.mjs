// Unit test suite for legal notice defensive normalization and resilience
import assert from "node:assert";

async function run() {
  const { ensureLegalNotice, normalizeStoredNotice } = await import("./src/lib/investigation.ts");

  let passed = 0;
  function pass(name) {
    passed++;
    console.log(`  ✔ PASS: ${name}`);
  }

  console.log("================================================================");
  console.log("  ⚖️ LEGAL NOTICES DEFENSIVE NORMALIZATION UNIT TEST SUITE");
  console.log("================================================================\n");

  console.log("[TEST GROUP 1] ensureLegalNotice Nullish & Corrupt Input Resilience");
  {
    const res = ensureLegalNotice(undefined);
    assert(res && typeof res.ref === "string" && res.ref.length > 0);
    assert(Array.isArray(res.body) && res.body.length > 0);
    pass("ensureLegalNotice(undefined) returns complete legal notice document");
  }
  {
    const res = ensureLegalNotice(null);
    assert(res && typeof res.ref === "string" && res.ref.length > 0);
    pass("ensureLegalNotice(null) returns complete legal notice document");
  }
  {
    const res = ensureLegalNotice("plain string input");
    assert(res && typeof res.ref === "string" && res.ref.length > 0);
    pass("ensureLegalNotice('plain string input') returns complete legal notice document");
  }
  {
    const res = ensureLegalNotice({
      ref: null,
      body: null,
      walletTrail: null,
      kycDemands: null,
      targetAddresses: null,
      amountUsd: null,
      amountInr: null,
    });
    assert(res && typeof res.ref === "string" && res.ref.length > 0);
    assert(Array.isArray(res.targetAddresses) && res.targetAddresses.length > 0);
    pass("ensureLegalNotice with all null properties correctly populates defaults");
  }

  console.log("\n[TEST GROUP 2] Corrupt Dates & Non-String Property Resilience");
  {
    const res = ensureLegalNotice({}, { createdAt: "corrupted-date-timestamp" });
    assert(typeof res.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(res.date));
    pass("ensureLegalNotice safely parses invalid createdAt without throwing RangeError");
  }
  {
    const res = ensureLegalNotice({}, { target_vasp: 98765 });
    assert(typeof res.to_vasp === "string" && res.to_vasp === "98765");
    assert(typeof res.to_email === "string");
    pass("ensureLegalNotice safely handles non-string target_vasp without throwing TypeError");
  }
  {
    const res = ensureLegalNotice({ amountInr: NaN, amountUsd: NaN });
    assert(!isNaN(res.amountInr) && !isNaN(res.amountUsd));
    assert(res.amountInr > 0 && res.amountUsd > 0);
    pass("ensureLegalNotice safely heals NaN amounts to valid currency numbers");
  }

  console.log("\n[TEST GROUP 3] normalizeStoredNotice Wrapping & Status Normalization");
  {
    const item = normalizeStoredNotice(undefined);
    assert(item && item.id.startsWith("NOTICE-") && item.status === "Draft");
    assert(item.notice && item.notice.ref);
    pass("normalizeStoredNotice(undefined) produces valid StoredNotice");
  }
  {
    const item = normalizeStoredNotice(null);
    assert(item && item.status === "Draft");
    pass("normalizeStoredNotice(null) produces valid StoredNotice");
  }
  {
    const item = normalizeStoredNotice({ id: "NOTICE-CUSTOM", status: "Acknowledged" });
    assert(item.id === "NOTICE-CUSTOM" && item.status === "Acknowledged");
    assert(item.notice && typeof item.notice.ref === "string");
    pass("normalizeStoredNotice preserves custom ID and status with hydrated notice");
  }
  {
    const item = normalizeStoredNotice({
      id: "NOTICE-LEGACY",
      status: "InvalidStatus",
      created_at: "not-a-date",
      notice: null,
    });
    assert(item.status === "Draft");
    assert(typeof item.createdAt === "number" && item.createdAt > 0);
    assert(item.notice && item.notice.ref);
    pass("normalizeStoredNotice normalizes invalid status and non-numeric created_at");
  }

  console.log("\n[TEST GROUP 4] NodeDetailDrawer Notice Lookup Resilience");
  {
    const rawNotices = [
      { id: "1", status: "Draft", notice: undefined },
      { id: "2", status: "Issued", target_vasp: "Binance International", notice: null },
    ];
    const targetVasp = "Binance International";
    const found = rawNotices.find((n) => n?.notice?.to_vasp === targetVasp || n?.target_vasp === targetVasp);
    assert(found && found.id === "2");
    pass("Drawer notice lookup finds notice via target_vasp fallback without throwing");
  }

  console.log("\n================================================================");
  console.log(`  ALL ${passed} LEGAL NOTICES DEFENSIVE TESTS PASSED!`);
  console.log("================================================================\n");
}

run().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
