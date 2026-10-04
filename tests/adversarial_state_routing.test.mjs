/**
 * Adversarial State & Routing Stress Test Suite
 * Help'Em Community Disaster Resilience Platform
 * 
 * Verifies:
 * 1. Multiple tickets in rapid succession across different departments (collision, ordering, routing)
 * 2. Status transitions (Queued -> Acknowledged -> Dispatched -> Resolved) across Responders Console & Citizen Case Tracker
 * 3. Volunteer team assignment metadata updates, multi-dispatch drift, and resolution lifecycle
 * 4. LocalStorage persistence integrity, reload hydration, corrupt data handling, and non-persisted state gaps
 */

import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import path from "path";
import React, { act } from "react";
import ReactDOMClient from "react-dom/client";
import { setupDom, tearDownDom, loadModule } from "./e2e/harness.mjs";

const projectRoot = path.resolve(process.cwd());

// Load modules
const ctxModule = loadModule(path.resolve(projectRoot, "src/context/ResilienceContext.tsx"));
const ResilienceProvider = ctxModule.ResilienceProvider;
const useResilience = ctxModule.useResilience;

const trackerModule = loadModule(path.resolve(projectRoot, "src/components/CitizenCaseTracker.tsx"));
const CitizenCaseTracker = trackerModule.default || trackerModule;

const deskModule = loadModule(path.resolve(projectRoot, "src/components/ResponderOperationsDesk.tsx"));
const ResponderOperationsDesk = deskModule.default || deskModule;

const deptModule = loadModule(path.resolve(projectRoot, "src/data/departments.ts"));
const RESCUE_DEPARTMENTS = deptModule.RESCUE_DEPARTMENTS;

