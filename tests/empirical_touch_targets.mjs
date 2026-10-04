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
const detailedFindings = [];

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  const relPath = path.relative(process.cwd(), file);
  
  // Regex to extract entire opening tag of <button
  const buttonRegex = /<button\b([\s\S]*?)>/g;
  let match;
  while ((match = buttonRegex.exec(content)) !== null) {
    const tagAttrs = match[1];
    const lineNum = content.substring(0, match.index).split("\n").length;
    
    // Extract className whether string literal or template expression
    let classNameStr = "";
    const strMatch = tagAttrs.match(/className="([^"]*)"/);
    if (strMatch) {
      classNameStr = strMatch[1];
    } else {
      const exprMatch = tagAttrs.match(/className=\{`([\s\S]*?)`\}/);
      if (exprMatch) {
        classNameStr = exprMatch[1];
      } else {
        const anyExpr = tagAttrs.match(/className=\{([\s\S]*?)\}/);
        if (anyExpr) classNameStr = anyExpr[1];
      }
    }

    // Evaluate dimensions
    const hasMinH44 = /min-h-\[44px\]|h-11|h-12|h-14|h-16|h-20|min-h-11|min-h-12|py-3\.5|py-4|py-5/.test(classNameStr);
    const hasMinW44 = /min-w-\[44px\]|w-11|w-12|w-14|w-16|w-20|min-w-11|min-w-12|w-full|px-6|px-8/.test(classNameStr);
    
    // Look specifically for undersized classes: w-5, w-6, w-7, w-8, w-9, w-10, h-5, h-6, h-7, h-8, h-9, h-10, py-1, py-1.5, py-2 without min-h
    const smallSizes = classNameStr.match(/\b(w-[5-9]|w-10|h-[5-9]|h-10|w-\[\d+px\]|h-\[\d+px\])\b/g);

    detailedFindings.push({
      file: relPath,
      line: lineNum,
      className: classNameStr.replace(/\s+/g, " ").trim(),
      smallSizes,
      hasMinH44,
      hasMinW44
    });
  }
}

console.log(`Extracted ${detailedFindings.length} button tags across components.`);

console.log("\n=== 1. BUTTONS WITH EXPLICIT UNDERSIZED WIDTH / HEIGHT (w-<44px or h-<44px) ===");
for (const f of detailedFindings) {
  if (f.smallSizes) {
    // Check if smallSizes has values < 44px
    const smalls = f.smallSizes.filter(s => {
      const pxMatch = s.match(/\[(\d+)px\]/);
      if (pxMatch) return parseInt(pxMatch[1], 10) < 44;
      const numMatch = s.match(/[wh]-(\d+)/);
      if (numMatch) return parseInt(numMatch[1], 10) < 11;
      return false;
    });
    if (smalls.length > 0) {
      console.log(`[${f.file}:${f.line}] Small tokens: ${smalls.join(", ")}`);
      console.log(`  Classes: "${f.className}"`);
    }
  }
}

console.log("\n=== 2. BUTTONS WITH NO MIN-H-[44PX] OR EQUIVALENT PADDING ===");
for (const f of detailedFindings) {
  if (!f.hasMinH44) {
    console.log(`[${f.file}:${f.line}] Lacks min-h-[44px] or py-3.5+: "${f.className}"`);
  }
}
