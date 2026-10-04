/**
 * Tier 4: Real-World Application Scenarios E2E Test Suite
 * Comprehensive civic immersion user journeys (5 extensive scenario test cases).
 * 
 * Scenarios Covered:
 * 1. Barangay Quiling Community Flood Drill Scenario
 * 2. Typhoon Landfall Timeline Simulation Scenario
 * 3. MMSU NSTP CWTS Volunteer Registration Cycle Scenario
 * 4. Relief Station Logistics & Supply Coordination Scenario
 * 5. Community Anti-Panic Information Verification Cycle Scenario
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

describe("Tier 4: Real-World Application Scenarios Suite", () => {
  let app;

  beforeEach(async () => {
    app = await mountApp();
  });

  afterEach(async () => {
    await tearDownDom();
  });

  // =========================================================================
  // Scenario 1: Barangay Quiling Flood Drill Scenario
  // =========================================================================
  it("T4.1: Barangay Quiling Flood Drill Scenario (multi-node evacuation drill)", async () => {
    // 1. Initial drill state: baseline 214 of 240 safe
    const initialCounter = app.getSafetyCounterText();
    assert.strictEqual(initialCounter.safe, 214, "Drill begins at baseline 214 families safe");
    assert.strictEqual(initialCounter.total, 240, "Barangay total is 240 households");

    // 2. Incident commander checks Purok 1 Riverside flood watch node
    await app.clickPurokPin(1);
    let hud = app.getInspectorHUD();
    assert.ok(hud.text.includes("Purok 1") && hud.text.includes("Riverside"), "HUD shows Purok 1 Riverside");
    assert.ok(hud.text.includes("48 / 50"), "Purok 1 records 48 of 50 families accounted for");

    // 3. Commander checks Lowland evacuation shuttle route at Purok 4
    await app.clickPurokPin(4);
    hud = app.getInspectorHUD();
    assert.ok(hud.text.includes("Purok 4") && (hud.text.includes("Lowland") || hud.text.includes("Transit")), "HUD shows Purok 4 Lowland");

    // 4. Commander checks destination shelter at Purok 3 Covered Court
    await app.clickPurokPin(3);
    hud = app.getInspectorHUD();
    assert.ok(hud.text.includes("Purok 3") && (hud.text.includes("Covered Court") || hud.text.includes("Evac")), "HUD shows Purok 3 Evacuation Center");

    // 5. Volunteer participant marks their student household as safe
    const sw = app.getSafetySwitch();
    await sw.toggle();
    assert.strictEqual(app.getSafetySwitch().isChecked, true, "Safety switch toggled to Safe");
    assert.strictEqual(app.getSafetyCounterText().safe, 215, "Safety counter increments to 215");

    // 6. Volunteer registers drill household intake via Connect Campus modal
    const modal = await app.openModalVia("connect-campus");
    await modal.submit({
      name: "Drill Volunteer Elena",
      phone: "0917-555-4321",
      purok: "purok-1",
      members: "5",
    });

    const bodyText = app.doc.body.textContent || "";
    assert.ok(
      bodyText.includes("Ticket") || bodyText.includes("Active") || bodyText.includes("Campus Connect"),
      "Drill submission issues a verified dispatch ticket"
    );
    await modal.close();

    // 7. Verify persistent post-drill state
    assert.strictEqual(app.getSafetyCounterText().safe, 215, "Community accounting maintains 215 safe count");
    assert.strictEqual(app.getPurokPins().length, 5, "All 5 Purok nodes remain monitored");
  });

  // =========================================================================
  // Scenario 2: Typhoon Landfall Timeline Scenario
  // =========================================================================
  it("T4.2: Typhoon Landfall Timeline Scenario (Signal 2 Doppler escalation & generator dispatch)", async () => {
    // 1. Citizen switches to Typhoon Radar layer upon hearing storm sirens
    const switcher = app.getLayerSwitcher();
    await switcher.switchRadar();
    assert.ok(
      app.doc.body.textContent.includes("PAGASA Doppler") || app.doc.body.textContent.includes("Signal 2"),
      "Citizen monitors PAGASA Doppler Signal 2 advisory"
    );
    assert.ok(app.doc.body.textContent.includes("85 km/h") || app.doc.body.textContent.includes("Signal 2"), "Severe wind conditions monitored");

    // 2. Citizen checks Ground Truth debunker to verify power outage rumor
    const debunker = app.getDebunkerCards();
    assert.ok(debunker.allText.includes("Feeder 4 estimated back by 22:00 PST"), "Debunker confirms INEC Feeder 4 repair timetable");

    // 3. Citizen checks Barangay Mutual Aid directory for backup power
    assert.ok(debunker.allText.includes("Barangay Hall Emergency Generator Hub"), "Generator Hub is open");
    assert.ok(debunker.allText.includes("30 charging slots"), "Generator hub has phone charging slots");

    // 4. Citizen activates immediate household safety status on the console
    const sw = app.getSafetySwitch();
    await sw.toggle();
    assert.strictEqual(app.getSafetySwitch().isChecked, true, "Household safety confirmed");
    assert.strictEqual(app.getSafetyCounterText().safe, 215, "Community count incremented to 215");

    // 5. Citizen submits emergency aid request to target generator hub
    const aidModal = await app.openModalVia("aid");
    await aidModal.submit({
      name: "Marc Valdez",
      phone: "0917-888-2233",
      purok: "purok-2",
    });

    const bodyText = app.doc.body.textContent || "";
    assert.ok(
      bodyText.includes("Ticket") || bodyText.includes("Aid") || bodyText.includes("Active"),
      "Aid reservation receives confirmation ticket"
    );
    await aidModal.close();

    // 6. Switch back to Purok Map to verify community status
    await switcher.switchPurok();
    assert.strictEqual(app.getPurokPins().length, 5, "Community pins visible");
  });

  // =========================================================================
  // Scenario 3: MMSU NSTP CWTS Volunteer Registration Cycle Scenario
  // =========================================================================
  it("T4.3: MMSU NSTP CWTS Volunteer Registration Cycle Scenario (student onboarding & mesh intake)", async () => {
    // 1. Student observes Dynamic Island header status
    const island = app.getDynamicIsland();
    assert.strictEqual(island.brandText, true, "Help'Em branding verified");
    assert.strictEqual(island.meshActive, true, "Campus Mesh Active indicator verified");

    // 2. Student verifies official 3D MMSU Mascot in thumbs-up walkie-talkie pose
    const mascot = app.getMascotHero();
    assert.ok(
      mascot.src.includes("mascot-thumbsup.png") || mascot.src.includes("mascot-thumbsup.jpg"),
      "Official 3D mascot loaded"
    );
    assert.strictEqual(mascot.isPriority, true, "Priority LCP loading set");

    // 3. Student clicks 'Open App' in Dynamic Island to begin registration
    const modal = await app.openModalVia("open-app");
    assert.ok(
      modal.title.includes("Enroll") || modal.title.includes("Campus") || modal.title.includes("Connect"),
      "Modal opens in Campus Connect mode"
    );

    // 4. Student enters complete registration profile
    await modal.submit({
      name: "Danielle Ramos (MMSU CWTS)",
      phone: "0918-765-4321",
      purok: "purok-2",
      members: "4",
    });

    // 5. Verification receipt displayed
    const bodyText = app.doc.body.textContent || "";
    assert.ok(
      bodyText.includes("Ticket") || bodyText.includes("Active") || bodyText.includes("Campus Connect"),
      "Registration receipt generated with confirmation ticket"
    );
    await modal.close();

    // 6. Student inspects footer to confirm university affiliation and hotlines
    const hotlines = app.getHotlines();
    assert.strictEqual(hotlines.hasMmsuAffiliation, true, "University affiliation confirmed");
    assert.strictEqual(hotlines.hasClinic, true, "MMSU Health Clinic team hotline verified");
  });

  // =========================================================================
  // Scenario 4: Relief Station Logistics & Supply Coordination Scenario
  // =========================================================================
  it("T4.4: Relief Station Logistics & Supply Coordination Scenario (evacuation center triage & water dispatch)", async () => {
    // 1. Logistics officer verifies all 5 mutual aid stations in directory
    const aidCards = app.getAidCards();
    assert.strictEqual(aidCards.length, 5, "5 mutual aid stations ready");

    // 2. Verifies Covered Court Evacuation Center capacity
    const bodyText = app.doc.body.textContent || "";
    assert.ok(bodyText.includes("Community Covered Court Evacuation Center"), "Covered Court station active");
    assert.ok(bodyText.includes("42 / 80 cots filled"), "Covered Court reports 42/80 cots filled");

    // 3. Verifies Sitio Riverside Clean Water Refill capacity
    assert.ok(bodyText.includes("Sitio Riverside Clean Water Refill Station"), "Water refill station active");
    assert.ok(bodyText.includes("Unlimited flow"), "Filtration pump reports unlimited flow");

    // 4. Checks Ground Truth debunker relief food dispatch confirmation
    assert.ok(bodyText.includes("150 hot rice porridge"), "MMSU CWTS delivered 150 hot rice porridge bowls");

    // 5. Coordinates medical supply request for first aid outpost via modal
    const modal = await app.openModalVia("aid");
    await modal.submit({
      name: "Nurse Volunteer Joyce",
      phone: "0917-333-7788",
      purok: "purok-2",
    });

    assert.ok(
      app.doc.body.textContent.includes("Ticket") || app.doc.body.textContent.includes("Aid"),
      "Medical aid request logged with ticket"
    );
    await modal.close();

    // 6. Verifies emergency escalation hotline
    const hotlines = app.getHotlines();
    assert.strictEqual(hotlines.hasBrgyDesk, true, "Barangay emergency desk hotline accessible");
    assert.strictEqual(hotlines.hasCdrrmo, true, "CDRRMO 911 hotline accessible");
  });

  // =========================================================================
  // Scenario 5: Community Anti-Panic Information Verification Cycle Scenario
  // =========================================================================
  it("T4.5: Community Anti-Panic Information Verification Cycle Scenario (rumor debunker & official verification)", async () => {
    // 1. Resident sees confusing viral rumors
    const debunker = app.getDebunkerCards();
    assert.strictEqual(debunker.rumorsFound, true, "Rumors section loaded");
    assert.ok(debunker.allText.includes("gumuho daw ang dike sa Purok 1"), "Rumor 1 found");
    assert.ok(debunker.allText.includes("Wala raw kuryente buong linggo"), "Rumor 2 found");
    assert.ok(debunker.allText.includes("Walang pagkain sa evacuation"), "Rumor 3 found");

    // 2. Resident cross-references official fact-checks
    assert.strictEqual(debunker.truthFound, true, "Truth section loaded");
    assert.ok(debunker.allText.includes("19:30 PST"), "Embankment inspection fact-check timestamped 19:30 PST");
    assert.ok(debunker.allText.includes("Dike is fully intact"), "Official confirmation dike is intact");

    // 3. Resident cross-references Purok 1 node on the community map
    await app.clickPurokPin(1);
    const hud = app.getInspectorHUD();
    assert.ok(hud.text.includes("Purok 1") && hud.text.includes("Riverside"), "Purok 1 Riverside status matches");
    assert.ok(hud.text.includes("River level steady at 2.1m"), "Purok 1 water level normal");

    // 4. Resident confirms household safety
    const sw = app.getSafetySwitch();
    await sw.toggle();
    assert.strictEqual(app.getSafetySwitch().isChecked, true, "Safety switch toggled");
    assert.strictEqual(app.getSafetyCounterText().safe, 215, "Household verified safe");

    // 5. Resident confirms Barangay Emergency Desk number for neighbor verification
    const hotlines = app.getHotlines();
    assert.strictEqual(hotlines.hasBrgyDesk, true, "Hotline 0917-889-MMSU verified for community verification");
  });
});
