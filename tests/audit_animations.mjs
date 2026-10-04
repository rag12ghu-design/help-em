import fs from "fs";
import path from "path";

const srcDir = path.resolve("src");
function getAllFiles(dir, exts = [".tsx", ".jsx", ".css", ".js"]) {
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
console.log("=== CHECKING ALL ANIMATION EASING AND KEYFRAMES ===");

const animPatterns = [
  /ease-\w+/g,
  /animate-\w+/g,
  /transition\S*/g,
  /@keyframes\s+([^{]+)/g,
  /animation:[^;]+;/g,
  /cubic-bezier\([^)]+\)/g
];

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  const rel = path.relative(process.cwd(), file);
  const lines = content.split("\n");

  lines.forEach((line, idx) => {
    let matched = false;
    for (const pat of animPatterns) {
      if (pat.test(line)) {
        matched = true;
        break;
      }
    }
    if (matched) {
      // Filter out boring simple transition-colors or transition-transform unless notable
      if (line.includes("bounce") || line.includes("elastic") || line.includes("spring") || line.includes("cubic-bezier") || line.includes("@keyframes") || line.includes("animate-float") || line.includes("ease-")) {
        console.log(`[${rel}:${idx + 1}] ${line.trim()}`);
      }
    }
  });
}
