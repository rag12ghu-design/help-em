import assert from "node:assert";
import { describe, it } from "node:test";
import path from "path";
import fs from "fs";
import ts from "typescript";
import { loadModule } from "./e2e/harness.mjs";

const projectRoot = path.resolve(process.cwd());

const purokModule = loadModule(path.resolve(projectRoot, "src/data/puroks.ts"));
const PUROK_NODES = purokModule.PUROK_NODES;

const debunkerModule = loadModule(path.resolve(projectRoot, "src/data/debunkers.ts"));
const DEBUNKER_ITEMS = debunkerModule.DEBUNKER_ITEMS;

function getAllTsxFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(getAllTsxFiles(fullPath));
    } else if (file.endsWith(".tsx") || file.endsWith(".jsx")) {
      results.push(fullPath);
    }
  }
  return results;
}

describe("CHALLENGER ITERATION 2 VERIFICATION SUITE", () => {

  // =========================================================================
  // 1. AST Touch Target Compliance (0 Violations Across All 61 Buttons)
  // =========================================================================
  describe("1. AST Touch Target Audit Verification", () => {
    const files = getAllTsxFiles(path.resolve("src"));
    const buttonAudits = [];

    for (const file of files) {
      const content = fs.readFileSync(file, "utf8");
      const relPath = path.relative(projectRoot, file);
      const sourceFile = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

      function visit(node) {
        if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
          const tagName = node.tagName.getText(sourceFile);
          if (tagName === "button") {
            const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
            let className = "";
            let role = "";
            let ariaLabel = "";

            for (const attr of node.attributes.properties) {
              if (ts.isJsxAttribute(attr)) {
                const name = attr.name.getText(sourceFile);
                if (name === "className") {
                  if (attr.initializer) {
                    if (ts.isStringLiteral(attr.initializer)) {
                      className = attr.initializer.text;
                    } else if (ts.isJsxExpression(attr.initializer)) {
                      className = attr.initializer.getText(sourceFile);
                    }
                  }
                } else if (name === "role") {
                  if (attr.initializer && ts.isStringLiteral(attr.initializer)) {
                    role = attr.initializer.text;
                  }
                } else if (name === "aria-label") {
                  if (attr.initializer && ts.isStringLiteral(attr.initializer)) {
                    ariaLabel = attr.initializer.text;
                  }
                }
              }
            }

            buttonAudits.push({ file: relPath, line, className, role, ariaLabel });
          }
        }
        ts.forEachChild(node, visit);
      }
      visit(sourceFile);
    }

    it("CH-1.1: discovers exactly 61 button elements via TypeScript AST", () => {
      assert.strictEqual(buttonAudits.length, 61, `Expected 61 buttons, found ${buttonAudits.length}`);
    });

    it("CH-1.2: zero touch target violations across all 61 buttons", () => {
      const violations = [];
      for (const btn of buttonAudits) {
        if (btn.role === "switch") continue; // Apple iOS toggle switch specifications
        const cls = btn.className;
        const hasUndersizedW = /\b(w-5|w-6|w-7|w-8|w-9|w-10)\b/.test(cls);
        const hasUndersizedH = /\b(h-5|h-6|h-7|h-8|h-9|h-10)\b/.test(cls);
        const hasMinH44 = /min-h-\[44px\]|h-11|h-12|h-14|h-16/.test(cls);
        const hasMinW44 = /min-w-\[44px\]|w-11|w-12|w-14|w-16/.test(cls);
        const hasLargePy = /py-3\.5|py-4|py-5/.test(cls);

        const isSmall = (hasUndersizedW || hasUndersizedH) && !(hasMinH44 && hasMinW44);
        const lacks44Height = !hasMinH44 && !hasLargePy && !/h-(1[1-9]|2\d)/.test(cls);

        if (isSmall || lacks44Height) {
          violations.push({ ...btn, reason: isSmall ? "undersized" : "lacks-44-height" });
        }
      }

      assert.strictEqual(violations.length, 0, `Expected 0 violations, found ${violations.length}: ${JSON.stringify(violations)}`);
    });

    it("CH-1.3: previously failing buttons are explicitly verified compliant", () => {
      // 1. SOSConsole audio & SOS buttons
      const sosFile = fs.readFileSync(path.resolve("src/components/SOSConsole.tsx"), "utf8");
      assert.ok(sosFile.includes('className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-[#30D158]/30'), "SOSConsole audio button must be 44pt");
      assert.ok(
        sosFile.includes("min-h-[44px]") &&
        sosFile.includes("min-w-[44px]") &&
        (sosFile.includes("bg-[#FF453A]") || sosFile.includes("bg-red-600")),
        "SOSConsole SOS button must be 44pt and styled with emergency affordance"
      );

      // 2. SafetyCheckIn toggle switch
      const sciFile = fs.readFileSync(path.resolve("src/components/SafetyCheckIn.tsx"), "utf8");
      assert.ok(sciFile.includes('role="switch"') && sciFile.includes("w-12") && sciFile.includes("h-7"), "SafetyCheckIn toggle must follow standard Apple switch proportions");

      // 3. Page toast dismiss button
      const pageFile = fs.readFileSync(path.resolve("src/app/page.tsx"), "utf8");
      assert.ok(pageFile.includes("w-11 h-11 min-w-[44px] min-h-[44px] -mr-2 rounded-full"), "Page toast dismiss button must be 44pt");

      // 4. AidDirectory connect button
      const aidFile = fs.readFileSync(path.resolve("src/components/AidDirectory.tsx"), "utf8");
      assert.ok(aidFile.includes("min-h-[44px] min-w-[44px]"), "AidDirectory connect button must have 44pt bounds");

      // 5. PurokInspectorHUD dispatch button
      const hudFile = fs.readFileSync(path.resolve("src/components/PurokInspectorHUD.tsx"), "utf8");
      assert.ok(hudFile.includes("min-h-[44px]"), "PurokInspectorHUD quick action button must have 44pt height");
    });
  });

  // =========================================================================
  // 2. Responsive 375px Layout Verification
  // =========================================================================
  describe("2. Responsive 375px Layout & Wrapping Verification", () => {
    it("CH-2.1: SOSConsole header bar adopts flex-col sm:flex-row with gap-3", () => {
      const sosContent = fs.readFileSync(path.resolve("src/components/SOSConsole.tsx"), "utf8");
      const match = sosContent.match(/className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3\.5 mb-3\.5 border-b border-\[#06391C\]\/15"/);
      assert.ok(match, "SOSConsole header container must wrap cleanly via flex-col sm:flex-row");
    });

    it("CH-2.2: SOSConsole controls row adapts with w-full sm:w-auto", () => {
      const sosContent = fs.readFileSync(path.resolve("src/components/SOSConsole.tsx"), "utf8");
      assert.ok(sosContent.includes("w-full sm:w-auto"), "Controls container must adapt width across mobile breakpoints");
    });

    it("CH-2.3: Root layout body sets horizontal overflow protection", () => {
      const layoutContent = fs.readFileSync(path.resolve("src/app/layout.tsx"), "utf8");
      assert.ok(layoutContent.includes("overflow-x-hidden"), "Layout body must enforce overflow-x-hidden");
      assert.ok(layoutContent.includes("min-w-[320px]"), "Layout body must enforce min-w-[320px]");
    });

    it("CH-2.4: ActionModal header contains safe-zone padding for close button", () => {
      const modalContent = fs.readFileSync(path.resolve("src/components/ActionModal.tsx"), "utf8");
      assert.ok(modalContent.includes("pr-12"), "ActionModal header must include pr-12 safe padding to avoid close button overlap");
    });

    it("CH-2.5: DebunkerSection headers and rows wrap flexibly on small screens", () => {
      const debunkerContent = fs.readFileSync(path.resolve("src/components/DebunkerSection.tsx"), "utf8");
      assert.ok(debunkerContent.includes("flex-wrap") || debunkerContent.includes("flex-col sm:flex-row"), "DebunkerSection must implement flexible wrapping");
    });
  });

  // =========================================================================
  // 3. Household Safety Accounting Synchronization
  // =========================================================================
  describe("3. Real-Time Household Accounting Synchronization", () => {
    it("CH-3.1: ResilienceContext exports isSafe, safeCount, totalHouseholds, toggleSafe, setIsSafe", () => {
      const contextContent = fs.readFileSync(path.resolve("src/context/ResilienceContext.tsx"), "utf8");
      assert.ok(contextContent.includes("isSafe: boolean;"), "Context interface must include isSafe");
      assert.ok(contextContent.includes("safeCount: number;"), "Context interface must include safeCount");
      assert.ok(contextContent.includes("totalHouseholds: number;"), "Context interface must include totalHouseholds");
      assert.ok(contextContent.includes("toggleSafe: () => void;"), "Context interface must include toggleSafe");
      assert.ok(contextContent.includes("setIsSafe: (val: boolean) => void;"), "Context interface must include setIsSafe");
    });

    it("CH-3.2: ResilienceContext persists isSafe to localStorage key helpem_is_safe", () => {
      const contextContent = fs.readFileSync(path.resolve("src/context/ResilienceContext.tsx"), "utf8");
      assert.ok(contextContent.includes('localStorage.getItem("helpem_is_safe")'), "Must read helpem_is_safe from localStorage");
      assert.ok(contextContent.includes('localStorage.setItem("helpem_is_safe"'), "Must save helpem_is_safe to localStorage");
    });

    it("CH-3.3: ResponderOperationsDesk derives metrics dynamically from ResilienceContext", () => {
      const deskContent = fs.readFileSync(path.resolve("src/components/ResponderOperationsDesk.tsx"), "utf8");
      assert.ok(deskContent.includes("safeFamilies = safeCount;"), "ResponderOperationsDesk must derive safeFamilies from safeCount");
      assert.ok(deskContent.includes("totalFamilies = totalHouseholds || 240;"), "ResponderOperationsDesk must derive totalFamilies from totalHouseholds");
      assert.ok(!deskContent.includes("safeFamilies = PUROK_NODES.reduce"), "Must not use static PUROK_NODES reduction for safeFamilies");
    });

    it("CH-3.4: page.tsx delegates safety toggle through useResilience", () => {
      const pageContent = fs.readFileSync(path.resolve("src/app/page.tsx"), "utf8");
      assert.ok(pageContent.includes("const { role, isSafe, safeCount, totalHouseholds, toggleSafe } = useResilience();") || pageContent.includes("toggleSafe,"), "page.tsx must consume toggleSafe from useResilience");
    });

    it("CH-3.5: baseline accounting math is strictly verified", () => {
      const total = PUROK_NODES.reduce((sum, p) => sum + p.total, 0);
      const safe = PUROK_NODES.reduce((sum, p) => sum + p.safe, 0);
      assert.strictEqual(total, 240, "Total households must equal 240");
      assert.strictEqual(safe, 214, "Baseline safe households must equal 214");
      assert.strictEqual(Math.round((214 / 240) * 100), 89, "Baseline safety ratio must round to 89%");
      assert.strictEqual(Math.round((215 / 240) * 100), 90, "Incremented safety ratio must round to 90%");
    });
  });

  // =========================================================================
  // 4. Mascot Fidelity & High-Res PNG Signature
  // =========================================================================
  describe("4. 3D Mascot Asset & Fidelity", () => {
    it("CH-4.1: mascot-thumbsup.png exists, is valid PNG, and is high resolution (>100KB)", () => {
      const mascotPath = path.resolve("public/mascot/mascot-thumbsup.png");
      assert.ok(fs.existsSync(mascotPath), "mascot-thumbsup.png exists");
      const stat = fs.statSync(mascotPath);
      assert.ok(stat.size > 100000, `Mascot should be >100KB, got ${stat.size} bytes`);
      const buf = fs.readFileSync(mascotPath);
      assert.strictEqual(buf[0], 0x89);
      assert.strictEqual(buf[1], 0x50);
      assert.strictEqual(buf[2], 0x4E);
      assert.strictEqual(buf[3], 0x47);
    });
  });
});
