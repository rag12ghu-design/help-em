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
const buttonAudits = [];

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

        buttonAudits.push({
          file: relPath,
          line,
          className,
          role,
          ariaLabel
        });
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
}

console.log(`Found total ${buttonAudits.length} <button> elements via TypeScript AST.\n`);

const violations = [];
const compliant = [];

for (const btn of buttonAudits) {
  const cls = btn.className;
  
  // Explicit undersized tokens
  const hasUndersizedW = /\b(w-5|w-6|w-7|w-8|w-9|w-10)\b/.test(cls);
  const hasUndersizedH = /\b(h-5|h-6|h-7|h-8|h-9|h-10)\b/.test(cls);
  const hasMinH44 = /min-h-\[44px\]|h-11|h-12|h-14|h-16/.test(cls);
  const hasMinW44 = /min-w-\[44px\]|w-11|w-12|w-14|w-16/.test(cls);
  
  // Padding based height
  const hasLargePy = /py-3\.5|py-4|py-5/.test(cls);
  const hasLargePx = /px-4|px-5|px-6|px-8/.test(cls);

  const isSmall = (hasUndersizedW || hasUndersizedH) && !(hasMinH44 && hasMinW44);
  const lacks44Height = !hasMinH44 && !hasLargePy && !/h-(1[1-9]|2\d)/.test(cls);

  if (isSmall || lacks44Height) {
    violations.push({
      ...btn,
      reason: isSmall ? "Explicit undersized dimension (w-8, h-8, h-7, etc.)" : "Lacks 44pt height (no min-h-[44px] or py-3.5+)"
    });
  } else {
    compliant.push(btn);
  }
}

console.log(`=== AUDIT SUMMARY ===`);
console.log(`Compliant: ${compliant.length}`);
console.log(`Violations / Concerns: ${violations.length}\n`);

console.log(`=== VIOLATION DETAILS ===`);
for (const v of violations) {
  console.log(`[${v.file}:${v.line}] Reason: ${v.reason}`);
  console.log(`   Classes: ${v.className.slice(0, 150)}...`);
  if (v.ariaLabel) console.log(`   aria-label: ${v.ariaLabel}`);
}
