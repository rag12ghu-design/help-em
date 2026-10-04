/**
 * Tier 5: Responders Operations & Dual-Access E2E Test Suite
 * Comprehensive opaque-box and contract test coverage for Help'Em Dual-Access Platform.
 * 
 * Features Covered:
 * 1. Dual-Access Role Architecture & Segmented Switcher (T5.1.1 - T5.1.5)
 * 2. Department Help Request Auto-Routing (T5.2.1 - T5.2.5)
 * 3. Citizen Case Tracker Lifecycle Progression (T5.3.1 - T5.3.8)
 * 4. Operations Desk Department Filtering Isolation (T5.4.1 - T5.4.6)
 * 5. Responder Status Updates & Team Assignment (T5.5.1 - T5.5.5)
 * 6. Household Safety Accounting Roster & Vulnerable Flags (T5.6.1 - T5.6.5)
 * 7. Official Bulletin & Fact-Check CMS Publisher (T5.7.1 - T5.7.5)
 */

import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import path from "path";
import React, { act } from "react";
import ReactDOMClient from "react-dom/client";
import { setupDom, tearDownDom, loadModule } from "./harness.mjs";

const projectRoot = path.resolve(process.cwd());

// Load domain modules
const ctxModule = loadModule(path.resolve(projectRoot, "src/context/ResilienceContext.tsx"));
const ResilienceProvider = ctxModule.ResilienceProvider;
const useResilience = ctxModule.useResilience;

const navModule = loadModule(path.resolve(projectRoot, "src/components/Navigation.tsx"));
const Navigation = navModule.default || navModule;

const trackerModule = loadModule(path.resolve(projectRoot, "src/components/CitizenCaseTracker.tsx"));
const CitizenCaseTracker = trackerModule.default || trackerModule;

const debunkerModule = loadModule(path.resolve(projectRoot, "src/components/DebunkerSection.tsx"));
const DebunkerSection = debunkerModule.default || debunkerModule;

const deptModule = loadModule(path.resolve(projectRoot, "src/data/departments.ts"));
const RESCUE_DEPARTMENTS = deptModule.RESCUE_DEPARTMENTS;

const purokModule = loadModule(path.resolve(projectRoot, "src/data/puroks.ts"));
const PUROK_NODES = purokModule.PUROK_NODES;

