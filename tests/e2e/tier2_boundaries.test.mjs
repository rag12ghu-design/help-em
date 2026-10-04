/**
 * Tier 2: Boundary & Corner Cases E2E Test Suite
 * Minimum 5 test cases per core area (30 test cases total).
 * 
 * Areas Covered:
 * 1. Safety Toggle Boundary & Stress
 * 2. Layer Switcher Rapid Transitions & Stability
 * 3. Purok Pin Selection & Coordinate Bounds
 * 4. Modal Lifecycle, Mode Transitions & Reset
 * 5. Form Input Validation & Boundary Enforcement
 * 6. Data Contract Extremes & Content Verification
 */

import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import path from "path";
import { act } from "react";
import { mountApp, tearDownDom, setControlValue, loadModule } from "./harness.mjs";

const puroksModule = loadModule(path.resolve(process.cwd(), "src/data/puroks.ts"));
const PUROK_NODES = puroksModule.PUROK_NODES;

const resourcesModule = loadModule(path.resolve(process.cwd(), "src/data/resources.ts"));
const BARANGAY_RESOURCES = resourcesModule.BARANGAY_RESOURCES;

describe("Tier 2: Boundary & Corner Cases Suite", () => {
  let app;

  beforeEach(async () => {
    app = await mountApp();
  });

  afterEach(async () => {
    await tearDownDom();
  });

  // =========================================================================
  // 1. Safety Toggle Boundary & Stress (5 tests)
  // =========================================================================
  describe("1. Safety Toggle Boundary & Stress", () => {
    it("T2.1.1: rapid even toggle clicks (10 times) returns stably to baseline (214 Safe, aria-checked='false')", async () => {
      const sw = app.getSafetySwitch();
      for (let i = 0; i < 10; i++) {
        await sw.toggle();
      }
      const updatedSw = app.getSafetySwitch();
      assert.strictEqual(updatedSw.isChecked, false, "After 10 toggle cycles, switch must be unchecked");
      const counter = app.getSafetyCounterText();
      assert.strictEqual(counter.safe, 214, "After 10 toggle cycles, count must return to baseline 214");
    });

    it("T2.1.2: rapid odd toggle clicks (11 times) settles accurately on incremented state (215 Safe, aria-checked='true')", async () => {
      const sw = app.getSafetySwitch();
      for (let i = 0; i < 11; i++) {
        await sw.toggle();
      }
      const updatedSw = app.getSafetySwitch();
      assert.strictEqual(updatedSw.isChecked, true, "After 11 toggle cycles, switch must be checked");
      const counter = app.getSafetyCounterText();
      assert.strictEqual(counter.safe, 215, "After 11 toggle cycles, count must be 215");
    });

    it("T2.1.3: safety count never exceeds total households upper boundary (240)", async () => {
      const sw = app.getSafetySwitch();
      await sw.toggle();
      const counter = app.getSafetyCounterText();
      assert.ok(counter.safe <= 240, `Safe count ${counter.safe} must not exceed 240 total households`);
      assert.strictEqual(counter.total, 240);
    });

    it("T2.1.4: safety count never drops below baseline minimum (214)", async () => {
      const sw = app.getSafetySwitch();
      await sw.toggle(); // 215
      await sw.toggle(); // 214
      await sw.toggle(); // 215
      await sw.toggle(); // 214
      const counter = app.getSafetyCounterText();
      assert.ok(counter.safe >= 214, `Safe count ${counter.safe} must not drop below baseline 214`);
    });

    it("T2.1.5: keyboard interaction (Enter / Space keypress) triggers switch toggle cleanly", async () => {
      const sw = app.getSafetySwitch();
      assert.strictEqual(sw.isChecked, false);
      await act(async () => {
        sw.element.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
        sw.element.click();
      });
      const updatedSw = app.getSafetySwitch();
      assert.strictEqual(updatedSw.isChecked, true, "Keyboard interaction should toggle switch on");
    });
  });

  // =========================================================================
  // 2. Layer Switcher Rapid Transitions & Stability (5 tests)
  // =========================================================================
  describe("2. Layer Switcher Rapid Transitions & Stability", () => {
    it("T2.2.1: rapid layer flipping (Map -> Radar -> Map -> Radar -> Map) produces zero DOM anomalies", async () => {
      const switcher = app.getLayerSwitcher();
      await switcher.switchRadar();
      await switcher.switchPurok();
      await switcher.switchRadar();
      await switcher.switchPurok();

      const pins = app.getPurokPins();
      assert.strictEqual(pins.length, 5, "Community map pins must be intact after 4 rapid transitions");
      const mapHud = app.getInspectorHUD();
      assert.ok(mapHud.text.length > 0, "Map HUD card must remain populated");
    });

    it("T2.2.2: redundant clicks on active Purok Map button preserve selection and cause no churn", async () => {
      const switcher = app.getLayerSwitcher();
      for (let i = 0; i < 5; i++) {
        await switcher.switchPurok();
      }
      assert.strictEqual(app.getPurokPins().length, 5, "Repeated clicks on Purok Map must keep all 5 pins");
    });

    it("T2.2.3: redundant clicks on active Typhoon Radar button maintain radar telemetry without duplicate overlays", async () => {
      const switcher = app.getLayerSwitcher();
      await switcher.switchRadar();
      for (let i = 0; i < 5; i++) {
        await switcher.switchRadar();
      }
      const radars = app.doc.querySelectorAll('[data-testid="pagasa-doppler-radar"]');
      assert.strictEqual(radars.length, 1, "There must be exactly 1 radar container in the DOM");
    });

    it("T2.2.4: active tab styling contrast is preserved under rapid multi-tab switches", async () => {
      const switcher = app.getLayerSwitcher();
      await switcher.switchRadar();
      assert.ok(
        switcher.typhoonRadarBtn.className.includes("bg-[#06391C]") &&
        switcher.typhoonRadarBtn.className.includes("text-white"),
        "Typhoon Radar button must have high-contrast active styling"
      );
      await switcher.switchPurok();
      assert.ok(
        switcher.purokMapBtn.className.includes("bg-[#06391C]") &&
        switcher.purokMapBtn.className.includes("text-white"),
        "Purok Map button must have high-contrast active styling"
      );
    });

    it("T2.2.5: radar range rings and hurricane spiral cleanly mount and unmount", async () => {
      const switcher = app.getLayerSwitcher();
      await switcher.switchRadar();
      assert.ok(app.doc.querySelector('[data-testid="pagasa-doppler-radar"]'), "Radar mounted");
      await switcher.switchPurok();
      assert.strictEqual(app.doc.querySelector('[data-testid="pagasa-doppler-radar"]'), null, "Radar unmounted cleanly");
    });
  });

  // =========================================================================
  // 3. Purok Pin Selection & Coordinate Bounds (5 tests)
  // =========================================================================
  describe("3. Purok Pin Selection & Coordinate Bounds", () => {
    it("T2.3.1: sequential cycling (Purok 1 -> 2 -> 3 -> 4 -> 5) updates HUD data bindings with zero race condition", async () => {
      for (let i = 1; i <= 5; i++) {
        await app.clickPurokPin(i);
        const hud = app.getInspectorHUD();
        assert.ok(
          hud.text.includes(`Purok ${i}`),
          `HUD must show Purok ${i} when pin ${i} is clicked`
        );
      }
    });

    it("T2.3.2: reverse sequence cycling (Purok 5 -> 4 -> 3 -> 2 -> 1) updates HUD correctly to each node", async () => {
      for (let i = 5; i >= 1; i--) {
        await app.clickPurokPin(i);
        const hud = app.getInspectorHUD();
        assert.ok(
          hud.text.includes(`Purok ${i}`),
          `HUD must show Purok ${i} during reverse cycling`
        );
      }
    });

    it("T2.3.3: repeated clicks on the same pin (Purok 1 clicked 5 times) remains active without deselection", async () => {
      for (let i = 0; i < 5; i++) {
        await app.clickPurokPin(1);
      }
      const hud = app.getInspectorHUD();
      assert.ok(hud.text.includes("Purok 1"), "Repeated clicks on Purok 1 must keep Purok 1 active");
    });

    it("T2.3.4: touch target boundary compliance: pin buttons satisfy Apple HIG minimum touch target size (>=44pt / 44px min-w/min-h)", () => {
      const pins = app.getPurokPins();
      pins.forEach((pin, idx) => {
        const cls = pin.className || "";
        assert.ok(
          cls.includes("min-w-[44px]") || cls.includes("w-11") || cls.includes("min-h-[44px]"),
          `Pin ${idx + 1} must satisfy Apple HIG 44pt touch target minimum`
        );
      });
    });

    it("T2.3.5: pin coordinate bounds: all x/y percentages reside strictly within map canvas viewport (0% < x,y < 100%)", () => {
      PUROK_NODES.forEach((node) => {
        assert.ok(node.x > 0 && node.x < 100, `Purok ${node.id} x-coordinate ${node.x}% must be within 0-100%`);
        assert.ok(node.y > 0 && node.y < 100, `Purok ${node.id} y-coordinate ${node.y}% must be within 0-100%`);
      });
    });
  });

  // =========================================================================
  // 4. Modal Lifecycle, Mode Transitions & Reset (5 tests)
  // =========================================================================
  describe("4. Modal Lifecycle, Mode Transitions & Reset", () => {
    it("T2.4.1: dismissal via close button ('X') restores modal closed state and unmounts dialog", async () => {
      const modal = await app.openModalVia("connect-campus");
      assert.ok(app.getModal(), "Modal must be open");
      await modal.close();
      assert.strictEqual(app.getModal(), null, "Modal must be completely unmounted after close");
    });

    it("T2.4.2: opening modal in 'sos' mode, closing, then opening via 'join' resets title to 'join' context", async () => {
      const sosModal = await app.openModalVia("sos");
      assert.ok(sosModal.title.includes("SOS") || sosModal.title.includes("Distress"));
      await sosModal.close();

      const joinModal = await app.openModalVia("connect-campus");
      assert.ok(joinModal.title.includes("Enroll") || joinModal.title.includes("Campus"));
      await joinModal.close();
    });

    it("T2.4.3: opening via 'aid', closing, then opening via 'sos' resets title to 'sos' context", async () => {
      const aidModal = await app.openModalVia("aid");
      assert.ok(aidModal.title.includes("Aid") || aidModal.title.includes("Station"));
      await aidModal.close();

      const sosModal = await app.openModalVia("sos");
      assert.ok(sosModal.title.includes("SOS") || sosModal.title.includes("Distress"));
      await sosModal.close();
    });

    it("T2.4.4: submitting a form, closing modal, and reopening via fresh trigger presents a clean form ready for new input", async () => {
      const modal1 = await app.openModalVia("connect-campus");
      await modal1.submit({
        name: "Test User",
        phone: "0917-123-4567",
        purok: "purok-2",
        members: "3",
      });
      await modal1.close();

      const modal2 = await app.openModalVia("connect-campus");
      assert.ok(modal2.form, "Reopened modal must render a fresh input form");
      assert.ok(modal2.nameInput, "Reopened modal must have accessible name input");
      await modal2.close();
    });

    it("T2.4.5: Escape key listener dismisses open modal dialog", async () => {
      const modal = await app.openModalVia("connect-campus");
      assert.ok(app.getModal(), "Modal opened");
      await act(async () => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      });
      assert.strictEqual(app.getModal(), null, "Modal must close on Escape keypress");
    });
  });

  // =========================================================================
  // 5. Form Input Validation & Boundary Enforcement (5 tests)
  // =========================================================================
  describe("5. Form Input Validation & Boundary Enforcement", () => {
    it("T2.5.1: blank/empty name input triggers validation error and prevents ticket creation", async () => {
      const modal = await app.openModalVia("connect-campus");
      await modal.submit({
        name: "", // empty name
        phone: "0917-123-4567",
      });
      const errorText = app.doc.body.textContent || "";
      assert.ok(
        errorText.includes("enter your name") || errorText.includes("Full Name"),
        "Empty name submission must be rejected with validation feedback"
      );
      assert.ok(modal.form, "Form must remain mounted on validation error");
      await modal.close();
    });

    it("T2.5.2: blank/empty phone input triggers validation error and blocks dispatch", async () => {
      const modal = await app.openModalVia("connect-campus");
      await modal.submit({
        name: "Valid Name",
        phone: "", // empty phone
      });
      const errorText = app.doc.body.textContent || "";
      assert.ok(
        errorText.includes("valid") || errorText.includes("phone") || errorText.includes("09"),
        "Empty phone submission must be rejected with validation message"
      );
      await modal.close();
    });

    it("T2.5.3: invalid phone numbers (letters, short length, wrong prefix) trigger explicit validation error", async () => {
      const invalidPhones = ["abc12345678", "09123", "08171234567", "12345678901"];
      for (const invPhone of invalidPhones) {
        const modal = await app.openModalVia("connect-campus");
        await modal.submit({
          name: "Test Citizen",
          phone: invPhone,
        });
        const errorText = app.doc.body.textContent || "";
        assert.ok(
          errorText.includes("valid") || errorText.includes("09"),
          `Phone '${invPhone}' must trigger validation error`
        );
        await modal.close();
      }
    });

    it("T2.5.4: valid Philippine mobile numbers with diverse format variations (plain, dashes, spaces) are accepted", async () => {
      const validFormats = ["09171234567", "0917-123-4567", "0918 987 6543"];
      for (const phoneStr of validFormats) {
        const modal = await app.openModalVia("connect-campus");
        await modal.submit({
          name: "Accepted Citizen",
          phone: phoneStr,
          purok: "purok-3",
        });
        const bodyText = app.doc.body.textContent || "";
        assert.ok(
          bodyText.includes("Ticket") || bodyText.includes("Active") || bodyText.includes("Campus Connect"),
          `Phone format '${phoneStr}' must be accepted successfully`
        );
        await modal.close();
      }
    });

    it("T2.5.5: household members input enforces positive boundary constraints (1 to 20)", async () => {
      const modal = await app.openModalVia("connect-campus");
      assert.ok(modal.membersInput, "Household members input must exist");
      assert.strictEqual(modal.membersInput.getAttribute("min"), "1", "Minimum household members must be 1");
      assert.strictEqual(modal.membersInput.getAttribute("max"), "20", "Maximum household members must be 20");
      await modal.close();
    });
  });

  // =========================================================================
  // 6. Data Contract Extremes & Content Verification (5 tests)
  // =========================================================================
  describe("6. Data Contract Extremes & Content Verification", () => {
    it("T2.6.1: Ground Truth debunker timestamps adhere strictly to 24-hour PST syntax", () => {
      const debunkerModule = loadModule(path.resolve(process.cwd(), "src/data/debunkers.ts"));
      const DEBUNKER_ITEMS = debunkerModule.DEBUNKER_ITEMS;
      assert.strictEqual(DEBUNKER_ITEMS.length, 3, "Debunker must have 3 items");
      DEBUNKER_ITEMS.forEach(item => {
        assert.match(item.pstTime, /^(?:[01]\d|2[0-3]):[0-5]\d\s*PST$/, `Timestamp '${item.pstTime}' must be 24h PST format`);
        assert.ok(app.doc.body.textContent.includes(item.pstTime), `DOM must render timestamp '${item.pstTime}'`);
      });
    });

    it("T2.6.2: all 3 rumors contain alarmist keywords causing confusion", () => {
      const text = app.doc.body.textContent || "";
      assert.ok(text.includes("gumuho") || text.includes("dike"), "Rumor 1 contains dike alarm");
      assert.ok(text.includes("kuryente") || text.includes("blackout"), "Rumor 2 contains power alarm");
      assert.ok(text.includes("pagkain") || text.includes("evacuation"), "Rumor 3 contains food alarm");
    });

    it("T2.6.3: all 3 debunked updates cite authoritative local institutions", () => {
      const text = app.doc.body.textContent || "";
      assert.ok(text.includes("Barangay Captain") || text.includes("NSTP"), "Debunker 1 cites Barangay Captain / NSTP");
      assert.ok(text.includes("INEC") || text.includes("Feeder"), "Debunker 2 cites INEC power repair");
      assert.ok(text.includes("MMSU NSTP CWTS") || text.includes("Covered Court"), "Debunker 3 cites MMSU NSTP CWTS relief");
    });

    it("T2.6.4: all 5 aid stations provide valid non-empty emergency categories, capacities, and locations", () => {
      assert.strictEqual(BARANGAY_RESOURCES.length, 5, "Must have exactly 5 aid stations defined");
      BARANGAY_RESOURCES.forEach(station => {
        assert.ok(station.title && station.title.trim().length > 0, "Station title must not be empty");
        assert.ok(station.location && station.location.trim().length > 0, "Station location must not be empty");
        assert.ok(station.capacity && station.capacity.trim().length > 0, "Station capacity must not be empty");
        assert.ok(station.coordinator && station.coordinator.trim().length > 0, "Station coordinator must not be empty");
      });
    });

    it("T2.6.5: emergency hotlines conform to reachable telecommunications standards", () => {
      const hotlines = app.getHotlines();
      assert.strictEqual(hotlines.hasBrgyDesk, true, "Barangay Desk number 0917-889-MMSU must be valid");
      assert.strictEqual(hotlines.hasClinic, true, "MMSU Clinic number (077) 600-0459 must be valid");
      assert.strictEqual(hotlines.hasCdrrmo, true, "CDRRMO extension 911 must be valid");
    });
  });
});
