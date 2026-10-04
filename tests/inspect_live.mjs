import fs from "fs";

async function inspectTarget(name, url) {
  console.log(`\n========================================`);
  console.log(`INSPECTING: ${name} (${url})`);
  console.log(`========================================`);
  try {
    const res = await fetch(url);
    console.log("Status:", res.status, res.statusText);
    const headers = Object.fromEntries(res.headers.entries());
    console.log("Key Headers:", {
      "content-type": headers["content-type"],
      "content-encoding": headers["content-encoding"],
      "server": headers["server"],
      "cache-control": headers["cache-control"],
      "x-matched-path": headers["x-matched-path"],
    });

    const html = await res.text();
    console.log("HTML length:", html.length);

    // Title
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    console.log("Page Title:", titleMatch ? titleMatch[1] : "N/A");

    // Viewport
    const vpMatch = html.match(/<meta[^>]+name=["']viewport["'][^>]*>/);
    console.log("Viewport Meta:", vpMatch ? vpMatch[0] : "N/A");

    // Character set
    const charsetMatch = html.match(/<meta[^>]+charset=["']?([^"'>\s]+)["']?[^>]*>/i);
    console.log("Charset Meta:", charsetMatch ? charsetMatch[0] : "N/A");

    // Check presence of key sections
    const hasHero = html.includes("When the storm hits");
    const hasConsole = html.includes("Emergency SOS console") || html.includes("sos-console");
    const hasDebunker = html.includes("Ground Truth Debunker") || html.includes("Official Fact-Check");
    const hasDirectory = html.includes("Barangay Mutual Aid Network") || html.includes("Emergency Hotlines");
    const hasOperations = html.includes("Operations Desk") || html.includes("Resilience");

    console.log("Section Checks:", {
      hasHero,
      hasConsole,
      hasDebunker,
      hasDirectory,
      hasOperations
    });

    // Check images
    const images = [...html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/g)].map(m => m[1]);
    console.log("Rendered Images count:", images.length, images.slice(0, 5));

    // Stylesheets
    const cssLinks = [...html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/g)].map(m => m[1]);
    console.log("CSS files count:", cssLinks.length, cssLinks);

    return true;
  } catch (err) {
    console.error(`Error connecting to ${url}:`, err.message);
    return false;
  }
}

async function run() {
  await inspectTarget("PRODUCTION (Vercel)", "https://noble-carson.vercel.app");
  
  // Try localhost:3000
  let localOk = false;
  for (let attempt = 1; attempt <= 3; attempt++) {
    console.log(`\nAttempt ${attempt} to connect to http://localhost:3000...`);
    localOk = await inspectTarget("LOCAL DEV (localhost:3000)", "http://localhost:3000");
    if (localOk) break;
    await new Promise(r => setTimeout(r, 2000));
  }
}

run();
