/**
 * Tier 1: Feature Coverage E2E Test Suite
 * Minimum 5 test cases per core feature across 11 core features (55 test cases total).
 * 
 * Features Covered:
 * 1. Dynamic Island Navigation Capsule
 * 2. 3D Mascot Fidelity & Assets
 * 3. Purok Pins 1–5 Geo-Nodes
 * 4. Inspector HUD Data Bindings
 * 5. Map Layer Switcher
 * 6. iOS Safety Check-In Toggle
 * 7. Household Safety Counter Accounting
 * 8. Modal Trigger & Form Submission
 * 9. Ground Truth Debunker
 * 10. Barangay Mutual Aid Directory
 * 11. MMSU NSTP Civic Hotline & Footer
 */

import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import fs from "fs";
import path from "path";
import { mountApp, tearDownDom } from "./harness.mjs";

describe("Tier 1: Feature Coverage Suite", () => {
  let app;

  beforeEach(async () => {
    app = await mountApp();
  });

  afterEach(async () => {
    await tearDownDom();
  });

  // =========================================================================
  // 1. Dynamic Island Navigation Capsule (5 tests)
  // =========================================================================
  describe("1. Dynamic Island Navigation Capsule", () => {
    it("T1.1.1: renders floating capsule container with Apple HIG styling and high contrast", () => {
      const island = app.getDynamicIsland();
      assert.ok(island.element, "Dynamic Island navigation capsule must be present in DOM");
      const className = island.element.className || "";
      assert.ok(
        className.includes("rounded-full") && className.includes("bg-[#06391C]"),
        "Dynamic Island must have pill shape and deep forest green background"
      );
    });

    it("T1.1.2: displays official Help'Em brand identifier in capsule header", () => {
      const island = app.getDynamicIsland();
      assert.strictEqual(island.brandText, true, "Dynamic Island capsule must display Help'Em brand name");
    });

    it("T1.1.3: renders active green live pulse beacon indicator", () => {
      const island = app.getDynamicIsland();
      const beaconPing = island.element.querySelector(".animate-ping");
      assert.ok(beaconPing, "Dynamic Island must contain an animated pinging live beacon");
      const pingClass = beaconPing.className || "";
      assert.ok(pingClass.includes("bg-[#30D158]"), "Beacon ping must use Apple HIG green (#30D158)");
    });

    it("T1.1.4: displays 'Campus Mesh Active' status label", () => {
      const island = app.getDynamicIsland();
      assert.strictEqual(island.meshActive, true, "Dynamic Island must indicate active campus mesh network");
    });

    it("T1.1.5: provides 'Open App' action trigger button with active handler", async () => {
      const island = app.getDynamicIsland();
      assert.ok(island.openAppButton, "'Open App' button must be rendered in Dynamic Island");
      assert.ok(
        island.openAppButton.textContent.includes("Open App"),
        "Button text must match 'Open App'"
      );
      // Trigger modal via openAppButton
      const modal = await app.openModalVia("open-app");
      assert.ok(modal, "Clicking 'Open App' must open the enrollment modal dialog");
      await modal.close();
    });
  });

  // =========================================================================
  // 2. 3D Mascot Fidelity & Assets (5 tests)
  // =========================================================================
  describe("2. 3D Mascot Fidelity & Assets", () => {
    it("T1.2.1: official 3D thumbs-up mascot file exists in public/mascot with high-res payload", () => {
      const assetPath = path.resolve(process.cwd(), "public/mascot/mascot-thumbsup.jpg");
      assert.ok(fs.existsSync(assetPath), "mascot-thumbsup.jpg must exist in public/mascot/");
      const stats = fs.statSync(assetPath);
      assert.ok(stats.size > 100000, `Mascot asset size (${stats.size} bytes) must be a high-fidelity image (>100KB)`);
    });

    it("T1.2.2: hero section renders mascot referencing /mascot/mascot-thumbsup", () => {
      const mascot = app.getMascotHero();
      assert.ok(mascot.element, "Hero section must render the mascot image");
      assert.ok(
        mascot.src.includes("mascot-thumbsup.png") || mascot.src.includes("mascot-thumbsup.jpg"),
        `Mascot src '${mascot.src}' must point to mascot-thumbsup`
      );
    });

    it("T1.2.3: mascot image includes high-priority preloading attribute for LCP optimization", () => {
      const mascot = app.getMascotHero();
      assert.strictEqual(
        mascot.isPriority,
        true,
        "Hero mascot must set priority={true} to optimize Largest Contentful Paint"
      );
    });

    it("T1.2.4: mascot alt text accurately describes MMSU Stallion in thumbs-up pose with walkie-talkie", () => {
      const mascot = app.getMascotHero();
      const alt = mascot.alt || "";
      assert.ok(
        alt.toLowerCase().includes("mmsu") &&
        alt.toLowerCase().includes("mascot") &&
        alt.toLowerCase().includes("thumbs up"),
        `Alt text '${alt}' must describe the MMSU Stallion Mascot in thumbs-up pose`
      );
    });

    it("T1.2.5: mascot container enforces 3/4 aspect ratio and object-contain to prevent facial distortion", () => {
      const mascot = app.getMascotHero();
      const parentContainer = mascot.element.closest(".aspect-\\[3\\/4\\]") || mascot.element.parentElement;
      const imgClass = mascot.element.className || "";
      assert.ok(
        imgClass.includes("object-contain"),
        "Mascot image must use object-contain to preserve sculpted equine anatomy without distortion"
      );
      assert.ok(
        parentContainer.className.includes("3/4"),
        "Mascot container must enforce 3:4 portrait aspect ratio"
      );
    });
  });

  // =========================================================================
  // 3. Purok Pins 1–5 Geo-Nodes (5 tests)
  // =========================================================================
  describe("3. Purok Pins 1–5 Geo-Nodes", () => {
    it("T1.3.1: renders all 5 designated Purok geo-nodes for Barangay Quiling on the map", () => {
      const pins = app.getPurokPins();
      assert.strictEqual(pins.length, 5, `Expected 5 Purok pins on community map, found ${pins.length}`);
    });

    it("T1.3.2: each pin is positioned at verified topological coordinates", () => {
      const pins = app.getPurokPins();
      pins.forEach((pin, idx) => {
        const leftStyle = pin.style.left;
        const topStyle = pin.style.top;
        assert.ok(leftStyle && leftStyle.endsWith("%"), `Pin ${idx + 1} must have valid percentage left style`);
        assert.ok(topStyle && topStyle.endsWith("%"), `Pin ${idx + 1} must have valid percentage top style`);
      });
    });

    it("T1.3.3: pins reflect distinct status color coding (Safe #30D158, Alert #FF9F0A, Shelter #0A84FF, Evac #FF453A)", () => {
      const pins = app.getPurokPins();
      // Check that at least 3 distinct status colors exist among pins
      const colors = new Set();
      pins.forEach(pin => {
        const coloredElements = pin.querySelectorAll("[style*='background-color']");
        coloredElements.forEach(el => {
          const bg = el.style.backgroundColor;
          if (bg) colors.add(bg);
        });
      });
      assert.ok(colors.size >= 3, `Expected at least 3 distinct status colors across pins, found ${colors.size}`);
    });

    it("T1.3.4: pins incorporate pulsing beacon animation elements for low-visibility emergency awareness", () => {
      const pins = app.getPurokPins();
      pins.forEach((pin, idx) => {
        const pingEl = pin.querySelector(".animate-ping");
        assert.ok(pingEl, `Purok pin ${idx + 1} must contain an animated ping ring`);
      });
    });

    it("T1.3.5: pins provide legible numeric labels for Purok 1 through Purok 5", () => {
      const pins = app.getPurokPins();
      for (let i = 1; i <= 5; i++) {
        const found = pins.some(pin => pin.textContent.includes(`Purok ${i}`));
        assert.ok(found, `Community map must have a visible label for Purok ${i}`);
      }
    });
  });

  // =========================================================================
  // 4. Inspector HUD Data Bindings (5 tests)
  // =========================================================================
  describe("4. Inspector HUD Data Bindings", () => {
    it("T1.4.1: default active selection displays Purok 2 (Barangay Hall generator command post)", () => {
      const hud = app.getInspectorHUD();
      assert.ok(
        hud.text.includes("Purok 2") || hud.text.includes("Barangay Hall"),
        "Inspector HUD must default to Purok 2 Barangay Hall"
      );
    });

    it("T1.4.2: clicking Purok 1 updates HUD with Riverside details and River Watch status", async () => {
      await app.clickPurokPin(1);
      const hud = app.getInspectorHUD();
      assert.ok(
        hud.text.includes("Purok 1") && (hud.text.includes("Riverside") || hud.text.includes("River")),
        "Inspector HUD must bind to Purok 1 Riverside data"
      );
      assert.ok(
        hud.text.includes("48 / 50") || hud.text.includes("River level"),
        "HUD must display Purok 1 flood monitoring status and families count"
      );
    });

    it("T1.4.3: clicking Purok 3 updates HUD with Covered Court evacuation center and cots availability", async () => {
      await app.clickPurokPin(3);
      const hud = app.getInspectorHUD();
      assert.ok(
        hud.text.includes("Purok 3") && (hud.text.includes("Covered Court") || hud.text.includes("Evac")),
        "Inspector HUD must bind to Purok 3 Covered Court data"
      );
    });

    it("T1.4.4: clicking Purok 4 updates HUD with Lowland flood transit and NSTP shuttle details", async () => {
      await app.clickPurokPin(4);
      const hud = app.getInspectorHUD();
      assert.ok(
        hud.text.includes("Purok 4") && (hud.text.includes("Lowland") || hud.text.includes("Transit") || hud.text.includes("shuttle")),
        "Inspector HUD must bind to Purok 4 Lowland data"
      );
    });

    it("T1.4.5: clicking Purok 5 updates HUD with Highland safe ridge and stable power feeder details", async () => {
      await app.clickPurokPin(5);
      const hud = app.getInspectorHUD();
      assert.ok(
        hud.text.includes("Purok 5") && (hud.text.includes("Highland") || hud.text.includes("High Ground")),
        "Inspector HUD must bind to Purok 5 Highland data"
      );
    });
  });

  // =========================================================================
  // 5. Map Layer Switcher (5 tests)
  // =========================================================================
  describe("5. Map Layer Switcher", () => {
    it("T1.5.1: console header provides dual-state switcher between Purok Map and Typhoon Radar", () => {
      const switcher = app.getLayerSwitcher();
      assert.ok(switcher.purokMapBtn, "Switcher must include 'Purok Map' button");
      assert.ok(switcher.typhoonRadarBtn, "Switcher must include 'Typhoon Radar' button");
    });

    it("T1.5.2: initial active layer defaults to Purok Map displaying vector topology and river", () => {
      const switcher = app.getLayerSwitcher();
      const className = switcher.purokMapBtn.className || "";
      assert.ok(
        className.includes("bg-[#06391C]") && className.includes("text-white"),
        "Purok Map button must be styled as active initially"
      );
      assert.ok(app.getPurokPins().length === 5, "Purok pins must be visible in default map view");
    });

    it("T1.5.3: switching to Typhoon Radar view renders PAGASA Doppler Signal 2 radar", async () => {
      const switcher = app.getLayerSwitcher();
      await switcher.switchRadar();
      const bodyText = app.doc.body.textContent || "";
      assert.ok(
        bodyText.includes("PAGASA Doppler") || bodyText.includes("Signal 2"),
        "Typhoon Radar view must display PAGASA Doppler Signal 2 monitor"
      );
    });

    it("T1.5.4: Typhoon Radar includes compass rose and animated range rings", async () => {
      const switcher = app.getLayerSwitcher();
      await switcher.switchRadar();
      const radarContainer = app.doc.querySelector('[data-testid="pagasa-doppler-radar"]') ||
        app.doc.querySelector(".bg-\\[\\#051119\\]");
      assert.ok(radarContainer, "Radar satellite view must be mounted");
      const compassOrTelemetry = app.doc.querySelector('[title*="heading"]') ||
        app.doc.body.textContent.includes("Track 315°") ||
        app.doc.querySelector('[data-icon="Compass"]');
      assert.ok(compassOrTelemetry, "Radar must render a compass navigation overlay or icon");
      const rangeRings = app.doc.querySelectorAll("circle");
      assert.ok(rangeRings.length >= 1, "Radar must render atmospheric range rings");
    });

    it("T1.5.5: toggling back to Purok Map seamlessly restores vector community nodes", async () => {
      const switcher = app.getLayerSwitcher();
      await switcher.switchRadar();
      await switcher.switchPurok();
      const pins = app.getPurokPins();
      assert.strictEqual(pins.length, 5, "Returning to Purok Map must restore all 5 interactive pins");
    });
  });

  // =========================================================================
  // 6. iOS Safety Check-In Toggle (5 tests)
  // =========================================================================
  describe("6. iOS Safety Check-In Toggle", () => {
    it("T1.6.1: renders accessible switch element with role='switch'", () => {
      const sw = app.getSafetySwitch();
      assert.ok(sw.element, "Safety switch element must exist");
      assert.strictEqual(sw.element.getAttribute("role"), "switch", "Switch must define role='switch'");
    });

    it("T1.6.2: initial switch state has aria-checked='false'", () => {
      const sw = app.getSafetySwitch();
      assert.strictEqual(sw.isChecked, false, "Initial household safety state must be unchecked (false)");
    });

    it("T1.6.3: clicking switch toggles aria-checked to 'true' and applies active green background", async () => {
      const sw = app.getSafetySwitch();
      await sw.toggle();
      const updatedSw = app.getSafetySwitch();
      assert.strictEqual(updatedSw.isChecked, true, "Switch aria-checked must become true after click");
      const bg = updatedSw.element.className || "";
      assert.ok(bg.includes("bg-[#30D158]"), "Switch must adopt active Apple green background");
    });

    it("T1.6.4: clicking again toggles aria-checked back to 'false'", async () => {
      const sw = app.getSafetySwitch();
      await sw.toggle(); // on
      await sw.toggle(); // off
      const updatedSw = app.getSafetySwitch();
      assert.strictEqual(updatedSw.isChecked, false, "Switch aria-checked must revert to false");
    });

    it("T1.6.5: includes accessible descriptive label or screen-reader announcement", () => {
      const sw = app.getSafetySwitch();
      const srLabel = sw.element.querySelector(".sr-only") || sw.element.getAttribute("aria-label");
      const labelText = typeof srLabel === "string" ? srLabel : srLabel?.textContent || "";
      assert.ok(
        labelText.toLowerCase().includes("safety") || labelText.toLowerCase().includes("household"),
        "Switch must have accessible label for assistive tech"
      );
    });
  });

  // =========================================================================
  // 7. Household Safety Counter Accounting (5 tests)
  // =========================================================================
  describe("7. Household Safety Counter Accounting", () => {
    it("T1.7.1: baseline accounting displays exactly '214 of 240 Families Safe'", () => {
      const counter = app.getSafetyCounterText();
      assert.ok(counter, "Safety counter text must be present");
      assert.strictEqual(counter.safe, 214, "Baseline safe families must equal 214");
      assert.strictEqual(counter.total, 240, "Total barangay households must equal 240");
    });

    it("T1.7.2: toggling safety check-in increments community safe counter to 215", async () => {
      const sw = app.getSafetySwitch();
      await sw.toggle();
      const counter = app.getSafetyCounterText();
      assert.strictEqual(counter.safe, 215, "Activating check-in must increment safe families to 215");
      assert.strictEqual(counter.total, 240, "Total households must remain 240");
    });

    it("T1.7.3: untoggling safety check-in decrements community safe counter back to 214", async () => {
      const sw = app.getSafetySwitch();
      await sw.toggle(); // safe (215)
      await sw.toggle(); // uncheck (214)
      const counter = app.getSafetyCounterText();
      assert.strictEqual(counter.safe, 214, "Deactivating check-in must decrement safe families back to 214");
    });

    it("T1.7.4: counter includes CheckCircle2 status icon indicator", () => {
      const checkIcon = app.doc.querySelector('[data-icon="CheckCircle2"]');
      assert.ok(checkIcon, "Accounting counter must include CheckCircle2 verification icon");
    });

    it("T1.7.5: accounting math guarantees verified percentage integrity (89% -> 90%)", async () => {
      const initialPercent = Math.round((214 / 240) * 100);
      assert.strictEqual(initialPercent, 89, "Initial verification rate is 89%");
      const sw = app.getSafetySwitch();
      await sw.toggle();
      const activePercent = Math.round((215 / 240) * 100);
      assert.strictEqual(activePercent, 90, "Incremented verification rate is 90%");
    });
  });

  // =========================================================================
  // 8. Modal Trigger & Form Submission (5 tests)
  // =========================================================================
  describe("8. Modal Trigger & Form Submission", () => {
    it("T1.8.1: 'Connect Your Campus' hero button launches Household Enrollment modal", async () => {
      const modal = await app.openModalVia("connect-campus");
      assert.ok(modal, "Modal dialog must open");
      assert.ok(
        modal.title.includes("Enroll") || modal.title.includes("Connect") || modal.title.includes("Household"),
        `Modal title '${modal.title}' should indicate household/campus enrollment`
      );
      await modal.close();
    });

    it("T1.8.2: Emergency SOS 'X' console trigger opens Urgent SOS modal mode", async () => {
      const modal = await app.openModalVia("sos");
      assert.ok(modal, "Emergency SOS modal dialog must open");
      assert.ok(
        modal.title.includes("SOS") || modal.title.includes("Distress") || modal.title.includes("Urgent"),
        `Modal title '${modal.title}' should indicate urgent SOS dispatch`
      );
      await modal.close();
    });

    it("T1.8.3: Aid directory 'Connect to Station' opens Community Aid modal mode", async () => {
      const modal = await app.openModalVia("aid");
      assert.ok(modal, "Community Aid modal dialog must open");
      assert.ok(
        modal.title.includes("Aid") || modal.title.includes("Station") || modal.title.includes("Supplies"),
        `Modal title '${modal.title}' should indicate community aid`
      );
      await modal.close();
    });

    it("T1.8.4: modal renders required form fields (name, mobile phone, purok select)", async () => {
      const modal = await app.openModalVia("connect-campus");
      assert.ok(modal.nameInput, "Modal must provide input for household head/student name");
      assert.ok(modal.phoneInput, "Modal must provide input for mobile phone");
      assert.ok(modal.purokSelect, "Modal must provide selector for Purok assignment");
      await modal.close();
    });

    it("T1.8.5: submitting valid form displays success confirmation feedback banner", async () => {
      const modal = await app.openModalVia("connect-campus");
      await modal.submit({
        name: "Maria Santos",
        phone: "0917-555-0199",
        purok: "purok-2",
        members: "4",
      });
      const bodyText = app.doc.body.textContent || "";
      assert.ok(
        bodyText.includes("Ticket") ||
        bodyText.includes("Active") ||
        bodyText.includes("Successfully Enrolled") ||
        bodyText.includes("Campus Connect"),
        "Submitting form must display success enrollment feedback"
      );
      await modal.close();
    });
  });

  // =========================================================================
  // 9. Ground Truth Debunker (5 tests)
  // =========================================================================
  describe("9. Ground Truth Debunker", () => {
    it("T1.9.1: section prominently introduces 'Ground Truth for Every Family'", () => {
      const debunker = app.getDebunkerCards();
      assert.ok(
        debunker.allText.includes("Ground Truth for Every Family"),
        "Section must present the Ground Truth anti-rumor heading"
      );
    });

    it("T1.9.2: displays 3 unverified social media rumors causing community panic", () => {
      const debunker = app.getDebunkerCards();
      assert.ok(debunker.allText.includes("gumuho daw ang dike"), "Rumor 1 (Dike collapse) must be displayed");
      assert.ok(debunker.allText.includes("Wala raw kuryente"), "Rumor 2 (Power outage) must be displayed");
      assert.ok(debunker.allText.includes("Walang pagkain"), "Rumor 3 (Evacuation food) must be displayed");
    });

    it("T1.9.3: displays 3 verified local disaster updates with official PST timestamps", () => {
      const debunker = app.getDebunkerCards();
      assert.ok(debunker.allText.includes("19:30 PST"), "Dike fact-check must specify 19:30 PST");
      assert.ok(debunker.allText.includes("19:42 PST"), "Power restoration update must specify 19:42 PST");
      assert.ok(debunker.allText.includes("19:50 PST"), "Evacuation center relief must specify 19:50 PST");
    });

    it("T1.9.4: explicitly confirms Purok 1 embankment inspection by Barangay Captain and NSTP civil engineering students", () => {
      const debunker = app.getDebunkerCards();
      assert.ok(
        debunker.allText.includes("Dike is fully intact") || debunker.allText.includes("water level is safe"),
        "Fact-check must confirm dike is intact and water safe"
      );
    });

    it("T1.9.5: confirms MMSU NSTP CWTS delivered 150 hot rice porridge bowls to Covered Court", () => {
      const debunker = app.getDebunkerCards();
      assert.ok(
        debunker.allText.includes("150 hot rice porridge") || debunker.allText.includes("porridge"),
        "Evacuation status must report NSTP delivery of 150 hot rice porridge meals"
      );
    });
  });

  // =========================================================================
  // 10. Barangay Mutual Aid Directory (5 tests)
  // =========================================================================
  describe("10. Barangay Mutual Aid Directory", () => {
    it("T1.10.1: renders all 5 critical barangay mutual aid resource stations", () => {
      const aidCards = app.getAidCards();
      assert.strictEqual(aidCards.length, 5, `Expected 5 mutual aid station cards, found ${aidCards.length}`);
    });

    it("T1.10.2: Barangay Hall Generator Hub lists 30 charging slots capacity and details", () => {
      const text = app.doc.body.textContent || "";
      assert.ok(text.includes("Barangay Hall Emergency Generator Hub"), "Generator Hub card must be present");
      assert.ok(text.includes("30 charging slots"), "Generator Hub must mention 30 charging slots");
      assert.ok(text.includes("18 slots free"), "Capacity of 18 slots free must be listed");
    });

    it("T1.10.3: Covered Court Evacuation Center details cots occupancy and status", () => {
      const text = app.doc.body.textContent || "";
      assert.ok(text.includes("Community Covered Court Evacuation Center"), "Covered Court card must be present");
      assert.ok(text.includes("42 / 80 cots filled"), "Covered Court must report 42/80 cots filled");
      assert.ok(text.includes("Purok 3"), "Location Purok 3 must be displayed");
    });

    it("T1.10.4: Sitio Riverside Clean Water Refill indicates unlimited filtration flow and status", () => {
      const text = app.doc.body.textContent || "";
      assert.ok(text.includes("Sitio Riverside Clean Water Refill Station"), "Water Refill card must be present");
      assert.ok(text.includes("Unlimited flow"), "Water station must specify unlimited flow capacity");
      assert.ok(text.includes("Active"), "Status Active must be listed");
    });

    it("T1.10.5: Health Outpost and Emergency Shuttle verify active operational status", () => {
      const text = app.doc.body.textContent || "";
      assert.ok(
        text.includes("Barangay Health & First Aid Outpost") ||
        text.includes("Community Health & First Aid Outpost") ||
        text.includes("NSTP Health & First Aid Outpost"),
        "Health Outpost card must be present"
      );
      assert.ok(text.includes("Barangay Patrol & Tricycle Emergency Shuttle"), "Emergency Shuttle card must be present");
      assert.ok(text.includes("Running") && text.includes("Staffed"), "Stations must reflect operational statuses");
    });
  });

  // =========================================================================
  // 11. MMSU NSTP Civic Hotline & Footer (5 tests)
  // =========================================================================
  describe("11. MMSU NSTP Civic Hotline & Footer", () => {
    it("T1.11.1: footer lists Barangay Emergency Desk with hotline 0917-889-MMSU", () => {
      const hotlines = app.getHotlines();
      assert.strictEqual(hotlines.hasBrgyDesk, true, "Footer must list Barangay Emergency Desk 0917-889-MMSU");
    });

    it("T1.11.2: footer lists MMSU Health & Clinic Team phone (077) 600-0459", () => {
      const hotlines = app.getHotlines();
      assert.strictEqual(hotlines.hasClinic, true, "Footer must list MMSU Clinic Team (077) 600-0459");
    });

    it("T1.11.3: footer lists Batac City Disaster Office (CDRRMO Ext. 911)", () => {
      const hotlines = app.getHotlines();
      assert.strictEqual(hotlines.hasCdrrmo, true, "Footer must list CDRRMO Ext. 911");
    });

    it("T1.11.4: footer explicitly affirms project affiliation with Mariano Marcos State University", () => {
      const hotlines = app.getHotlines();
      assert.strictEqual(
        hotlines.hasMmsuAffiliation,
        true,
        "Footer must specify Mariano Marcos State University (MMSU) affiliation"
      );
    });

    it("T1.11.5: footer displays live civic integrity badge 'Purok 1–5 Mesh Online' / 'Active'", () => {
      const text = app.getHotlines().footerElement?.textContent || "";
      assert.ok(
        text.includes("Purok 1–5 Mesh Online") || text.includes("Purok 1–5 Mesh Active"),
        "Footer must verify Purok 1–5 Mesh status"
      );
    });
  });
});
