/**
 * Tier 3: Cross-Feature Combinations E2E Test Suite
 * Pairwise interactions, modal mode transitions, and state persistence verification (10 test cases).
 * 
 * Combinations Covered:
 * 1. Safety check-in persistence across layer switcher
 * 2. Active Purok selection persistence across layer switcher
 * 3. Safety check-in persistence across modal workflows
 * 4. Purok selection context retention after SOS modal dispatch
 * 5. Dynamic multi-modal mode switching across trigger origins
 * 6. Console SOS dispatch preserves community accounting integrity
 * 7. Multi-feature high-tempo interaction sequence
 * 8. Footer inspection preserves active map HUD bindings
 * 9. Ground Truth Debunker correlation with Purok 1 Riverside status
 * 10. Mutual Aid station locations correlation with geographic Purok nodes
 */

import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import path from "path";
import { mountApp, tearDownDom, loadModule } from "./harness.mjs";

const puroksModule = loadModule(path.resolve(process.cwd(), "src/data/puroks.ts"));
const PUROK_NODES = puroksModule.PUROK_NODES;

const debunkersModule = loadModule(path.resolve(process.cwd(), "src/data/debunkers.ts"));
const DEBUNKER_ITEMS = debunkersModule.DEBUNKER_ITEMS;

const resourcesModule = loadModule(path.resolve(process.cwd(), "src/data/resources.ts"));
const BARANGAY_RESOURCES = resourcesModule.BARANGAY_RESOURCES;

