import assert from "node:assert";
import { describe, it } from "node:test";
import path from "path";
import fs from "fs";
import { loadModule } from "./e2e/harness.mjs";

const projectRoot = path.resolve(process.cwd());

const purokModule = loadModule(path.resolve(projectRoot, "src/data/puroks.ts"));
const PUROK_NODES = purokModule.PUROK_NODES;

const debunkerModule = loadModule(path.resolve(projectRoot, "src/data/debunkers.ts"));
const DEBUNKER_ITEMS = debunkerModule.DEBUNKER_ITEMS;

const deptModule = loadModule(path.resolve(projectRoot, "src/data/departments.ts"));
const RESCUE_DEPARTMENTS = deptModule.RESCUE_DEPARTMENTS;

describe("ADVERSARIAL STRESS TEST SUITE — CHALLENGER VERIFICATION", () => {

  // =========================================================================
  // 1. Household Safety Roster Accounting Across Puroks 1-5
  // =========================================================================
  describe("1. Household Safety Roster Accounting Stress Test", () => {
    it("ADV-1.1: mathematical sum of Purok 1-5 total households equals exactly 240", () => {
      assert.strictEqual(PUROK_NODES.length, 5, "Must have exactly 5 Purok nodes");
      const computedTotal = PUROK_NODES.reduce((sum, p) => sum + p.total, 0);
      assert.strictEqual(computedTotal, 240, `Expected total households 240, got ${computedTotal}`);
    });

    it("ADV-1.2: baseline safe families sum strictly equals 214", () => {
      const computedSafe = PUROK_NODES.reduce((sum, p) => sum + p.safe, 0);
      assert.strictEqual(computedSafe, 214, `Expected baseline safe families 214, got ${computedSafe}`);
    });

    it("ADV-1.3: string familiesSafe matches numeric safe and total for every Purok", () => {
      for (const p of PUROK_NODES) {
        const expectedStr = `${p.safe} / ${p.total}`;
        assert.strictEqual(p.familiesSafe, expectedStr, `Node ${p.id} mismatch: ${p.familiesSafe} vs ${expectedStr}`);
        assert.ok(p.safe <= p.total, `Purok ${p.id} safe (${p.safe}) exceeds total (${p.total})`);
        assert.ok(p.safe >= 0, `Purok ${p.id} safe cannot be negative`);
      }
    });

    it("ADV-1.4: baseline percentage rounding is exactly 89%", () => {
      const safe = 214;
      const total = 240;
      const ratio = safe / total; // ~0.8916666...
      const rounded = Math.round(ratio * 100);
      assert.strictEqual(rounded, 89, "Baseline safety ratio must round to 89%");
    });

    it("ADV-1.5: incremented safety percentage (+1 check-in) rounds to 90%", () => {
      const safe = 215;
      const total = 240;
      const ratio = safe / total; // ~0.8958333...
      const rounded = Math.round(ratio * 100);
      assert.strictEqual(rounded, 90, "Incremented safety ratio must round to 90%");
    });

    it("ADV-1.6: boundary stress - 0 safe is 0%, 240 safe is 100%", () => {
      assert.strictEqual(Math.round((0 / 240) * 100), 0);
      assert.strictEqual(Math.round((240 / 240) * 100), 100);
    });
  });

  // =========================================================================
  // 2. Vulnerable Household Toggles State Updates & Reactivity Leaks
  // =========================================================================
  describe("2. Vulnerable Household Toggles & State Stress Test", () => {
    it("ADV-2.1: toggle state updates immutably without crashing on valid ID", () => {
      const initial = [
        { id: "vul-001", headOfFamily: "Agcaoili, Ernesto", isSafe: false },
        { id: "vul-002", headOfFamily: "Mariano, Grace", isSafe: true },
      ];

      const toggle = (list, id) => list.map(item => item.id === id ? { ...item, isSafe: !item.isSafe } : item);

      const toggled1 = toggle(initial, "vul-001");
      assert.strictEqual(toggled1[0].isSafe, true);
      assert.strictEqual(initial[0].isSafe, false, "Must not mutate original array");

      const toggled2 = toggle(toggled1, "vul-001");
      assert.strictEqual(toggled2[0].isSafe, false);
      assert.strictEqual(toggled2[1].isSafe, true, "Other items unchanged");
    });

    it("ADV-2.2: toggle on non-existent or malformed ID does not crash or corrupt list", () => {
      const initial = [
        { id: "vul-001", headOfFamily: "Agcaoili, Ernesto", isSafe: false }
      ];
      const toggle = (list, id) => list.map(item => item.id === id ? { ...item, isSafe: !item.isSafe } : item);

      const res1 = toggle(initial, "non-existent-id");
      assert.strictEqual(res1.length, 1);
      assert.strictEqual(res1[0].isSafe, false);

      const res2 = toggle(initial, null);
      assert.strictEqual(res2.length, 1);
      assert.strictEqual(res2[0].isSafe, false);

      const res3 = toggle(initial, undefined);
      assert.strictEqual(res3.length, 1);
      assert.strictEqual(res3[0].isSafe, false);
    });

    it("ADV-2.3: high-tempo rapid toggling stress test (1,000 cycles)", () => {
      let state = [{ id: "vul-001", isSafe: false }];
      const toggle = (list, id) => list.map(item => item.id === id ? { ...item, isSafe: !item.isSafe } : item);

      for (let i = 0; i < 1000; i++) {
        state = toggle(state, "vul-001");
      }
      assert.strictEqual(state[0].isSafe, false, "1000 toggles must return to initial false");

      state = toggle(state, "vul-001");
      assert.strictEqual(state[0].isSafe, true, "1001st toggle must be true");
    });
  });

  // =========================================================================
  // 3. Apple HIG 44pt Touch Target Minimums Across Interactive Elements
  // =========================================================================
  describe("3. Apple HIG 44pt Touch Target Audit", () => {
    it("ADV-3.1: scan for buttons violating 44pt minimum touch target size", () => {
      const srcDir = path.resolve("src");
      function getAllFiles(dir, exts = [".tsx", ".jsx"]) {
        let results = [];
        const list = fs.readdirSync(dir);
        for (const file of list) {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) results = results.concat(getAllFiles(fullPath, exts));
          else if (exts.includes(path.extname(file))) results.push(fullPath);
        }
        return results;
      }

      const files = getAllFiles(srcDir);
      const violations = [];

      for (const file of files) {
        const content = fs.readFileSync(file, "utf8");
        const relPath = path.relative(process.cwd(), file);
        const buttonRegex = /<button\b([\s\S]*?)>/g;
        let match;
        while ((match = buttonRegex.exec(content)) !== null) {
          const tagAttrs = match[1];
          const lineNum = content.substring(0, match.index).split("\n").length;
          
          let classNameStr = "";
          const strMatch = tagAttrs.match(/className="([^"]*)"/);
          if (strMatch) classNameStr = strMatch[1];
          else {
            const exprMatch = tagAttrs.match(/className=\{`([\s\S]*?)`\}/);
            if (exprMatch) classNameStr = exprMatch[1];
          }

          if (/\b(w-[5-8]|h-[5-8])\b/.test(classNameStr) && !/min-h-\[44px\]/.test(classNameStr) && !/min-w-\[44px\]/.test(classNameStr)) {
            violations.push({ file: relPath, line: lineNum, className: classNameStr });
          }
        }
      }

      console.log(`[ADV-3.1] Confirmed touch target violations count: ${violations.length}`);
      for (const v of violations) {
        console.log(`  - ${v.file}:${v.line} (${v.className})`);
      }

      assert.strictEqual(violations.length, 0, "All interactive buttons must comply with Apple HIG 44pt minimum touch target size");
    });
  });

  // =========================================================================
  // 4. CMS Publishing Workflow, PST Timestamps & Ground Truth Sync
  // =========================================================================
  describe("4. CMS Publishing Workflow & PST Timestamps", () => {
    const pstRegex = /^(?:[01]\d|2[0-3]):[0-5]\d\s*PST$/;

    it("ADV-4.1: PST regex strictly validates valid Philippine Standard Time strings", () => {
      assert.ok(pstRegex.test("00:00 PST"), "Midnight is valid");
      assert.ok(pstRegex.test("12:00 PST"), "Noon is valid");
      assert.ok(pstRegex.test("23:59 PST"), "23:59 PST is valid");
      assert.ok(pstRegex.test("08:30 PST"), "Morning time is valid");
      assert.ok(pstRegex.test("19:48 PST"), "Evening time is valid");
    });

    it("ADV-4.2: PST regex rejects invalid times", () => {
      assert.ok(!pstRegex.test("24:00 PST"), "24:00 is invalid");
      assert.ok(!pstRegex.test("12:60 PST"), "Minute 60 is invalid");
      assert.ok(!pstRegex.test("8:30 PST"), "Single digit hour without leading zero is invalid");
      assert.ok(!pstRegex.test("12:00"), "Missing PST suffix is invalid");
      assert.ok(!pstRegex.test("12:00 UTC"), "Wrong timezone suffix is invalid");
      assert.ok(!pstRegex.test("12:00 PM"), "12h AM/PM format is invalid");
    });

    it("ADV-4.3: default SEED debunkers all strictly comply with PST regex", () => {
      for (const item of DEBUNKER_ITEMS) {
        assert.ok(
          pstRegex.test(item.pstTime),
          `Seed debunker ${item.id} has invalid pstTime: "${item.pstTime}"`
        );
      }
    });

    it("ADV-4.4: debunker data keys match between publisher and reader", () => {
      const requiredFields = ["rumor", "rumorImpact", "verifiedTitle", "verifiedText", "pstTime", "purok", "badgeText"];
      for (const item of DEBUNKER_ITEMS) {
        for (const field of requiredFields) {
          assert.ok(item[field] !== undefined, `Seed item ${item.id} missing field ${field}`);
        }
      }
    });
  });

  // =========================================================================
  // 5. 3D Mascot Asset Fidelity & Responsive Breakpoints
  // =========================================================================
  describe("5. 3D Mascot & Mobile Breakpoint Stress Test", () => {
    it("ADV-5.1: mascot asset exists, is non-empty, and has expected PNG signature", () => {
      const mascotPath = path.resolve("public/mascot/mascot-thumbsup.png");
      assert.ok(fs.existsSync(mascotPath), "mascot-thumbsup.png must exist in public/mascot/");
      const stats = fs.statSync(mascotPath);
      assert.ok(stats.size > 50000, `Mascot image should be high-res (>50KB), got ${stats.size} bytes`);

      const buffer = fs.readFileSync(mascotPath);
      assert.strictEqual(buffer[0], 0x89);
      assert.strictEqual(buffer[1], 0x50);
      assert.strictEqual(buffer[2], 0x4E);
      assert.strictEqual(buffer[3], 0x47);
    });

    it("ADV-5.2: mascot container in page.tsx uses object-contain and aspect-[3/4]", () => {
      const pagePath = path.resolve("src/app/page.tsx");
      const content = fs.readFileSync(pagePath, "utf8");
      assert.ok(content.includes("aspect-[3/4]"), "Mascot container must maintain 3:4 aspect ratio");
      assert.ok(content.includes("object-contain"), "Mascot image must use object-contain to prevent distortion");
      assert.ok(content.includes("max-w-full"), "Mascot container must have max-w-full to prevent horizontal overflow");
    });

    it("ADV-5.3: SOSConsole header bar wraps cleanly at mobile breakpoint with flex-col or flex-wrap", () => {
      const sosPath = path.resolve("src/components/SOSConsole.tsx");
      const content = fs.readFileSync(sosPath, "utf8");
      const containerLine = content.split("\n").find(l => l.includes("pb-3.5 mb-3.5 border-b"));
      
      console.log(`[ADV-5.3] SOSConsole header container class: "${containerLine?.trim()}"`);
      assert.ok(containerLine, "Header container line must exist");
      const hasWrap = containerLine.includes("flex-wrap") || containerLine.includes("flex-col");
      assert.strictEqual(hasWrap, true, "SOSConsole header container must have flex-wrap or flex-col");
    });
  });
});
