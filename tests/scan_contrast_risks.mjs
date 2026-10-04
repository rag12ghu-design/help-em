import fs from "fs";
import path from "path";

const srcDir = path.resolve("src");
function getAllFiles(dir, exts = [".tsx", ".jsx"]) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, exts));
    } else if (exts.includes(path.extname(file))) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = getAllFiles(srcDir);
console.log("=== SEARCHING FOR RISKY TEXT CONTRAST CLASSES ===");

const riskyPatterns = [
  { pattern: /text-\[#30D158\]/g, name: "text-[#30D158] (system green text)" },
  { pattern: /text-\[#FF453A\]/g, name: "text-[#FF453A] (system red text)" },
  { pattern: /text-\[#FF9F0A\]/g, name: "text-[#FF9F0A] (system amber text)" },
  { pattern: /text-\[#06391C\]\/(30|40|50|60)/g, name: "text-[#06391C]/30-60 (low opacity dark green text)" },
  { pattern: /text-green-[56]00/g, name: "text-green-500/600" },
  { pattern: /text-amber-[56]00/g, name: "text-amber-500/600" },
  { pattern: /text-red-[56]00/g, name: "text-red-500/600" },
];

for (const f of files) {
  const content = fs.readFileSync(f, "utf8");
  const lines = content.split("\n");
  const rel = path.relative(process.cwd(), f);

  lines.forEach((line, idx) => {
    for (const rp of riskyPatterns) {
      if (rp.pattern.test(line)) {
        console.log(`[${rel}:${idx + 1}] (${rp.name}):\n  ${line.trim().slice(0, 140)}`);
      }
    }
  });
}
