// Comprehensive unit tests for domain.ts formatters, utilities, and edge cases
import assert from "node:assert";

async function runTests() {
  const domain = await import("./src/lib/domain.ts");
  const {
    parseSafeNumber,
    formatUSD,
    formatINR,
    formatToken,
    formatNumber,
    formatCompact,
    shortWallet,
    detectChain,
    vaspByName,
    nodeRadius,
  } = domain;

  let passed = 0;
  function check(name, actual, expected) {
    assert.strictEqual(actual, expected, `${name} failed: expected "${expected}", got "${actual}"`);
    passed++;
    console.log(`  ✔ PASS: ${name} => ${actual}`);
  }

  console.log("================================================================");
  console.log("  🧪 DOMAIN FORMATTERS COMPREHENSIVE UNIT TEST SUITE");
  console.log("================================================================\n");

  console.log("[TEST GROUP 1] parseSafeNumber Resilience");
  check("parseSafeNumber(undefined)", parseSafeNumber(undefined), 0);
  check("parseSafeNumber(null)", parseSafeNumber(null), 0);
  check("parseSafeNumber(NaN)", parseSafeNumber(NaN), 0);
  check("parseSafeNumber(Infinity)", parseSafeNumber(Infinity), 0);
  check("parseSafeNumber(-Infinity)", parseSafeNumber(-Infinity), 0);
  check("parseSafeNumber('')", parseSafeNumber(""), 0);
  check("parseSafeNumber('   ')", parseSafeNumber("   "), 0);
  check("parseSafeNumber('invalid')", parseSafeNumber("invalid"), 0);
  check("parseSafeNumber(true)", parseSafeNumber(true), 0);
  check("parseSafeNumber(false)", parseSafeNumber(false), 0);
  check("parseSafeNumber({})", parseSafeNumber({}), 0);
  check("parseSafeNumber([])", parseSafeNumber([]), 0);
  check("parseSafeNumber(1234)", parseSafeNumber(1234), 1234);
  check("parseSafeNumber('5678')", parseSafeNumber("5678"), 5678);
  check("parseSafeNumber(-99)", parseSafeNumber(-99), -99);

  console.log("\n[TEST GROUP 2] formatUSD Resilience & Currency Sign");
  check("formatUSD(undefined)", formatUSD(undefined), "$0");
  check("formatUSD(null)", formatUSD(null), "$0");
  check("formatUSD(NaN)", formatUSD(NaN), "$0");
  check("formatUSD(0)", formatUSD(0), "$0");
  check("formatUSD(-0)", formatUSD(-0), "$0");
  check("formatUSD(500)", formatUSD(500), "$500");
  check("formatUSD(1500)", formatUSD(1500), "$1.5K");
  check("formatUSD(2500000)", formatUSD(2500000), "$2.50M");
  check("formatUSD('4500')", formatUSD("4500"), "$4.5K");
  check("formatUSD('')", formatUSD(""), "$0");
  check("formatUSD('   ')", formatUSD("   "), "$0");
  check("formatUSD('abc')", formatUSD("abc"), "$0");
  check("formatUSD(-1500)", formatUSD(-1500), "-$1.5K");
  check("formatUSD(-50)", formatUSD(-50), "-$50");
  check("formatUSD(-2500000)", formatUSD(-2500000), "-$2.50M");
  check("formatUSD(Infinity)", formatUSD(Infinity), "$0");

  console.log("\n[TEST GROUP 3] formatINR Resilience & Currency Sign");
  check("formatINR(undefined)", formatINR(undefined), "₹0");
  check("formatINR(null)", formatINR(null), "₹0");
  check("formatINR(NaN)", formatINR(NaN), "₹0");
  check("formatINR(0)", formatINR(0), "₹0");
  check("formatINR(-0)", formatINR(-0), "₹0");
  check("formatINR(5000)", formatINR(5000), "₹5,000");
  check("formatINR(450000)", formatINR(450000), "₹4.50 L");
  check("formatINR(12500000)", formatINR(12500000), "₹1.25 Cr");
  check("formatINR('750000')", formatINR("750000"), "₹7.50 L");
  check("formatINR('')", formatINR(""), "₹0");
  check("formatINR('   ')", formatINR("   "), "₹0");
  check("formatINR('not-a-number')", formatINR("not-a-number"), "₹0");
  check("formatINR(-450000)", formatINR(-450000), "-₹4.50 L");
  check("formatINR(-500)", formatINR(-500), "-₹500");
  check("formatINR(-12500000)", formatINR(-12500000), "-₹1.25 Cr");
  check("formatINR(Infinity)", formatINR(Infinity), "₹0");

  console.log("\n[TEST GROUP 4] formatToken Resilience & Decimals");
  check("formatToken(undefined)", formatToken(undefined), "0 USDT");
  check("formatToken(null, 'BTC')", formatToken(null, "BTC"), "0 BTC");
  check("formatToken(NaN, 'ETH')", formatToken(NaN, "ETH"), "0 ETH");
  check("formatToken(100.5, 'USDT')", formatToken(100.5, "USDT"), "100.5 USDT");
  check("formatToken(1.23456789, 'BTC')", formatToken(1.23456789, "BTC"), "1.234568 BTC");
  check("formatToken(2.55555, 'ETH')", formatToken(2.55555, "ETH"), "2.5556 ETH");
  check("formatToken(50, null)", formatToken(50, null), "50 USDT");
  check("formatToken(50, undefined)", formatToken(50, undefined), "50 USDT");
  check("formatToken(-5, 'USDT')", formatToken(-5, "USDT"), "-5 USDT");

  console.log("\n[TEST GROUP 5] formatNumber & formatCompact");
  check("formatNumber(undefined)", formatNumber(undefined), "0");
  check("formatNumber(null)", formatNumber(null), "0");
  check("formatNumber(NaN)", formatNumber(NaN), "0");
  check("formatNumber(12345.678)", formatNumber(12345.678), "12,345.68");
  check("formatNumber(12345.6789, 3)", formatNumber(12345.6789, 3), "12,345.679");
  check("formatNumber(-500)", formatNumber(-500), "-500");
  check("formatCompact(undefined)", formatCompact(undefined), "0");
  check("formatCompact(1500)", formatCompact(1500), "1.5K");
  check("formatCompact(2500000)", formatCompact(2500000), "2.50M");
  check("formatCompact(3000000000)", formatCompact(3000000000), "3.00B");
  check("formatCompact(-1500)", formatCompact(-1500), "-1.5K");
  check("formatCompact(-2500000)", formatCompact(-2500000), "-2.50M");
  check("formatCompact(-50)", formatCompact(-50), "-50");

  console.log("\n[TEST GROUP 6] shortWallet Resilience");
  check("shortWallet(undefined)", shortWallet(undefined), "");
  check("shortWallet(null)", shortWallet(null), "");
  check("shortWallet('')", shortWallet(""), "");
  check("shortWallet('   ')", shortWallet("   "), "");
  check("shortWallet('0x12345678')", shortWallet("0x12345678"), "0x12345678");
  check("shortWallet('0x71C7656EC7ab88b098defB751B7401B5f6d8976F')", shortWallet("0x71C7656EC7ab88b098defB751B7401B5f6d8976F"), "0x71C7…976F");
  check("shortWallet(12345)", shortWallet(12345), "");

  console.log("\n[TEST GROUP 7] detectChain & vaspByName & nodeRadius Resilience");
  check("detectChain(undefined)", detectChain(undefined), null);
  check("detectChain(null)", detectChain(null), null);
  check("detectChain('')", detectChain(""), null);
  check("detectChain('invalid')", detectChain("invalid"), null);
  check("detectChain('0x71C7656EC7ab88b098defB751B7401B5f6d8976F')", detectChain("0x71C7656EC7ab88b098defB751B7401B5f6d8976F"), "ETHEREUM");
  check("detectChain('TLyqzVGLV1srkB7dToTAFdQUiMbU793547')", detectChain("TLyqzVGLV1srkB7dToTAFdQUiMbU793547"), "TRON");
  check("detectChain('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')", detectChain("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"), "BITCOIN");

  check("vaspByName(undefined)", vaspByName(undefined), undefined);
  check("vaspByName(null)", vaspByName(null), undefined);
  check("vaspByName('')", vaspByName(""), undefined);
  check("vaspByName('binance')?.name", vaspByName("binance")?.name, "Binance");
  check("vaspByName('BINANCE')?.name", vaspByName("BINANCE")?.name, "Binance");
  check("vaspByName('nonexistent')", vaspByName("nonexistent"), undefined);

  check("nodeRadius(undefined)", nodeRadius(undefined), 13);
  check("nodeRadius(null)", nodeRadius(null), 13);
  check("nodeRadius(NaN)", nodeRadius(NaN), 13);
  check("nodeRadius(1)", nodeRadius(1), 13);
  check("nodeRadius(5)", nodeRadius(5), 23.4);

  console.log("\n================================================================");
  console.log(`  ALL ${passed} FORMATTER & UTILITY TESTS PASSED!`);
  console.log("================================================================\n");
}

runTests().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