describe("Tier 3: Cross-Feature Combinations Suite", () => {
  let app;

  beforeEach(async () => {
    app = await mountApp();
  });

  afterEach(async () => {
    await tearDownDom();
  });

  it("T3.1: safety check-in state persists across layer switcher transitions", async () => {
    const sw = app.getSafetySwitch();
    await sw.toggle(); // Turn safe on (215)
    assert.strictEqual(app.getSafetySwitch().isChecked, true);
    assert.strictEqual(app.getSafetyCounterText().safe, 215);

    // Switch to Radar
    const switcher = app.getLayerSwitcher();
    await switcher.switchRadar();
    assert.ok(app.doc.body.textContent.includes("PAGASA Doppler") || app.doc.body.textContent.includes("Signal 2"));

    // Switch back to Map
    await switcher.switchPurok();
    assert.strictEqual(app.getSafetySwitch().isChecked, true, "Safety switch must remain checked after layer roundtrip");
    assert.strictEqual(app.getSafetyCounterText().safe, 215, "Counter must remain 215 after layer roundtrip");
  });

  it("T3.2: active Purok selection persists across layer switcher transitions", async () => {
    // Select Purok 4 (Lowland)
    await app.clickPurokPin(4);
    let hud = app.getInspectorHUD();
    assert.ok(hud.text.includes("Purok 4"), "Purok 4 selected initially");

    // Switch to Radar
    const switcher = app.getLayerSwitcher();
    await switcher.switchRadar();

    // Switch back to Map
    await switcher.switchPurok();
    hud = app.getInspectorHUD();
    assert.ok(hud.text.includes("Purok 4"), "Purok 4 must remain selected after layer switcher roundtrip");
  });

  it("T3.3: safety check-in state persists across modal workflows and form submission", async () => {
    const sw = app.getSafetySwitch();
    await sw.toggle(); // 215
    assert.strictEqual(app.getSafetyCounterText().safe, 215);

    // Open modal via Connect Campus
    const modal = await app.openModalVia("connect-campus");
    await modal.submit({
      name: "Juan dela Cruz",
      phone: "0917-123-4567",
      purok: "purok-2",
      members: "4",
    });
    await modal.close();

    // Check safety switch still true
    assert.strictEqual(app.getSafetySwitch().isChecked, true, "Safety switch must stay checked after modal submission");
    assert.strictEqual(app.getSafetyCounterText().safe, 215, "Safe count must stay 215 after modal submission");
  });

  it("T3.4: active Purok HUD selection is retained after launching and dismissing Emergency SOS modal", async () => {
    // Select Purok 1 (Riverside)
    await app.clickPurokPin(1);
    assert.ok(app.getInspectorHUD().text.includes("Purok 1"));

    // Open Emergency SOS modal
    const modal = await app.openModalVia("sos");
    assert.ok(modal.title.includes("SOS") || modal.title.includes("Distress"));
    await modal.close();

    // Verify HUD still retains Purok 1
    const hud = app.getInspectorHUD();
    assert.ok(hud.text.includes("Purok 1"), "Purok 1 Riverside must remain selected after SOS modal dismissal");
    assert.ok(hud.text.includes("48 / 50") || hud.text.includes("River Watch"));
  });

  it("T3.5: dynamic multi-modal mode switching resolves correctly across varied triggers", async () => {
    // Trigger 1: Aid Station -> Aid Mode
    const aidModal = await app.openModalVia("aid");
    assert.ok(aidModal.title.includes("Aid") || aidModal.title.includes("Station"));
    await aidModal.close();

    // Trigger 2: Dynamic Island Open App -> Join Mode
    const joinModal = await app.openModalVia("open-app");
    assert.ok(joinModal.title.includes("Enroll") || joinModal.title.includes("Campus") || joinModal.title.includes("Connect"));
    await joinModal.close();

    // Trigger 3: Console SOS Button -> SOS Mode
    const sosModal = await app.openModalVia("sos");
    assert.ok(sosModal.title.includes("SOS") || sosModal.title.includes("Distress"));
    await sosModal.close();
  });

  it("T3.6: console SOS dispatch preserves community accounting integrity", async () => {
    const initialCounter = app.getSafetyCounterText();
    assert.strictEqual(initialCounter.safe, 214);
    assert.strictEqual(initialCounter.total, 240);

    const sosModal = await app.openModalVia("sos");
    await sosModal.submit({
      name: "Emergency Caller",
      phone: "0917-999-1111",
      purok: "purok-4",
    });
    await sosModal.close();

    const afterCounter = app.getSafetyCounterText();
    assert.strictEqual(afterCounter.total, 240, "Total households accounting must remain strictly 240");
  });

  it("T3.7: multi-feature high-tempo interaction sequence maintains deterministic state", async () => {
    // Step 1: Switch to Typhoon Radar
    const switcher = app.getLayerSwitcher();
    await switcher.switchRadar();

    // Step 2: Toggle safety check-in
    const sw = app.getSafetySwitch();
    await sw.toggle(); // 215

    // Step 3: Switch back to Purok Map
    await switcher.switchPurok();

    // Step 4: Click Purok 5 (Highland)
    await app.clickPurokPin(5);

    // Step 5: Open Action Modal via Enroll Family
    const modal = await app.openModalVia("enroll-family");
    assert.ok(modal, "Modal open");
    await modal.close();

    // Verification
    assert.strictEqual(app.getSafetySwitch().isChecked, true, "Safety switch is active");
    assert.strictEqual(app.getSafetyCounterText().safe, 215, "Safety counter is 215");
    assert.ok(app.getInspectorHUD().text.includes("Purok 5"), "Purok 5 is active in HUD");
    assert.strictEqual(app.getPurokPins().length, 5, "All 5 pins visible");
  });

  it("T3.8: footer hotline inspection and interaction preserves active map HUD bindings", async () => {
    // Select Purok 3 (Covered Court)
    await app.clickPurokPin(3);
    assert.ok(app.getInspectorHUD().text.includes("Purok 3"));

    // Query and interact with footer
    const hotlines = app.getHotlines();
    assert.strictEqual(hotlines.hasBrgyDesk, true);
    assert.strictEqual(hotlines.hasClinic, true);
    assert.strictEqual(hotlines.hasCdrrmo, true);

    // Assert Purok 3 remains active
    const hud = app.getInspectorHUD();
    assert.ok(hud.text.includes("Purok 3"), "Purok 3 must remain selected in inspector");
  });

  it("T3.9: Ground Truth Debunker content strictly correlates with Purok 1 Riverside node status", () => {
    const purok1 = PUROK_NODES.find(p => p.id === "purok-1");
    assert.ok(purok1, "Purok 1 must exist");
    assert.ok(purok1.hazards.includes("2.1m") || purok1.details.includes("2.1m"), "Purok 1 specifies 2.1m threshold");

    const debunker1 = DEBUNKER_ITEMS.find(d => d.purok === "Purok 1");
    assert.ok(debunker1, "Debunker item for Purok 1 must exist");
    assert.ok(debunker1.verifiedText.includes("2.1m"), "Debunker 1 must corroborate 2.1m water level");
  });

  it("T3.10: Mutual Aid Directory locations strictly correlate with geographic Purok nodes", () => {
    // Aid Station 1: Barangay Hall -> Purok 2
    assert.ok(BARANGAY_RESOURCES[0].location.includes("Purok 2"));
    // Aid Station 2: Covered Court -> Purok 3
    assert.ok(BARANGAY_RESOURCES[1].location.includes("Purok 3"));
    // Aid Station 3: Riverside Deep Well -> Purok 1
    assert.ok(BARANGAY_RESOURCES[2].location.includes("Purok 1"));
    // Aid Station 4: Health Center -> Purok 2
    assert.ok(BARANGAY_RESOURCES[3].location.includes("Purok 2"));
    // Aid Station 5: Shuttle Transit -> Purok 4
    assert.ok(BARANGAY_RESOURCES[4].location.includes("Purok 4") || BARANGAY_RESOURCES[4].details.includes("Purok 4"));
  });
});