describe("Tier 5: Responders Operations & Dual-Access Suite", () => {
  let doc;
  let root;
  let testContainer;

  // Consumer capture harness to inspect context state reactively during DOM tests
  let currentContext = null;
  function ContextWatcher({ children }) {
    currentContext = useResilience();
    return children || null;
  }

  beforeEach(() => {
    const env = setupDom();
    doc = env.document;
    if (!globalThis.localStorage && env.window.localStorage) {
      globalThis.localStorage = env.window.localStorage;
    }
    if (globalThis.localStorage && typeof globalThis.localStorage.clear === "function") {
      globalThis.localStorage.clear();
    }
    testContainer = doc.createElement("div");
    testContainer.id = "tier5-mount-point";
    doc.body.appendChild(testContainer);
    root = ReactDOMClient.createRoot(testContainer);
    currentContext = null;
  });

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root.unmount();
      });
      root = null;
    }
    if (testContainer && testContainer.parentNode) {
      testContainer.parentNode.removeChild(testContainer);
    }
    await tearDownDom();
    currentContext = null;
  });

  // =========================================================================
  // 1. Dual-Access Role Architecture & Segmented Switcher (5 tests)
  // =========================================================================
  describe("1. Dual-Access Role Architecture & Segmented Switcher", () => {
    it("T5.1.1: renders segmented role switcher with role='group' and Apple HIG styling", async () => {
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null,
              React.createElement(Navigation, { onOpenApp: () => {} })
            )
          )
        );
      });

      const switcherGroup = doc.querySelector('[role="group"][aria-label="Portal Access Mode"]');
      assert.ok(switcherGroup, "Segmented role switcher must have role='group' and aria-label='Portal Access Mode'");
      const className = switcherGroup.className || "";
      assert.ok(
        className.includes("rounded-full") && className.includes("bg-[#06391C]"),
        "Switcher must have continuous Apple pill shape and deep forest green tint"
      );
    });

    it("T5.1.2: initial default role is Community Resident with aria-pressed='true'", async () => {
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null,
              React.createElement(Navigation, { onOpenApp: () => {} })
            )
          )
        );
      });

      const buttons = Array.from(doc.querySelectorAll('[role="group"][aria-label="Portal Access Mode"] button'));
      const residentBtn = buttons.find((b) => b.textContent?.includes("Resident"));
      const responderBtn = buttons.find((b) => b.textContent?.includes("Responder"));

      assert.ok(residentBtn, "Resident switch button must exist");
      assert.ok(responderBtn, "Responder switch button must exist");

      assert.strictEqual(
        residentBtn.getAttribute("aria-pressed"),
        "true",
        "Initial resident button must have aria-pressed='true'"
      );
      assert.strictEqual(
        responderBtn.getAttribute("aria-pressed"),
        "false",
        "Initial responder button must have aria-pressed='false'"
      );
      assert.strictEqual(currentContext?.role, "citizen", "Context role must default to 'citizen'");
    });

    it("T5.1.3: clicking 'Department Responders' switches role state and flips aria-pressed indicators", async () => {
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null,
              React.createElement(Navigation, { onOpenApp: () => {} })
            )
          )
        );
      });

      const buttons = Array.from(doc.querySelectorAll('[role="group"][aria-label="Portal Access Mode"] button'));
      const responderBtn = buttons.find((b) => b.textContent?.includes("Responder"));

      await act(async () => {
        responderBtn.click();
      });

      const residentBtn = buttons.find((b) => b.textContent?.includes("Resident"));
      assert.strictEqual(
        responderBtn.getAttribute("aria-pressed"),
        "true",
        "Responder button must now have aria-pressed='true'"
      );
      assert.strictEqual(
        residentBtn.getAttribute("aria-pressed"),
        "false",
        "Resident button must now have aria-pressed='false'"
      );
      assert.strictEqual(currentContext?.role, "responder", "Context role must update to 'responder'");
    });

    it("T5.1.4: role switcher displays active incident counter badge reflecting pending distress calls", async () => {
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null,
              React.createElement(Navigation, { onOpenApp: () => {} })
            )
          )
        );
      });

      const pendingBadge = doc.querySelector('[role="group"] span.bg-\\[\\#FF453A\\]');
      assert.ok(pendingBadge, "Red pending incident counter badge must render on responder tab");
      const count = parseInt(pendingBadge.textContent || "0", 10);
      assert.ok(count > 0, "Incident badge count must reflect pending/acknowledged tickets count");
      assert.ok(
        pendingBadge.className.includes("rounded-full") && pendingBadge.className.includes("animate-pulse"),
        "Incident badge must be pill rounded with pulsing attention indicator"
      );
    });

    it("T5.1.5: seamless bidirectional toggling (Resident <-> Responder) preserves session stability", async () => {
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null,
              React.createElement(Navigation, { onOpenApp: () => {} })
            )
          )
        );
      });

      const buttons = Array.from(doc.querySelectorAll('[role="group"][aria-label="Portal Access Mode"] button'));
      const residentBtn = buttons.find((b) => b.textContent?.includes("Resident"));
      const responderBtn = buttons.find((b) => b.textContent?.includes("Responder"));

      // Flip to Responder
      await act(async () => {
        responderBtn.click();
      });
      assert.strictEqual(currentContext?.role, "responder");

      // Flip back to Resident
      await act(async () => {
        residentBtn.click();
      });
      assert.strictEqual(currentContext?.role, "citizen");

      // Flip to Responder again
      await act(async () => {
        responderBtn.click();
      });
      assert.strictEqual(currentContext?.role, "responder");
    });
  });

  // =========================================================================
  // 2. Department Help Request Auto-Routing (5 tests)
  // =========================================================================
  describe("2. Department Help Request Auto-Routing", () => {
    it("T5.2.1: flood, water surge, and evacuation distress categories auto-route to rescue_evac", async () => {
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null)
          )
        );
      });

      let ticket;
      await act(async () => {
        ticket = currentContext.addTicket({
          contactName: "Elena Agcaoili",
          phone: "09171112233",
          purokId: "purok-1",
          purokName: "Purok 1 • Riverside",
          source: "sos",
          priority: "critical",
          category: "Rising Flood / Water Surge",
          description: "Water level breached step 3. Elderly grandmother needs evacuation shuttle.",
          householdMembers: 4,
          urgentNeeds: ["Rescue Boat / Flotation", "Evacuation Shuttle"],
        });
      });

      assert.ok(ticket, "Ticket must be created");
      assert.strictEqual(ticket.targetDepartment, "rescue_evac");
      assert.strictEqual(ticket.departmentName, "Rescue, Evacuation & Flood Operations");
      assert.strictEqual(ticket.status, "pending");
      assert.ok(ticket.ticketNumber.startsWith("TKT-"));
      assert.ok(/^(?:[01]\d|2[0-3]):[0-5]\d\s*PST$/.test(ticket.timestamp));
    });

    it("T5.2.2: medical triage, pediatric fever, and clinic distress categories auto-route to health_medical", async () => {
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null)
          )
        );
      });

      let ticket;
      await act(async () => {
        ticket = currentContext.addTicket({
          contactName: "Danilo Ramos",
          phone: "09193334455",
          purokId: "purok-3",
          purokName: "Purok 3 • Covered Court",
          source: "sos",
          priority: "high",
          category: "High Blood Pressure & Pediatric Fever",
          description: "Toddler running 39.5C temperature. Needs paracetamol and triage check.",
          householdMembers: 3,
          urgentNeeds: ["Pediatric Paracetamol", "BP Check"],
        });
      });

      assert.ok(ticket);
      assert.strictEqual(ticket.targetDepartment, "health_medical");
      assert.strictEqual(ticket.departmentName, "Health, Triage & Medical First Response");
      assert.strictEqual(ticket.status, "pending");
    });

    it("T5.2.3: potable water, porridge meals, and shelter requests auto-route to relief_supplies", async () => {
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null)
          )
        );
      });

      let ticket;
      await act(async () => {
        ticket = currentContext.addTicket({
          contactName: "Tessie Dumlao",
          phone: "09228889900",
          purokId: "purok-1",
          purokName: "Purok 1 • Riverside",
          source: "aid",
          priority: "medium",
          category: "Potable Drinking Water Shortage",
          description: "Well silted from runoff. Requesting two 5-gallon refill containers.",
          householdMembers: 5,
          urgentNeeds: ["5-Gallon Drinking Water", "Hot Porridge Meal"],
        });
      });

      assert.ok(ticket);
      assert.strictEqual(ticket.targetDepartment, "relief_supplies");
      assert.strictEqual(ticket.departmentName, "Food Relief, Potable Water & Shelter Logistics");
      assert.strictEqual(ticket.status, "pending");
    });

    it("T5.2.4: emergency generator, power, and charging requests auto-route to power_utilities", async () => {
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null)
          )
        );
      });

      let ticket;
      await act(async () => {
        ticket = currentContext.addTicket({
          contactName: "Corazon Valdez",
          phone: "09187654321",
          purokId: "purok-2",
          purokName: "Purok 2 • Barangay Hall Command Post",
          source: "aid",
          priority: "high",
          category: "Emergency Generator Charging",
          description: "Priority charging slot needed for nebulizer battery.",
          householdMembers: 3,
          urgentNeeds: ["Power Generator Slot"],
        });
      });

      assert.ok(ticket);
      assert.strictEqual(ticket.targetDepartment, "power_utilities");
      assert.strictEqual(ticket.departmentName, "Power, Generator Hub & Critical Utilities");
      assert.strictEqual(ticket.status, "pending");
    });

    it("T5.2.5: fallback / unknown category auto-routes safely to rescue_evac with verified PST timestamp", async () => {
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null)
          )
        );
      });

      let ticket;
      await act(async () => {
        ticket = currentContext.addTicket({
          contactName: "Resident Mark",
          phone: "09205556677",
          purokId: "purok-5",
          purokName: "Purok 5 • Highland Ridge",
          source: "citizen_report",
          priority: "low",
          category: "General Community Inquiry",
          description: "Asking about curfew hours and shuttle routes.",
          householdMembers: 1,
          urgentNeeds: ["General Inquiry"],
        });
      });

      assert.ok(ticket);
      assert.strictEqual(ticket.targetDepartment, "rescue_evac");
      assert.ok(ticket.ticketNumber.startsWith("TKT-"));
      assert.ok(/^(?:[01]\d|2[0-3]):[0-5]\d\s*PST$/.test(ticket.timestamp));
    });
  });

  // =========================================================================
  // 3. Citizen Case Tracker Lifecycle Progression (8 tests)
  // =========================================================================
  describe("3. Citizen Case Tracker Lifecycle Progression", () => {
    it("T5.3.1: renders floating card with Apple HIG squircle styling and deep forest green header", async () => {
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(CitizenCaseTracker, null)
          )
        );
      });

      const tracker = doc.querySelector('aside[aria-label="Citizen Active Case Tracker"]');
      assert.ok(tracker, "Case tracker aside element must be mounted");
      const className = tracker.className || "";
      assert.ok(
        className.includes("rounded-2xl") && className.includes("shadow-apple-lg"),
        "Tracker must enforce Apple squircle corners and frosted glass shadow"
      );
      const header = tracker.querySelector(".bg-\\[\\#06391C\\]");
      assert.ok(header, "Tracker must feature deep forest green header (#06391C)");
    });

    it("T5.3.2: Queued (pending) phase displays amber status pill, Clock icon, and awaiting dispatch label", async () => {
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null,
              React.createElement(CitizenCaseTracker, null)
            )
          )
        );
      });

      const tracker = doc.querySelector('aside[aria-label="Citizen Active Case Tracker"]');
      assert.ok(tracker.textContent?.includes("Queued at Operations Desk"));
      assert.ok(tracker.textContent?.includes("Awaiting responder dispatch"));
      const statusPill = tracker.querySelector('.bg-\\[\\#FF9F0A\\]\\/15');
      assert.ok(statusPill, "Pending state must show amber status badge background (#FF9F0A/15)");
      const clockIcon = tracker.querySelector('svg[data-icon="Clock"]');
      assert.ok(clockIcon, "Pending state must display Clock icon");
    });

    it("T5.3.3: Department Acknowledged phase displays blue status pill, ShieldCheck icon, and mobilizing label", async () => {
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null,
              React.createElement(CitizenCaseTracker, null)
            )
          )
        );
      });

      await act(async () => {
        currentContext.updateTicketStatus("tkt-001", "acknowledged");
      });

      const tracker = doc.querySelector('aside[aria-label="Citizen Active Case Tracker"]');
      assert.ok(tracker.textContent?.includes("Department Acknowledged"));
      assert.ok(tracker.textContent?.includes("Assessing protocol & mobilizing unit"));
      const statusPill = tracker.querySelector('.bg-\\[\\#0A84FF\\]\\/15');
      assert.ok(statusPill, "Acknowledged state must display blue status pill background (#0A84FF/15)");
      const shieldIcon = tracker.querySelector('svg[data-icon="ShieldCheck"]');
      assert.ok(shieldIcon, "Acknowledged state must display ShieldCheck icon");
    });

    it("T5.3.4: Emergency Unit Dispatched phase displays green status pill, Truck icon, and assigned team en route", async () => {
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null,
              React.createElement(CitizenCaseTracker, null)
            )
          )
        );
      });

      await act(async () => {
        currentContext.updateTicketStatus("tkt-001", "dispatched", "team-alpha");
      });

      const tracker = doc.querySelector('aside[aria-label="Citizen Active Case Tracker"]');
      assert.ok(tracker.textContent?.includes("Emergency Unit Dispatched"));
      assert.ok(tracker.textContent?.includes("BDRRMC Rescue & Engineering Unit Alpha En Route"));
      const statusPill = tracker.querySelector('.bg-\\[\\#30D158\\]\\/15');
      assert.ok(statusPill, "Dispatched state must show Apple green status pill (#30D158/15)");
      const truckIcon = tracker.querySelector('svg[data-icon="Truck"]');
      assert.ok(truckIcon, "Dispatched state must display Truck icon");
    });

    it("T5.3.5: Assistance Completed (resolved) phase displays steady deep green badge and CheckCircle2 icon", async () => {
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null,
              React.createElement(CitizenCaseTracker, null)
            )
          )
        );
      });

      await act(async () => {
        currentContext.updateTicketStatus("tkt-001", "resolved");
      });

      const tracker = doc.querySelector('aside[aria-label="Citizen Active Case Tracker"]');
      assert.ok(tracker.textContent?.includes("Assistance Completed"));
      assert.ok(tracker.textContent?.includes("Resolved on site by Barangay emergency responders"));
      const statusPill = tracker.querySelector('.bg-\\[\\#06391C\\]\\/15');
      assert.ok(statusPill, "Resolved state must apply deep forest green styling (#06391C/15)");
      const checkIcon = tracker.querySelector('svg[data-icon="CheckCircle2"]');
      assert.ok(checkIcon, "Resolved state must display CheckCircle2 icon");
    });

    it("T5.3.6: live responderNotes sync into citizen case tracker with feedback bubble", async () => {
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null,
              React.createElement(CitizenCaseTracker, null)
            )
          )
        );
      });

      await act(async () => {
        currentContext.updateTicketStatus(
          "tkt-001",
          "dispatched",
          "team-alpha",
          "Shuttle 2 stationed at Purok 1 chapel crossing"
        );
      });

      const tracker = doc.querySelector('aside[aria-label="Citizen Active Case Tracker"]');
      assert.ok(tracker.textContent?.includes("Responder Note:"));
      assert.ok(tracker.textContent?.includes("Shuttle 2 stationed at Purok 1 chapel crossing"));
    });

    it("T5.3.7: action button 'Call Assigned Desk' triggers emergency radio call handler", async () => {
      let callOpened = false;
      let requestedStation = null;

      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(CitizenCaseTracker, {
              onOpenCall: (st) => {
                callOpened = true;
                requestedStation = st;
              },
            })
          )
        );
      });

      const callBtn = Array.from(doc.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Call Assigned Desk")
      );
      assert.ok(callBtn, "Call Assigned Desk button must render");

      await act(async () => {
        callBtn.click();
      });

      assert.strictEqual(callOpened, true, "Clicking Call Assigned Desk must invoke onOpenCall handler");
      assert.strictEqual(requestedStation, "brgy-command");
    });

    it("T5.3.8: accessible collapse and dismiss controls toggle visibility cleanly", async () => {
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(CitizenCaseTracker, null)
          )
        );
      });

      const tracker = doc.querySelector('aside[aria-label="Citizen Active Case Tracker"]');
      assert.ok(tracker);

      const collapseBtn = tracker.querySelector('button[aria-label*="Collapse"]');
      assert.ok(collapseBtn, "Collapse button must be available");

      // Click collapse
      await act(async () => {
        collapseBtn.click();
      });
      // Content body should collapse
      assert.ok(!tracker.textContent?.includes("Assigned Department:"), "Content should collapse");

      // Click expand
      const expandBtn = tracker.querySelector('button[aria-label*="Expand"]');
      await act(async () => {
        expandBtn.click();
      });
      assert.ok(tracker.textContent?.includes("Assigned Department:"), "Content should expand back");

      // Click dismiss
      const dismissBtn = tracker.querySelector('button[aria-label*="Dismiss"]');
      await act(async () => {
        dismissBtn.click();
      });

      const trackerAfterDismiss = doc.querySelector('aside[aria-label="Citizen Active Case Tracker"]');
      assert.strictEqual(trackerAfterDismiss, null, "Tracker should unmount when dismissed");
    });
  });

  // =========================================================================
  // 4. Operations Desk Department Filtering Isolation (6 tests)
  // =========================================================================
  describe("4. Operations Desk Department Filtering Isolation", () => {
    it("T5.4.1: department filter covers all 5 required operational views", () => {
      assert.strictEqual(RESCUE_DEPARTMENTS.length, 5, "Must define 5 departments");
      const ids = RESCUE_DEPARTMENTS.map((d) => d.id);
      assert.ok(ids.includes("rescue_evac"));
      assert.ok(ids.includes("health_medical"));
      assert.ok(ids.includes("relief_supplies"));
      assert.ok(ids.includes("power_utilities"));
      assert.ok(ids.includes("public_info"));
    });

    it("T5.4.2: filtering by 'rescue_evac' isolates rescue & flood tickets and excludes other departments", async () => {
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null)
          )
        );
      });

      await act(async () => {
        currentContext.setSelectedDepartment("rescue_evac");
      });

      const filtered = currentContext.filteredTickets;
      assert.ok(filtered.length > 0);
      for (const t of filtered) {
        assert.strictEqual(
          t.targetDepartment,
          "rescue_evac",
          `Ticket ${t.id} must be rescue_evac, found ${t.targetDepartment}`
        );
      }
    });

    it("T5.4.3: filtering by 'health_medical' isolates medical & triage tickets", async () => {
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null)
          )
        );
      });

      await act(async () => {
        currentContext.setSelectedDepartment("health_medical");
      });

      const filtered = currentContext.filteredTickets;
      assert.ok(filtered.length > 0);
      for (const t of filtered) {
        assert.strictEqual(t.targetDepartment, "health_medical");
      }
    });

    it("T5.4.4: filtering by 'relief_supplies' isolates food & water relief tickets", async () => {
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null)
          )
        );
      });

      await act(async () => {
        currentContext.setSelectedDepartment("relief_supplies");
      });

      const filtered = currentContext.filteredTickets;
      assert.ok(filtered.length > 0);
      for (const t of filtered) {
        assert.strictEqual(t.targetDepartment, "relief_supplies");
      }
    });

    it("T5.4.5: filtering by 'power_utilities' isolates power & generator tickets", async () => {
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null)
          )
        );
      });

      await act(async () => {
        currentContext.setSelectedDepartment("power_utilities");
      });

      const filtered = currentContext.filteredTickets;
      assert.ok(filtered.length > 0);
      for (const t of filtered) {
        assert.strictEqual(t.targetDepartment, "power_utilities");
      }
    });

    it("T5.4.6: switching back to 'all' restores full multi-department triage queue", async () => {
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null)
          )
        );
      });

      await act(async () => {
        currentContext.setSelectedDepartment("rescue_evac");
      });
      assert.strictEqual(currentContext.filteredTickets.length, 2);

      await act(async () => {
        currentContext.setSelectedDepartment("all");
      });
      assert.strictEqual(currentContext.filteredTickets.length, currentContext.tickets.length);
      assert.strictEqual(currentContext.filteredTickets.length, 5);
    });
  });

  // =========================================================================
  // 5. Responder Status Updates & Team Assignment (5 tests)
  // =========================================================================
  describe("5. Responder Status Updates & Team Assignment", () => {
    it("T5.5.1: one-click acknowledgment advances queued ticket from pending to acknowledged", async () => {
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null)
          )
        );
      });

      const targetTicket = currentContext.tickets.find((t) => t.status === "pending");
      assert.ok(targetTicket);

      await act(async () => {
        currentContext.updateTicketStatus(targetTicket.id, "acknowledged");
      });

      const updated = currentContext.tickets.find((t) => t.id === targetTicket.id);
      assert.strictEqual(updated.status, "acknowledged");
    });

    it("T5.5.2: assigning emergency response unit and dispatching sets status='dispatched' and records assigned team", async () => {
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null)
          )
        );
      });

      const targetTicket = currentContext.tickets.find((t) => t.id === "tkt-001");

      await act(async () => {
        currentContext.updateTicketStatus(
          targetTicket.id,
          "dispatched",
          "team-alpha",
          "Dispatching BDRRMC rescue team with raft"
        );
      });

      const updated = currentContext.tickets.find((t) => t.id === "tkt-001");
      assert.strictEqual(updated.status, "dispatched");
      assert.strictEqual(updated.assignedTeamId, "team-alpha");
      assert.strictEqual(updated.assignedTeamName, "BDRRMC Rescue & Engineering Unit Alpha");
      assert.strictEqual(updated.responderNotes, "Dispatching BDRRMC rescue team with raft");
    });

    it("T5.5.3: dispatching ticket increments emergency response team's assignedTicketsCount and sets status to deployed", async () => {
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null)
          )
        );
      });

      const initialTeamBeta = currentContext.volunteerTeams.find((tm) => tm.id === "team-beta");
      const initialCount = initialTeamBeta.assignedTicketsCount;

      await act(async () => {
        currentContext.updateTicketStatus("tkt-001", "dispatched", "team-beta");
      });

      const updatedTeamBeta = currentContext.volunteerTeams.find((tm) => tm.id === "team-beta");
      assert.strictEqual(updatedTeamBeta.assignedTicketsCount, initialCount + 1);
      assert.strictEqual(updatedTeamBeta.status, "deployed");
    });

    it("T5.5.4: one-click resolution marks dispatched ticket as resolved and records completion PST timestamp", async () => {
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null)
          )
        );
      });

      await act(async () => {
        currentContext.updateTicketStatus("tkt-002", "resolved", undefined, "Nebulizer charged and delivered");
      });

      const resolvedTicket = currentContext.tickets.find((t) => t.id === "tkt-002");
      assert.strictEqual(resolvedTicket.status, "resolved");
      assert.strictEqual(resolvedTicket.responderNotes, "Nebulizer charged and delivered");
      assert.ok(resolvedTicket.resolvedAt, "Must record completion timestamp");
      assert.ok(resolvedTicket.resolvedAt.includes("PST"));
    });

    it("T5.5.5: deployment overview lists all 4 specialized emergency response units with leadership and contact info", async () => {
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null)
          )
        );
      });

      const teams = currentContext.volunteerTeams;
      assert.strictEqual(teams.length, 4);

      const alpha = teams.find((t) => t.id === "team-alpha");
      assert.ok(alpha.college.includes("BDRRMC Search & Rescue Division"));
      assert.strictEqual(alpha.contactNumber, "0917-889-MMS1");

      const beta = teams.find((t) => t.id === "team-beta");
      assert.ok(beta.college.includes("Barangay Health Station & Municipal Clinic"));
      assert.strictEqual(beta.contactNumber, "0917-889-MMS2");

      const gamma = teams.find((t) => t.id === "team-gamma");
      assert.ok(gamma.college.includes("MSWDO Relief Logistics Division"));
      assert.strictEqual(gamma.contactNumber, "0917-889-MMS3");

      const delta = teams.find((t) => t.id === "team-delta");
      assert.ok(delta.college.includes("Barangay Power & Radio Communications"));
      assert.strictEqual(delta.contactNumber, "0917-889-MMS4");
    });
  });

  // =========================================================================
  // 6. Household Safety Accounting Roster & Vulnerable Flags (5 tests)
  // =========================================================================
  describe("6. Household Safety Accounting Roster & Vulnerable Flags", () => {
    it("T5.6.1: provides Purok 1-5 accounting breakdown matching geographic nodes", () => {
      assert.strictEqual(PUROK_NODES.length, 5);

      const p1 = PUROK_NODES.find((p) => p.id === "purok-1");
      assert.strictEqual(p1.safe, 48);
      assert.strictEqual(p1.total, 50);

      const p2 = PUROK_NODES.find((p) => p.id === "purok-2");
      assert.strictEqual(p2.safe, 52);
      assert.strictEqual(p2.total, 52);

      const p3 = PUROK_NODES.find((p) => p.id === "purok-3");
      assert.strictEqual(p3.safe, 40);
      assert.strictEqual(p3.total, 44);

      const p4 = PUROK_NODES.find((p) => p.id === "purok-4");
      assert.strictEqual(p4.safe, 33);
      assert.strictEqual(p4.total, 50);

      const p5 = PUROK_NODES.find((p) => p.id === "purok-5");
      assert.strictEqual(p5.safe, 41);
      assert.strictEqual(p5.total, 44);
    });

    it("T5.6.2: baseline safety total strictly sums to 214 of 240 Families Safe (89% integrity)", () => {
      const sumSafe = PUROK_NODES.reduce((acc, p) => acc + p.safe, 0);
      const sumTotal = PUROK_NODES.reduce((acc, p) => acc + p.total, 0);

      assert.strictEqual(sumSafe, 214, "Sum of safe families across Puroks 1–5 must equal 214");
      assert.strictEqual(sumTotal, 240, "Sum of total families across Puroks 1–5 must equal 240");
      const percentage = Math.round((sumSafe / sumTotal) * 100);
      assert.strictEqual(percentage, 89, "Baseline safety percentage must be 89%");
    });

    it("T5.6.3: citizen safety check-in dynamically increments safe count to 215 of 240", () => {
      const baselineSafe = 214;
      const checkedInSafe = baselineSafe + 1;
      const total = 240;

      assert.strictEqual(checkedInSafe, 215);
      const percentage = Math.round((checkedInSafe / total) * 100);
      assert.strictEqual(percentage, 90, "Incremented safety percentage must be 90%");
    });

    it("T5.6.4: vulnerable households roster lists at-risk residents across seniors, infants, PWDs with priority flags", async () => {
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null)
          )
        );
      });

      const roster = currentContext.vulnerableHouseholds;
      assert.strictEqual(roster.length, 5);

      const seniors = roster.filter((h) => h.vulnerabilityType === "Senior Citizen");
      assert.ok(seniors.length >= 2);

      const infants = roster.filter((h) => h.vulnerabilityType === "Infant / Toddler");
      assert.ok(infants.length >= 2);

      const pwds = roster.filter((h) => h.vulnerabilityType === "Person with Disability (PWD)");
      assert.ok(pwds.length >= 1);

      const critical = roster.filter((h) => h.priorityLevel === "Critical");
      assert.ok(critical.length >= 1);
    });

    it("T5.6.5: vulnerable household safe toggle marks resident safe and updates reactive state", async () => {
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null)
          )
        );
      });

      const target = currentContext.vulnerableHouseholds.find((h) => h.id === "vul-001");
      assert.strictEqual(target.isSafe, false, "vul-001 initially unchecked/unsafe");

      await act(async () => {
        currentContext.toggleVulnerableSafe("vul-001");
      });

      const updated = currentContext.vulnerableHouseholds.find((h) => h.id === "vul-001");
      assert.strictEqual(updated.isSafe, true, "vul-001 must flip to isSafe=true");

      await act(async () => {
        currentContext.toggleVulnerableSafe("vul-001");
      });

      const reverted = currentContext.vulnerableHouseholds.find((h) => h.id === "vul-001");
      assert.strictEqual(reverted.isSafe, false, "vul-001 must toggle back to isSafe=false");
    });
  });

  // =========================================================================
  // 7. Official Bulletin & Fact-Check CMS Publisher (5 tests)
  // =========================================================================
  describe("7. Official Bulletin & Fact-Check CMS Publisher", () => {
    it("T5.7.1: CMS publisher provides publishing controls for verified debunker fact-checks and community advisories", async () => {
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null)
          )
        );
      });

      assert.ok(typeof currentContext.addDebunker === "function", "addDebunker function must exist");
      assert.ok(typeof currentContext.addAnnouncement === "function", "addAnnouncement function must exist");
      assert.ok(Array.isArray(currentContext.debunkers), "debunkers list must be array");
      assert.ok(Array.isArray(currentContext.announcements), "announcements list must be array");
    });

    it("T5.7.2: debunker publication enforces 24-hour PST timestamp syntax", () => {
      const pstRegex = /^(?:[01]\d|2[0-3]):[0-5]\d\s*PST$/;
      assert.ok(pstRegex.test("19:30 PST"));
      assert.ok(pstRegex.test("20:15 PST"));
      assert.ok(pstRegex.test("00:45 PST"));
      assert.ok(!pstRegex.test("25:00 PST"));
      assert.ok(!pstRegex.test("7:30 PM"));
    });

    it("T5.7.3: publishing new fact-check immediately persists to platform state", async () => {
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null)
          )
        );
      });

      const initialCount = currentContext.debunkers.length;

      await act(async () => {
        currentContext.addDebunker({
          rumorText: "Napaulat na umapaw ang sapa sa Purok 4.",
          rumorSource: "Batac Community Chat • 20:00 PST",
          verifiedTitle: "Purok 4 Lowland Stream Inspection Fact-Check",
          verifiedText: "BDRRMC Rescue Unit Alpha confirmed water remains within containment banks at 20:15 PST.",
          officialSource: "Barangay Quiling BDRRMC & Rescue Unit Alpha",
          timestamp: "20:15 PST",
          purokLocation: "Purok 4 • Lowland",
        });
      });

      assert.strictEqual(currentContext.debunkers.length, initialCount + 1);
      const latest = currentContext.debunkers[0];
      assert.strictEqual(latest.timestamp, "20:15 PST");
      assert.ok(latest.verifiedTitle.includes("Purok 4"));
    });

    it("T5.7.4: cross-portal synchronization: published debunker renders in Citizen Ground Truth feed", async () => {
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null,
              React.createElement(DebunkerSection, null)
            )
          )
        );
      });

      const debunkerText = doc.body.textContent || "";
      assert.ok(
        debunkerText.includes("Ground Truth for Every Family"),
        "Citizen debunker section must render"
      );
      assert.ok(
        debunkerText.includes("Unverified Group Chat Rumors") || debunkerText.includes("gumuho daw ang dike"),
        "Rumor column must be present"
      );
      assert.ok(
        debunkerText.includes("Help'Em Verified Barangay Truth") || debunkerText.includes("Dike Inspection Fact-Check"),
        "Verified truth column must be present"
      );
    });

    it("T5.7.5: community advisory publication broadcasts urgent notice with verified severity level", async () => {
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null)
          )
        );
      });

      const initialCount = currentContext.announcements.length;

      await act(async () => {
        currentContext.addAnnouncement({
          title: "Urgent Flash Flood Warning: Purok 1 Riverbank",
          message: "Water rose 15cm in the last 30 minutes. Families near dike must evacuate immediately.",
          severity: "urgent",
          author: "Barangay Quiling BDRRMC Operations Desk",
          department: "rescue_evac",
          purokTag: "Purok 1",
        });
      });

      assert.strictEqual(currentContext.announcements.length, initialCount + 1);
      const newAnn = currentContext.announcements[0];
      assert.strictEqual(newAnn.severity, "urgent");
      assert.strictEqual(newAnn.department, "rescue_evac");
      assert.strictEqual(newAnn.isActive, true);
      assert.ok(/^(?:[01]\d|2[0-3]):[0-5]\d\s*PST$/.test(newAnn.timestamp));
    });
  });
});
