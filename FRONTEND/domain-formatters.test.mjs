// Unit tests for domain.ts formatters and edge cases
import assert from "node:assert";

async function runTests() {
  const domain = await import("./src/lib/domain.ts");
  const { formatUSD, formatINR, formatToken, formatNumber, formatCompact, shortWallet } = domain;

  let passed = 0;
  function check(name, actual, expected) {
    assert.strictEqual(actual, expected, `${name} failed: expected "${expected}", got "${actual}"`);
    passed++;
    console.log(`  ✔ PASS: ${name} => ${actual}`);
  }

  console.log("================================================================");
  console.log("  🧪 DOMAIN FORMATTERS UNIT TEST SUITE");
  console.log("================================================================\n");

  console.log("[TEST GROUP 1] formatUSD Resilience & Formatting");
  check("formatUSD(undefined)", formatUSD(undefined), "$0");
  check("formatUSD(null)", formatUSD(null), "$0");
  check("formatUSD(NaN)", formatUSD(NaN), "$0");
  check("formatUSD(0)", formatUSD(0), "$0");
  check("formatUSD(500)", formatUSD(500), "$500");
  check("formatUSD(1500)", formatUSD(1500), "$1.5K");
  check("formatUSD(2500000)", formatUSD(2500000), "$2.50M");
  check("formatUSD('4500')", formatUSD("4500"), "$4.5K");
  check("formatUSD('')", formatUSD(""), "$0");
  check("formatUSD(-1500)", formatUSD(-1500), "$-1.5K");

  console.log("\n[TEST GROUP 2] formatINR Resilience & Formatting");
  check("formatINR(undefined)", formatINR(undefined), "₹0");
  check("formatINR(null)", formatINR(null), "₹0");
  check("formatINR(NaN)", formatINR(NaN), "₹0");
  check("formatINR(0)", formatINR(0), "₹0");
  check("formatINR(5000)", formatINR(5000), "₹5,000");
  check("formatINR(450000)", formatINR(450000), "₹4.50 L");
  check("formatINR(12500000)", formatINR(12500000), "₹1.25 Cr");
  check("formatINR('750000')", formatINR("750000"), "₹7.50 L");
  check("formatINR('')", formatINR(""), "₹0");
  check("formatINR(-450000)", formatINR(-450000), "₹-4.50 L");

  console.log("\n[TEST GROUP 3] formatToken Resilience & Decimals");
  check("formatToken(undefined)", formatToken(undefined), "0 USDT");
  check("formatToken(null, 'BTC')", formatToken(null, "BTC"), "0 BTC");
  check("formatToken(NaN, 'ETH')", formatToken(NaN, "ETH"), "0 ETH");
  check("formatToken(100.5, 'USDT')", formatToken(100.5, "USDT"), "100.5 USDT");
  check("formatToken(1.23456789, 'BTC')", formatToken(1.23456789, "BTC"), "1.234568 BTC");
  check("formatToken(2.55555, 'ETH')", formatToken(2.55555, "ETH"), "2.5556 ETH");

  console.log("\n[TEST GROUP 4] formatNumber & formatCompact");
  check("formatNumber(undefined)", formatNumber(undefined), "0");
  check("formatNumber(null)", formatNumber(null), "0");
  check("formatNumber(12345.678)", formatNumber(12345.678), "12,345.68");
  check("formatCompact(undefined)", formatCompact(undefined), "0");
  check("formatCompact(1500)", formatCompact(1500), "1.5K");
  check("formatCompact(2500000)", formatCompact(2500000), "2.50M");
  check("formatCompact(3000000000)", formatCompact(3000000000), "3.00B");

  console.log("\n[TEST GROUP 5] shortWallet Resilience");
  check("shortWallet(undefined)", shortWallet(undefined), "");
  check("shortWallet(null)", shortWallet(null), "");
  check("shortWallet('')", shortWallet(""), "");
  check("shortWallet('0x12345678')", shortWallet("0x12345678"), "0x12345678");
  check("shortWallet('0x71C7656EC7ab88b098defB751B7401B5f6d8976F')", shortWallet("0x71C7656EC7ab88b098defB751B7401B5f6d8976F"), "0x71C7…976F");

  console.log("\n================================================================");
  console.log(`  ALL ${passed} FORMATTER EDGE-CASE TESTS PASSED!`);
  console.log("================================================================\n");
}

runTests().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
