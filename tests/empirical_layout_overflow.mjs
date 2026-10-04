import fs from "fs";
import path from "path";

// Check files for unconstrained flex rows that may cause overflow at 375px
const files = [
  "src/components/SOSConsole.tsx",
  "src/components/Navigation.tsx",
  "src/components/ResponderOperationsDesk.tsx",
  "src/components/PurokInspectorHUD.tsx",
  "src/components/SafetyCheckIn.tsx",
  "src/components/CitizenCaseTracker.tsx",
  "src/components/ActionModal.tsx",
  "src/components/DebunkerSection.tsx",
  "src/components/AidDirectory.tsx",
  "src/app/page.tsx"
];

console.log("=== INSPECTING POTENTIAL 375PX OVERFLOW PATTERNS ===");

for (const relFile of files) {
  const filePath = path.resolve(relFile);
  if (!fs.existsSync(filePath)) continue;
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");

  lines.forEach((line, idx) => {
    // Look for flex containers with justify-between and no wrap
    if (line.includes("flex") && line.includes("justify-between") && !line.includes("flex-col") && !line.includes("flex-wrap")) {
      console.log(`[${relFile}:${idx + 1}] Flex row without wrap/col: ${line.trim()}`);
    }
    // Look for fixed pixel widths > 300px
    const fixedPx = line.match(/w-\[(\d+)px\]/g);
    if (fixedPx) {
      for (const f of fixedPx) {
        const val = parseInt(f.match(/\d+/)[0], 10);
        if (val > 300) {
          console.log(`[${relFile}:${idx + 1}] Large fixed width (${val}px): ${line.trim()}`);
        }
      }
    }
  });
}
