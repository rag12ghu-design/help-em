#!/usr/bin/env node
/**
 * Master E2E Test Runner for Help'Em Platform
 * Executes Tiers 1–5 Test Suites and outputs a comprehensive execution report.
 * 
 * Usage:
 *   node tests/e2e/runner.mjs
 *   node tests/e2e/runner.mjs --tier=1
 *   node tests/e2e/runner.mjs --tier=2
 *   node tests/e2e/runner.mjs --tier=3
 *   node tests/e2e/runner.mjs --tier=4
 *   node tests/e2e/runner.mjs --tier=5
 */

import { run } from "node:test";
import { spec } from "node:test/reporters";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tier definitions
const TIERS = [
  {
    tier: 1,
    name: "Tier 1: Feature Coverage",
    description: "Core features: Dynamic Island, Mascot, Puroks, HUD, Switcher, Check-in, Accounting, Modal, Debunker, Aid, Hotlines",
    file: path.resolve(__dirname, "tier1_features.test.mjs"),
    expectedTests: 55,
  },
  {
    tier: 2,
    name: "Tier 2: Boundary & Corner Cases",
    description: "Rapid toggle cycles, multi-tab switching, 44pt touch targets, form validation, phone regex, PST syntax",
    file: path.resolve(__dirname, "tier2_boundaries.test.mjs"),
    expectedTests: 30,
  },
  {
    tier: 3,
    name: "Tier 3: Cross-Feature Combinations",
    description: "Pairwise interaction persistence, layer switching state, multi-modal transitions, accounting preservation",
    file: path.resolve(__dirname, "tier3_combinations.test.mjs"),
    expectedTests: 10,
  },
  {
    tier: 4,
    name: "Tier 4: Real-World Scenarios",
    description: "Quiling flood drill, typhoon landfall timeline, volunteer registration cycle, relief logistics, anti-panic fact check",
    file: path.resolve(__dirname, "tier4_scenarios.test.mjs"),
    expectedTests: 5,
  },
  {
    tier: 5,
    name: "Tier 5: Responders Operations & Dual-Access",
    description: "Dual-Access role switcher, 4-dept ticket routing, case tracker lifecycle, triage queue, team assignment, roster accounting, debunker CMS",
    file: path.resolve(__dirname, "tier5_operations.test.mjs"),
    expectedTests: 39,
  },
];

async function main() {
  const args = process.argv.slice(2);
  const tierArg = args.find((a) => a.startsWith("--tier="));
  const targetTier = tierArg ? parseInt(tierArg.split("=")[1], 10) : null;

  const selectedTiers = targetTier
    ? TIERS.filter((t) => t.tier === targetTier)
    : TIERS;

  if (selectedTiers.length === 0) {
    console.error(`Unknown tier specified: ${targetTier}. Valid options are 1, 2, 3, 4, 5.`);
    process.exit(1);
  }

  console.log("\n" + "=".repeat(78));
  console.log("  HELP'EM COMMUNITY DISASTER RESILIENCE PLATFORM");
  console.log("  MMSU NSTP CWTS Civic Immersion — E2E Test Suite Master Runner");
  console.log("=".repeat(78));
  console.log(`  Executing: ${selectedTiers.map((t) => `Tier ${t.tier}`).join(", ")}`);
  console.log(`  Environment: Node.js ${process.version} on ${process.platform}`);
  console.log("=".repeat(78) + "\n");

  const startTime = Date.now();
  const results = [];
  let totalPassed = 0;
  let totalFailed = 0;

  for (const tierInfo of selectedTiers) {
    console.log(`\n▶ Running ${tierInfo.name}`);
    console.log(`  ${tierInfo.description}`);
    console.log(`  File: ${path.relative(process.cwd(), tierInfo.file)}\n`);

    const tierStartTime = Date.now();
    let tierPassed = 0;
    let tierFailed = 0;

    const testStream = run({
      files: [tierInfo.file],
      concurrency: false,
    });

    testStream.on("test:pass", () => {
      tierPassed++;
    });

    testStream.on("test:fail", () => {
      tierFailed++;
    });

    testStream.compose(spec).pipe(process.stdout);

    await new Promise((resolve) => {
      testStream.on("end", resolve);
    });

    const tierDuration = ((Date.now() - tierStartTime) / 1000).toFixed(2);
    totalPassed += tierPassed;
    totalFailed += tierFailed;

    results.push({
      tier: tierInfo.tier,
      name: tierInfo.name,
      passed: tierPassed,
      failed: tierFailed,
      duration: `${tierDuration}s`,
      status: tierFailed === 0 ? "PASSED" : "FAILED",
    });
  }

  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log("\n" + "=".repeat(78));
  console.log("  E2E TEST EXECUTION SUMMARY REPORT");
  console.log("=".repeat(78));
  console.log("  Tier | Suite Name                         | Passed | Failed | Duration | Status");
  console.log("  -----+------------------------------------+--------+--------+----------+--------");

  for (const r of results) {
    const tierCol = `  T${r.tier}  `.padEnd(7);
    const nameCol = r.name.padEnd(36).slice(0, 36);
    const passCol = String(r.passed).padStart(6);
    const failCol = String(r.failed).padStart(6);
    const durCol = r.duration.padStart(8);
    const statusCol = `  ${r.status}`;
    console.log(`${tierCol}| ${nameCol} | ${passCol} | ${failCol} | ${durCol} |${statusCol}`);
  }

  console.log("  -----+------------------------------------+--------+--------+----------+--------");
  console.log(`  TOTAL: ${totalPassed} Passed, ${totalFailed} Failed in ${totalDuration}s`);
  console.log("=".repeat(78));

  if (totalFailed === 0) {
    console.log("\n  ✔ ALL TEST TIERS PASSED WITH 100% SUCCESS RATE!\n");
    process.exit(0);
  } else {
    console.log(`\n  ✖ TEST RUN FAILED with ${totalFailed} failing tests.\n`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Test runner encountered an unhandled exception:", err);
  process.exit(1);
});
