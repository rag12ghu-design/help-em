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
console.log("=== CHECKING ALL STATUS BADGES AND COLOR USAGES ===");

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  const rel = path.relative(process.cwd(), file);
  const lines = content.split("\n");

  lines.forEach((line, idx) => {
    if (line.includes("rounded-full") && (line.includes("bg-") || line.includes("text-"))) {
      if (line.includes("30D158") || line.includes("FF9F0A") || line.includes("FF453A") || line.includes("0A84FF") || line.includes("yellow") || line.includes("amber") || line.includes("emerald") || line.includes("green") || line.includes("red")) {
        console.log(`[${rel}:${idx + 1}] ${line.trim()}`);
      }
    }
  });
}