describe("Adversarial State & Routing Stress Suite", () => {
  let doc;
  let root;
  let testContainer;
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
    testContainer.id = "adversarial-mount-point";
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
  // SECTION 1: Multiple Tickets in Rapid Succession Across Departments
  // =========================================================================
  describe("1. Rapid Succession Ticket Creation & Department Routing", () => {
    it("ADV-1.1: Rapid synchronous ticket creation ID collision stress test", async () => {
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null, null)
          )
        );
      });

      const initialCount = currentContext.tickets.length;
      const createdIds = [];
      const createdNumbers = [];

      // Create 20 tickets synchronously in a tight loop
      await act(async () => {
        for (let i = 0; i < 20; i++) {
          const t = currentContext.addTicket({
            contactName: `Resident Rapid ${i}`,
            phone: `091700000${i.toString().padStart(2, "0")}`,
            purokId: `purok-${(i % 5) + 1}`,
            purokName: `Purok ${(i % 5) + 1}`,
            source: "sos",
            priority: "high",
            category: "Rising Flood / Water Surge",
            description: `Emergency flood call ${i}`,
            householdMembers: 4,
            urgentNeeds: ["Rescue Boat"],
          });
          createdIds.push(t.id);
          createdNumbers.push(t.ticketNumber);
        }
      });

      // Check for ID uniqueness
      const uniqueIds = new Set(createdIds);
      const uniqueNumbers = new Set(createdNumbers);

      console.log(`[ADV-1.1] 20 Rapid Tickets Created: Unique IDs=${uniqueIds.size}/20, Unique TicketNumbers=${uniqueNumbers.size}/20`);

      // If Date.now().toString(36) is evaluated synchronously in the same millisecond:
      // Does Date.now() collide?
      // In Node.js / V8 tight loops, multiple iterations can occur in the same millisecond!
      assert.strictEqual(
        currentContext.tickets.length,
        initialCount + 20,
        "All 20 tickets must be added to state"
      );

      // Check if any collision occurred in IDs
      const hasIdCollision = uniqueIds.size < 20;
      if (hasIdCollision) {
        console.warn(`[ADV-1.1 WARNING] ID collision detected! Only ${uniqueIds.size} unique IDs generated out of 20 rapid tickets due to Date.now().toString(36) granularity.`);
      }
    });

    it("ADV-1.2: Cross-department rapid routing precision under concurrent requests", async () => {
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null, null)
          )
        );
      });

      const departmentTestCases = [
        { category: "Severe River Flood & Flash Surge", expectedDept: "rescue_evac" },
        { category: "Elderly Stroke & Pediatric High Fever", expectedDept: "health_medical" },
        { category: "Clean Drinking Water & Hot Meals", expectedDept: "relief_supplies" },
        { category: "Emergency Generator Battery Charging Hub", expectedDept: "power_utilities" },
        { category: "Fallen Mango Tree Blocking Evacuation Road", expectedDept: "rescue_evac" },
        { category: "Open Wound Dressing & Antibiotics", expectedDept: "health_medical" },
        { category: "Rice Ration & Dry Clothing Packs", expectedDept: "relief_supplies" },
        { category: "Power Outage Nebulizer Connection", expectedDept: "power_utilities" },
        { category: "Unknown Ambiguous Distress Call", expectedDept: "rescue_evac" }, // fallback
      ];

      const addedTickets = [];
      await act(async () => {
        for (const tc of departmentTestCases) {
          const t = currentContext.addTicket({
            contactName: `Test Contact for ${tc.category}`,
            phone: "09171234567",
            purokId: "purok-1",
            purokName: "Purok 1 • Riverside",
            source: "citizen_report",
            priority: "medium",
            category: tc.category,
            description: `Auto-routing verification for ${tc.category}`,
            householdMembers: 3,
            urgentNeeds: ["Support"],
          });
          addedTickets.push({ ticket: t, expectedDept: tc.expectedDept });
        }
      });

      // Verify each ticket is routed correctly
      for (const item of addedTickets) {
        assert.strictEqual(
          item.ticket.targetDepartment,
          item.expectedDept,
          `Category "${item.ticket.category}" must route to ${item.expectedDept}, got ${item.ticket.targetDepartment}`
        );
        assert.ok(item.ticket.departmentName, "departmentName must be populated");
      }

      // Check filtering isolation for each department
      for (const deptKey of ["rescue_evac", "health_medical", "relief_supplies", "power_utilities"]) {
        await act(async () => {
          currentContext.setSelectedDepartment(deptKey);
        });

        const filtered = currentContext.filteredTickets;
        assert.ok(
          filtered.every((t) => t.targetDepartment === deptKey),
          `Filtered list for ${deptKey} must contain ONLY tickets for that department`
        );
      }
    });

    it("ADV-1.3: LIFO Queue ordering preservation under rapid multi-ticket burst", async () => {
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null, null)
          )
        );
      });

      const batchCount = 5;
      const createdNames = [];
      await act(async () => {
        for (let i = 1; i <= batchCount; i++) {
          const name = `Sequential Batch Resident ${i}`;
          createdNames.push(name);
          currentContext.addTicket({
            contactName: name,
            phone: `0917999880${i}`,
            purokId: "purok-3",
            purokName: "Purok 3 • Covered Court",
            source: "sos",
            priority: "high",
            category: "Flash Flood",
            description: `Burst batch item ${i}`,
            householdMembers: 2,
            urgentNeeds: ["Assistance"],
          });
        }
      });

      // First 5 tickets in currentContext.tickets must match reverse order (LIFO)
      for (let i = 0; i < batchCount; i++) {
        const expectedName = createdNames[batchCount - 1 - i];
        assert.strictEqual(
          currentContext.tickets[i].contactName,
          expectedName,
          `Position ${i} must be newest ticket "${expectedName}", got "${currentContext.tickets[i].contactName}"`
        );
      }
    });
  });

  // =========================================================================
  // SECTION 2: Status Transitions Across Console and Case Tracker
  // =========================================================================
  describe("2. Status Transitions (Queued -> Acknowledged -> Dispatched -> Resolved)", () => {
    it("ADV-2.1: Step-by-step lifecycle synchronization between Responder Desk and Citizen Tracker", async () => {
      let createdTicketId = null;

      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null,
              React.createElement(ResponderOperationsDesk, null),
              React.createElement(CitizenCaseTracker, null)
            )
          )
        );
      });

      // Step 1: Add a citizen ticket
      await act(async () => {
        const t = currentContext.addTicket({
          contactName: "Adv Citizen Juan",
          phone: "09171112233",
          purokId: "purok-2",
          purokName: "Purok 2 • Command Post",
          source: "sos",
          priority: "critical",
          category: "Rising Flood / Water Surge",
          description: "Water inside living room, pregnant mother needs immediate transit.",
          householdMembers: 4,
          urgentNeeds: ["Evacuation Boat", "Medical Escort"],
        });
        createdTicketId = t.id;
      });

      // Verify initial state: pending / queued
      let trackerHeading = doc.querySelector('aside[aria-label="Citizen Active Case Tracker"]');
      assert.ok(trackerHeading, "Citizen Case Tracker must be mounted");
      assert.ok(trackerHeading.textContent.includes("Queued at Operations Desk"), "Tracker must display Queued status");
      assert.ok(trackerHeading.textContent.includes("Awaiting responder dispatch"), "Tracker must display awaiting dispatch");

      // Step 2: Transition to 'acknowledged'
      await act(async () => {
        currentContext.updateTicketStatus(
          createdTicketId,
          "acknowledged",
          undefined,
          "Operations desk acknowledged: Team Beta on alert."
        );
      });

      trackerHeading = doc.querySelector('aside[aria-label="Citizen Active Case Tracker"]');
      assert.ok(trackerHeading.textContent.includes("Department Acknowledged"), "Tracker must update to Department Acknowledged");
      assert.ok(trackerHeading.textContent.includes("Assessing protocol & mobilizing unit"), "Tracker must display assessing protocol");
      assert.ok(trackerHeading.textContent.includes("Team Beta on alert"), "Tracker must display responder notes");

      // Step 3: Transition to 'dispatched' with assigned team
      await act(async () => {
        currentContext.updateTicketStatus(
          createdTicketId,
          "dispatched",
          "team-beta",
          "Barangay Health Medical Unit Beta dispatched with medical kit and vehicle."
        );
      });

      trackerHeading = doc.querySelector('aside[aria-label="Citizen Active Case Tracker"]');
      assert.ok(trackerHeading.textContent.includes("Emergency Unit Dispatched"), "Tracker must update to Emergency Unit Dispatched");
      assert.ok(trackerHeading.textContent.includes("Barangay Health Medical Unit Beta En Route"), "Tracker must display specific assigned team name en route");
      assert.ok(trackerHeading.textContent.includes("dispatched with medical kit"), "Tracker must show updated responder note");

      // Step 4: Transition to 'resolved'
      await act(async () => {
        currentContext.updateTicketStatus(
          createdTicketId,
          "resolved",
          undefined,
          "Patient safely arrived at Covered Court Clinic. Stable vitals."
        );
      });

      trackerHeading = doc.querySelector('aside[aria-label="Citizen Active Case Tracker"]');
      assert.ok(trackerHeading.textContent.includes("Assistance Completed"), "Tracker must update to Assistance Completed");
      assert.ok(trackerHeading.textContent.includes("Resolved on site by Barangay emergency responders"), "Tracker must show resolution sublabel");

      // Verify ticket in context has resolvedAt timestamp
      const resolvedTicket = currentContext.tickets.find((t) => t.id === createdTicketId);
      assert.strictEqual(resolvedTicket.status, "resolved");
      assert.ok(resolvedTicket.resolvedAt && resolvedTicket.resolvedAt.includes("PST"), "resolvedAt must contain PST timestamp");
    });

    it("ADV-2.2: Multi-ticket FIFO head-of-line masking in CitizenCaseTracker", async () => {
      // Adversarial test: Citizen submits Ticket 1, then Ticket 2.
      // Which ticket does CitizenCaseTracker show? What happens when Ticket 1 is updated?
      let ticket1Id = null;
      let ticket2Id = null;

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
        const t1 = currentContext.addTicket({
          contactName: "Citizen First Request",
          phone: "09171110001",
          purokId: "purok-1",
          purokName: "Purok 1",
          source: "sos",
          priority: "high",
          category: "Rising Flood / Water Surge",
          description: "First emergency call",
          householdMembers: 2,
          urgentNeeds: ["Water"],
        });
        ticket1Id = t1.id;
      });

      await act(async () => {
        const t2 = currentContext.addTicket({
          contactName: "Citizen Second Request",
          phone: "09171110002",
          purokId: "purok-2",
          purokName: "Purok 2",
          source: "sos",
          priority: "high",
          category: "Emergency Generator Charging",
          description: "Second emergency call",
          householdMembers: 3,
          urgentNeeds: ["Power"],
        });
        ticket2Id = t2.id;
      });

      const tracker = doc.querySelector('aside[aria-label="Citizen Active Case Tracker"]');
      assert.ok(tracker, "Tracker mounted");
      // Notice: Tracker displays myTickets[0], which is t2 (most recent)
      assert.ok(
        tracker.textContent.includes("Emergency Generator Charging"),
        "Tracker displays most recent Ticket 2"
      );
      assert.ok(
        !tracker.textContent.includes("Rising Flood / Water Surge"),
        "Older Ticket 1 is masked by the head-of-line ticket"
      );

      // Now responder dispatches Ticket 1
      await act(async () => {
        currentContext.updateTicketStatus(ticket1Id, "dispatched", "team-alpha", "Team Alpha dispatched for Ticket 1");
      });

      // Does the CitizenCaseTracker show Ticket 1's dispatch?
      assert.ok(
        !tracker.textContent.includes("Emergency Unit Dispatched"),
        "Tracker is STILL showing Ticket 2 (pending) because it only tracks myTickets[0]"
      );
      console.log("[ADV-2.2 CONFIRMED] Head-of-line masking: CitizenCaseTracker strictly binds to myTickets[0]. Multi-ticket citizen sessions do not see updates for previous tickets unless newest is removed.");
    });
  });

  // =========================================================================
  // SECTION 3: Volunteer Team Metadata, Reassignment & Resolution Lifecycle
  // =========================================================================
  describe("3. Volunteer Team Metadata & Lifecycle Dynamics", () => {
    it("ADV-3.1: Team assignment updates assignedTeamName and team assignedTicketsCount", async () => {
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null, null)
          )
        );
      });

      const initialAlphaCount = currentContext.volunteerTeams.find((tm) => tm.id === "team-alpha").assignedTicketsCount;

      let tId = null;
      await act(async () => {
        const t = currentContext.addTicket({
          contactName: "Unit Test Citizen",
          phone: "09175554433",
          purokId: "purok-1",
          purokName: "Purok 1 • Riverside",
          source: "sos",
          priority: "critical",
          category: "Rising Flood",
          description: "Evacuation patrol required",
          householdMembers: 4,
          urgentNeeds: ["Escort"],
        });
        tId = t.id;
      });

      await act(async () => {
        currentContext.updateTicketStatus(tId, "dispatched", "team-alpha", "Mobilized Team Alpha");
      });

      const updatedTicket = currentContext.tickets.find((t) => t.id === tId);
      assert.strictEqual(updatedTicket.assignedTeamId, "team-alpha");
      assert.strictEqual(updatedTicket.assignedTeamName, "BDRRMC Rescue & Engineering Unit Alpha");

      const updatedAlpha = currentContext.volunteerTeams.find((tm) => tm.id === "team-alpha");
      assert.strictEqual(
        updatedAlpha.assignedTicketsCount,
        initialAlphaCount + 1,
        "team-alpha assignedTicketsCount must increment by 1"
      );
      assert.strictEqual(updatedAlpha.status, "deployed");
    });

    it("ADV-3.2: Reassignment drift test — Previous team count does NOT decrement on reassignment", async () => {
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null, null)
          )
        );
      });

      const initialAlphaCount = currentContext.volunteerTeams.find((tm) => tm.id === "team-alpha").assignedTicketsCount;
      const initialBetaCount = currentContext.volunteerTeams.find((tm) => tm.id === "team-beta").assignedTicketsCount;

      let tId = null;
      await act(async () => {
        const t = currentContext.addTicket({
          contactName: "Reassignment Subject",
          phone: "09179991122",
          purokId: "purok-2",
          purokName: "Purok 2",
          source: "sos",
          priority: "high",
          category: "Flood Triage",
          description: "Initial dispatch to Alpha, later switched to Beta",
          householdMembers: 2,
          urgentNeeds: ["Support"],
        });
        tId = t.id;
      });

      // First dispatch: assign to Alpha
      await act(async () => {
        currentContext.updateTicketStatus(tId, "dispatched", "team-alpha", "Dispatched Alpha");
      });

      // Second dispatch: reassign same ticket to Beta
      await act(async () => {
        currentContext.updateTicketStatus(tId, "dispatched", "team-beta", "Reassigned to Beta");
      });

      const alphaAfter = currentContext.volunteerTeams.find((tm) => tm.id === "team-alpha");
      const betaAfter = currentContext.volunteerTeams.find((tm) => tm.id === "team-beta");

      console.log(`[ADV-3.2] Reassignment Results: Team Alpha Count=${alphaAfter.assignedTicketsCount} (initial was ${initialAlphaCount}), Team Beta Count=${betaAfter.assignedTicketsCount} (initial was ${initialBetaCount})`);

      // Observe: Team Beta got +1.
      assert.strictEqual(betaAfter.assignedTicketsCount, initialBetaCount + 1);
      // Observe: Team Alpha was NOT decremented when the ticket was reassigned away!
      const didAlphaDecrement = alphaAfter.assignedTicketsCount === initialAlphaCount;
      console.log(`[ADV-3.2 OBSERVATION] Did Team Alpha decrement upon reassignment? ${didAlphaDecrement ? "YES" : "NO (Drift occurred: Alpha stayed at " + alphaAfter.assignedTicketsCount + ")"}`);
    });

    it("ADV-3.3: Ticket resolution does NOT decrement assignedTicketsCount or restore 'available' status", async () => {
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null, null)
          )
        );
      });

      let tId = null;
      await act(async () => {
        const t = currentContext.addTicket({
          contactName: "Resolution Test Subject",
          phone: "09174443322",
          purokId: "purok-3",
          purokName: "Purok 3",
          source: "sos",
          priority: "high",
          category: "Medical Clinic",
          description: "Medical support",
          householdMembers: 1,
          urgentNeeds: ["First Aid"],
        });
        tId = t.id;
      });

      // Dispatch to Beta
      await act(async () => {
        currentContext.updateTicketStatus(tId, "dispatched", "team-beta", "Dispatched Beta");
      });

      const betaCountDispatched = currentContext.volunteerTeams.find((tm) => tm.id === "team-beta").assignedTicketsCount;

      // Now resolve the ticket
      await act(async () => {
        currentContext.updateTicketStatus(tId, "resolved", undefined, "Ticket completed");
      });

      const betaCountResolved = currentContext.volunteerTeams.find((tm) => tm.id === "team-beta").assignedTicketsCount;
      const betaStatusResolved = currentContext.volunteerTeams.find((tm) => tm.id === "team-beta").status;

      console.log(`[ADV-3.3] Post-Resolution Team Beta: Count=${betaCountResolved}, Status=${betaStatusResolved}`);
      assert.strictEqual(betaCountResolved, betaCountDispatched, "Resolution does not decrement team assigned count");
    });
  });

  // =========================================================================
  // SECTION 4: LocalStorage Persistence Integrity & Coverage Gaps
  // =========================================================================
  describe("4. LocalStorage Persistence Integrity & Non-Persisted State Gaps", () => {
    it("ADV-4.1: End-to-end localStorage round-trip persistence of tickets and updates", async () => {
      let createdTicketId = null;

      // Session 1: Create and update ticket
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null, null)
          )
        );
      });

      await act(async () => {
        const t = currentContext.addTicket({
          contactName: "Persistent Citizen Maria",
          phone: "09181234567",
          purokId: "purok-4",
          purokName: "Purok 4 • Lowland",
          source: "aid",
          priority: "high",
          category: "Potable Drinking Water Shortage",
          description: "Murky well water needs potable supply.",
          householdMembers: 5,
          urgentNeeds: ["Water Rations"],
        });
        createdTicketId = t.id;
      });

      await act(async () => {
        currentContext.updateTicketStatus(
          createdTicketId,
          "dispatched",
          "team-gamma",
          "Team Gamma en route with 5-gallon containers"
        );
      });

      // Verify localStorage was written
      const rawStoredTickets = globalThis.localStorage.getItem("helpem_tickets");
      assert.ok(rawStoredTickets, "helpem_tickets must exist in localStorage");
      const parsedTickets = JSON.parse(rawStoredTickets);
      const storedSubject = parsedTickets.find((t) => t.id === createdTicketId);
      assert.ok(storedSubject, "Stored tickets must contain created ticket");
      assert.strictEqual(storedSubject.status, "dispatched");
      assert.strictEqual(storedSubject.assignedTeamId, "team-gamma");
      assert.strictEqual(storedSubject.assignedTeamName, "Relief & Food Logistics Unit Gamma");
      assert.strictEqual(storedSubject.responderNotes, "Team Gamma en route with 5-gallon containers");

      // Verify citizen ticket IDs saved
      const rawCitizenIds = globalThis.localStorage.getItem("helpem_citizen_ticket_ids");
      assert.ok(rawCitizenIds, "helpem_citizen_ticket_ids must exist in localStorage");
      assert.ok(JSON.parse(rawCitizenIds).includes(createdTicketId));

      // Session 2: Unmount and mount a fresh ResilienceProvider (simulating page reload)
      await act(async () => {
        root.unmount();
      });
      testContainer.innerHTML = "";
      root = ReactDOMClient.createRoot(testContainer);

      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null, null)
          )
        );
      });

      // Verify reloaded state matches persisted data
      const reloadedTicket = currentContext.tickets.find((t) => t.id === createdTicketId);
      assert.ok(reloadedTicket, "Reloaded provider must contain persisted ticket");
      assert.strictEqual(reloadedTicket.status, "dispatched");
      assert.strictEqual(reloadedTicket.assignedTeamId, "team-gamma");
      assert.strictEqual(reloadedTicket.assignedTeamName, "Relief & Food Logistics Unit Gamma");
      assert.ok(currentContext.citizenTicketIds.includes(createdTicketId), "Citizen ticket IDs must be restored");
      console.log("[ADV-4.1 PASSED] Full round-trip localStorage persistence validated.");
    });

    it("ADV-4.2: Robustness against corrupted localStorage data", async () => {
      // Put invalid JSON in localStorage
      globalThis.localStorage.setItem("helpem_tickets", "{INVALID_JSON_CORRUPT_BYTES");
      globalThis.localStorage.setItem("helpem_user_role", "malicious_undefined_role");

      // Mount ResilienceProvider
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null, null)
          )
        );
      });

      // Provider should not crash and fall back to seed data
      assert.ok(currentContext.tickets.length > 0, "Must fall back to default seed tickets");
      assert.strictEqual(currentContext.role, "citizen", "Must fall back to safe default role 'citizen'");
      console.log("[ADV-4.2 PASSED] ResilienceProvider safely catches and isolates corrupted localStorage.");
    });

    it("ADV-4.3: Empirical verification of non-persisted state gaps (Announcements, Teams, Vulnerable)", async () => {
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null, null)
          )
        );
      });

      // 1. Add Announcement
      await act(async () => {
        currentContext.addAnnouncement({
          title: "Adversarial Storm Surge Warning",
          message: "Rapid evacuation order",
          severity: "urgent",
          author: "Command",
          department: "rescue_evac",
          purokTag: "Purok 1",
        });
      });

      // 2. Toggle Vulnerable household
      const initialVulSafe = currentContext.vulnerableHouseholds.find((v) => v.id === "vul-001").isSafe;
      await act(async () => {
        currentContext.toggleVulnerableSafe("vul-001");
      });

      // Check localStorage keys
      const storedAnnouncements = globalThis.localStorage.getItem("helpem_announcements");
      const storedVulnerable = globalThis.localStorage.getItem("helpem_vulnerable");
      const storedTeams = globalThis.localStorage.getItem("helpem_volunteer_teams");

      console.log(`[ADV-4.3 AUDIT] Stored helpem_announcements in localStorage? ${Boolean(storedAnnouncements)}`);
      console.log(`[ADV-4.3 AUDIT] Stored helpem_vulnerable in localStorage? ${Boolean(storedVulnerable)}`);
      console.log(`[ADV-4.3 AUDIT] Stored helpem_volunteer_teams in localStorage? ${Boolean(storedTeams)}`);

      // Document: helpem_announcements is NOT saved to localStorage despite PROJECT.md claim!
      assert.strictEqual(
        storedAnnouncements,
        null,
        "Confirmed: helpem_announcements is currently not persisted to localStorage"
      );
      assert.strictEqual(
        storedVulnerable,
        null,
        "Confirmed: helpem_vulnerable is not persisted to localStorage"
      );
    });
  });

  // =========================================================================
  // SECTION 5: Resilience Invariants & Robustness Against Invalid Operations
  // =========================================================================
  describe("5. Invariants & Error Boundary Robustness", () => {
    it("ADV-5.1: Non-existent ticketId update is gracefully ignored without crashing", async () => {
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null, null)
          )
        );
      });

      const initialTickets = [...currentContext.tickets];

      // Update non-existent ticket
      assert.doesNotThrow(() => {
        act(() => {
          currentContext.updateTicketStatus("tkt-nonexistent-9999", "resolved", "team-alpha", "Ghost note");
        });
      });

      // Assert state length and content remains unchanged
      assert.strictEqual(currentContext.tickets.length, initialTickets.length);
    });

    it("ADV-5.2: Invalid/non-existent teamId does not crash updateTicketStatus", async () => {
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null, null)
          )
        );
      });

      let tId = null;
      await act(async () => {
        const t = currentContext.addTicket({
          contactName: "Invalid Team Test",
          phone: "09171234567",
          purokId: "purok-1",
          purokName: "Purok 1",
          source: "sos",
          priority: "high",
          category: "Medical",
          description: "Test description",
          householdMembers: 1,
          urgentNeeds: ["None"],
        });
        tId = t.id;
      });

      // Dispatch with invalid teamId
      assert.doesNotThrow(() => {
        act(() => {
          currentContext.updateTicketStatus(tId, "dispatched", "team-nonexistent-xyz");
        });
      });

      const t = currentContext.tickets.find((item) => item.id === tId);
      assert.strictEqual(t.assignedTeamId, "team-nonexistent-xyz");
      assert.strictEqual(t.assignedTeamName, undefined, "assignedTeamName should remain undefined for non-existent team");
    });

    it("ADV-5.3: Operations Desk accounting invariants across filter transitions", async () => {
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null,
              React.createElement(ResponderOperationsDesk, null)
            )
          )
        );
      });

      // Verify department counts sum up to total count
      const depts = ["rescue_evac", "health_medical", "relief_supplies", "power_utilities"];
      const sumOfDepts = depts.reduce((sum, d) => {
        return sum + currentContext.tickets.filter((t) => t.targetDepartment === d).length;
      }, 0);

      // Total tickets should equal sum of all 4 depts (plus any public_info if any)
      assert.strictEqual(sumOfDepts, currentContext.tickets.length, "All tickets must belong to one of the 4 rescue depts");
    });
  });
});

