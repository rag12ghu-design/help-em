import ts from "typescript";
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
const buttons = [];

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  const relPath = path.relative(process.cwd(), file);
  const sourceFile = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

  function visit(node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tagName = node.tagName.getText(sourceFile);
      if (tagName === "button") {
        const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
        let className = "";
        let role = "";
        let ariaLabel = "";
        let type = "";

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
            } else if (name === "type") {
              if (attr.initializer && ts.isStringLiteral(attr.initializer)) {
                type = attr.initializer.text;
              }
            }
          }
        }

        buttons.push({
          file: relPath,
          line,
          className,
          role,
          ariaLabel,
          type
        });
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
}

console.log(`=== CHALLENGER DETAILED AUDIT: ${buttons.length} BUTTONS FOUND ===\n`);

let compliantCount = 0;
let suspiciousCount = 0;

for (let i = 0; i < buttons.length; i++) {
  const b = buttons[i];
  const cls = b.className;

  // Check dimension indicators
  const hasMinH = /min-h-\[44px\]/.test(cls);
  const hasMinW = /min-w-\[44px\]/.test(cls);
  const hasH11Plus = /\b(h-11|h-12|h-14|h-16|h-20)\b/.test(cls);
  const hasW11Plus = /\b(w-11|w-12|w-14|w-16|w-20|w-full)\b/.test(cls);
  const hasLargePy = /\b(py-3\.5|py-4|py-5)\b/.test(cls);
  const hasLargePx = /\b(px-4|px-5|px-6|px-7|px-8)\b/.test(cls);

  // Height check: satisfies >= 44px
  const heightOk = hasMinH || hasH11Plus || hasLargePy;
  // Width check: satisfies >= 44px
  const widthOk = hasMinW || hasW11Plus || hasLargePx;

  // Explicit small tokens
  const smallW = cls.match(/\b(w-[1-9]|w-10)\b/g);
  const smallH = cls.match(/\b(h-[1-9]|h-10)\b/g);

  const isSuspicious = !heightOk || !widthOk || (smallW && !hasMinW && !hasW11Plus) || (smallH && !hasMinH && !hasH11Plus);

  if (isSuspicious) {
    suspiciousCount++;
    console.log(`[SUSPICIOUS #${suspiciousCount}] ${b.file}:${b.line}`);
    console.log(`  aria: "${b.ariaLabel}"`);
    console.log(`  smallW: ${smallW}, smallH: ${smallH}, heightOk: ${heightOk}, widthOk: ${widthOk}`);
    console.log(`  class: ${cls.replace(/\s+/g, " ")}\n`);
  } else {
    compliantCount++;
  }
}

console.log(`=== AUDIT RESULT ===`);
console.log(`Total Buttons: ${buttons.length}`);
console.log(`Compliant: ${compliantCount}`);
console.log(`Suspicious: ${suspiciousCount}`);
