// WCAG 2.1 Contrast Ratio Calculator

function hexToRgb(hex) {
  let c = hex.replace("#", "");
  if (c.length === 3) c = c.split("").map(x => x + x).join("");
  const num = parseInt(c, 16);
  return [ (num >> 16) & 255, (num >> 8) & 255, num & 255 ];
}

function srgbToLinear(val) {
  const v = val / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function getLuminance(r, g, b) {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function blend(fgRgb, fgAlpha, bgRgb) {
  return [
    Math.round((1 - fgAlpha) * bgRgb[0] + fgAlpha * fgRgb[0]),
    Math.round((1 - fgAlpha) * bgRgb[1] + fgAlpha * fgRgb[1]),
    Math.round((1 - fgAlpha) * bgRgb[2] + fgAlpha * fgRgb[2]),
  ];
}

function contrast(rgb1, rgb2) {
  const l1 = getLuminance(rgb1[0], rgb1[1], rgb1[2]);
  const l2 = getLuminance(rgb2[0], rgb2[1], rgb2[2]);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const white = [255, 255, 255];
const forest = hexToRgb("#06391C");
const lightGreen = hexToRgb("#EAF5EE");
const surface = hexToRgb("#F4F9F5");

// Check combinations
const pairs = [
  { name: "#06391C on #FFFFFF", fg: forest, bg: white },
  { name: "#06391C (70% opacity) on #FFFFFF", fg: blend(forest, 0.7, white), bg: white },
  { name: "#06391C (60% opacity) on #FFFFFF", fg: blend(forest, 0.6, white), bg: white },
  { name: "#06391C (40% opacity) on #FFFFFF", fg: blend(forest, 0.4, white), bg: white },
  { name: "#06391C on #EAF5EE", fg: forest, bg: lightGreen },
  { name: "#06391C (70% opacity) on #EAF5EE", fg: blend(forest, 0.7, lightGreen), bg: lightGreen },
  { name: "#06391C on #F4F9F5", fg: forest, bg: surface },
  { name: "#FFFFFF on #06391C", fg: white, bg: forest },
  { name: "#30D158 on #06391C", fg: hexToRgb("#30D158"), bg: forest },
  { name: "#30D158 on #FFFFFF", fg: hexToRgb("#30D158"), bg: white },
  { name: "#FF453A on #FFFFFF", fg: hexToRgb("#FF453A"), bg: white },
  { name: "#FF453A on #06391C", fg: hexToRgb("#FF453A"), bg: forest },
  { name: "#FF9F0A on #FFFFFF", fg: hexToRgb("#FF9F0A"), bg: white },
  { name: "#FF9F0A on #06391C", fg: hexToRgb("#FF9F0A"), bg: forest },
  { name: "#D97706 on #FFFFFF", fg: hexToRgb("#D97706"), bg: white },
  { name: "#D97706 on #FEF3C7", fg: hexToRgb("#D97706"), bg: hexToRgb("#FEF3C7") },
  { name: "#DC2626 on #FEE2E2", fg: hexToRgb("#DC2626"), bg: hexToRgb("#FEE2E2") },
  { name: "#16A34A on #DCFCE7", fg: hexToRgb("#16A34A"), bg: hexToRgb("#DCFCE7") },
  { name: "#2563EB on #DBEAFE", fg: hexToRgb("#2563EB"), bg: hexToRgb("#DBEAFE") },
  { name: "White on .apple-glass-dark (rgba(6,57,28,0.92) over white)", fg: white, bg: blend(forest, 0.92, white) },
  { name: "#30D158 on .apple-glass-dark (rgba(6,57,28,0.92) over white)", fg: hexToRgb("#30D158"), bg: blend(forest, 0.92, white) },
  { name: "#06391C on .apple-glass (rgba(255,255,255,0.82) over lightGreen)", fg: forest, bg: blend(white, 0.82, lightGreen) },
];

console.log("=== EMPIRICAL WCAG 2.1 COLOR CONTRAST RATIO ANALYSIS ===");
for (const p of pairs) {
  const r = contrast(p.fg, p.bg);
  const aaNormal = r >= 4.5 ? "PASS" : "FAIL";
  const aaLarge = r >= 3.0 ? "PASS" : "FAIL";
  const aaaNormal = r >= 7.0 ? "PASS" : "FAIL";
  console.log(`${p.name.padEnd(60)} : ${r.toFixed(2)}:1 [AA normal: ${aaNormal}, AA large/UI: ${aaLarge}, AAA: ${aaaNormal}]`);
}
