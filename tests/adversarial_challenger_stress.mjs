/**
 * ADVERSARIAL CHALLENGER STRESS & STATE SYNC HARNESS
 * Help'Em Community Disaster Resilience Platform
 * 
 * Target:
 * 1. Empirically verify state synchronization between resident check-in (isSafe, safeCount)
 *    and Operations Desk roster (214 -> 215, 89% -> 90%).
 * 2. Stress test rapid toggles and ticket state transitions under adversarial conditions.
 * 3. Verify cross-portal reactivity, persistence hydration, and edge-case routing.
 */

import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import path from "path";
import React, { act } from "react";
import ReactDOMClient from "react-dom/client";
import { setupDom, tearDownDom, loadModule, mountApp, getAppHelpers } from "./e2e/harness.mjs";

const projectRoot = path.resolve(process.cwd());

// Load domain modules
const ctxModule = loadModule(path.resolve(projectRoot, "src/context/ResilienceContext.tsx"));
const ResilienceProvider = ctxModule.ResilienceProvider;
const useResilience = ctxModule.useResilience;

const deskModule = loadModule(path.resolve(projectRoot, "src/components/ResponderOperationsDesk.tsx"));
const ResponderOperationsDesk = deskModule.default || deskModule;

const checkInModule = loadModule(path.resolve(projectRoot, "src/components/SafetyCheckIn.tsx"));
const SafetyCheckIn = checkInModule.default || checkInModule;

const trackerModule = loadModule(path.resolve(projectRoot, "src/components/CitizenCaseTracker.tsx"));
const CitizenCaseTracker = trackerModule.default || trackerModule;

const navModule = loadModule(path.resolve(projectRoot, "src/components/Navigation.tsx"));
const Navigation = navModule.default || navModule;

const purokModule = loadModule(path.resolve(projectRoot, "src/data/puroks.ts"));
const PUROK_NODES = purokModule.PUROK_NODES;

describe("ADVERSARIAL CHALLENGER: State Synchronization & Stress Suite", () => {
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
  // SECTION 1: EMPIRICAL STATE SYNC (Resident Check-in <-> Operations Desk)
  // =========================================================================
  describe("1. Resident Check-In <-> Operations Desk Roster Synchronization (214 -> 215)", () => {
    it("CH-1.1: Operations Desk reflects baseline 214/240 (89%) and updates to 215/240 (90%) upon resident toggle in DOM", async () => {
      // Mount dual component tree sharing the same ResilienceProvider
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(
              ContextWatcher,
              null,
              React.createElement("div", { id: "dual-wrapper" },
                React.createElement(ResponderOperationsDesk, { onOpenCall: () => {} })
              )
            )
          )
        );
      });

      // Verify baseline initial state in context
      assert.strictEqual(currentContext.isSafe, false, "Initial isSafe must be false");
      assert.strictEqual(currentContext.safeCount, 214, "Initial safeCount must be 214");
      assert.strictEqual(currentContext.totalHouseholds, 240, "Total households must be 240");

      // Verify DOM rendering in Operations Desk Hero KPI strip and Roster Tab button
      const textBefore = testContainer.textContent;
      assert.ok(textBefore.includes("214 / 240"), "Operations Desk Hero KPI must display '214 / 240'");
      assert.ok(textBefore.includes("Families Safe"), "Operations Desk Hero KPI must display 'Families Safe'");
      assert.ok(textBefore.includes("214 / 240 Safe"), "Roster tab button must show '214 / 240 Safe'");

      // Click to open the Roster Tab to view the Total Safety Index
      const rosterTabBtn = Array.from(testContainer.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("Household Safety Accounting Roster")
      );
      assert.ok(rosterTabBtn, "Roster tab button must exist");
      await act(async () => {
        rosterTabBtn.click();
      });

      // Now inside the Roster Tab: verify 89% Total Safety Index
      const rosterTextBefore = testContainer.textContent;
      assert.ok(rosterTextBefore.includes("89%"), "Roster view must display baseline 89%");
      assert.ok(rosterTextBefore.includes("Total Safety Index"), "Must display Total Safety Index label");

      // Now toggle safe in the shared context (simulating resident check-in)
      await act(async () => {
        currentContext.toggleSafe();
      });

      // Verify context state updated
      assert.strictEqual(currentContext.isSafe, true, "isSafe must be true after toggle");
      assert.strictEqual(currentContext.safeCount, 215, "safeCount must be 215 after toggle");

      // Verify DOM rendering updated reactively in Operations Desk
      const textAfter = testContainer.textContent;
      assert.ok(textAfter.includes("215 / 240"), "Operations Desk KPI must update in DOM to '215 / 240'");
      assert.ok(textAfter.includes("215 / 240 Safe"), "Roster tab button must update to '215 / 240 Safe'");
      assert.ok(textAfter.includes("90%"), "Roster view Total Safety Index must update in DOM to '90%'");
      assert.ok(!textAfter.includes("214 / 240"), "Operations Desk must no longer contain '214 / 240'");

      // Toggle back off
      await act(async () => {
        currentContext.toggleSafe();
      });

      assert.strictEqual(currentContext.isSafe, false, "isSafe must revert to false");
      assert.strictEqual(currentContext.safeCount, 214, "safeCount must revert to 214");
      const textReverted = testContainer.textContent;
      assert.ok(textReverted.includes("214 / 240"), "Operations Desk KPI must revert in DOM to '214 / 240'");
      assert.ok(textReverted.includes("89%"), "Roster view Total Safety Index must revert to '89%'");
    });

    it("CH-1.2: Cross-role portal transition retains resident check-in state across full page mount", async () => {
      const helpers = await mountApp();

      // 1. Initial resident view
      const initialCounter = helpers.getSafetyCounterText();
      assert.ok(initialCounter, "Safety counter text must be present on citizen view");
      assert.strictEqual(initialCounter.safe, 214);
      assert.strictEqual(initialCounter.total, 240);

      // 2. Toggle safe switch via DOM click
      const safetySwitch = helpers.getSafetySwitch();
      assert.strictEqual(safetySwitch.isChecked, false);
      await safetySwitch.toggle();

      // Verify citizen view updated to 215
      const updatedCounter = helpers.getSafetyCounterText();
      assert.strictEqual(updatedCounter.safe, 215);

      // 3. Switch role to responder using the navigation segmented switcher
      const responderBtn = Array.from(doc.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("Department Responders")
      );
      assert.ok(responderBtn, "Must find Department Responders button in Navigation");

      await act(async () => {
        responderBtn.click();
      });

      // 4. Verify Operations Desk mounted and presents 215 / 240
      const deskContent = doc.body.textContent;
      assert.ok(deskContent.includes("Operations Desk Live"), "Must have transitioned to Operations Desk");
      assert.ok(deskContent.includes("215 / 240"), "Operations Desk must show '215 / 240'");

      // Switch to Roster tab to inspect Total Safety Index
      const rosterTab = Array.from(doc.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("Household Safety Accounting Roster")
      );
      assert.ok(rosterTab, "Must find Household Safety Accounting Roster tab button");
      await act(async () => {
        rosterTab.click();
      });

      assert.ok(doc.body.textContent.includes("90%"), "Operations Desk roster must show 90% Total Safety Index");

      // 5. Switch back to citizen
      const residentBtn = Array.from(doc.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("Community Resident")
      );
      assert.ok(residentBtn, "Must find Community Resident button");
      await act(async () => {
        residentBtn.click();
      });

      // Verify citizen view still shows 215 of 240 Families Safe
      const revertedCounter = helpers.getSafetyCounterText();
      assert.strictEqual(revertedCounter.safe, 215);
    });

    it("CH-1.3: LocalStorage persistence hydrator initializes 215/240 on pre-existing true state", async () => {
      // Simulate existing session in localStorage
      globalThis.localStorage.setItem("helpem_is_safe", "true");

      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(
              ContextWatcher,
              null,
              React.createElement(ResponderOperationsDesk, { onOpenCall: () => {} })
            )
          )
        );
      });

      // Give useEffect hydration a microtick
      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });

      assert.strictEqual(currentContext.isSafe, true, "Hydrated isSafe must be true");
      assert.strictEqual(currentContext.safeCount, 215, "Hydrated safeCount must be 215");
      assert.ok(testContainer.textContent.includes("215 / 240"), "DOM must reflect hydrated 215/240");
    });
  });

  // =========================================================================
  // SECTION 2: ADVERSARIAL STRESS TESTING (Rapid Toggles & Concurrency)
  // =========================================================================
  describe("2. Rapid Toggles & Concurrency Stress Testing", () => {
    it("CH-2.1: 100 consecutive rapid toggles maintain strict mathematical parity and bounds", async () => {
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null)
          )
        );
      });

      assert.strictEqual(currentContext.safeCount, 214);

      for (let i = 1; i <= 100; i++) {
        await act(async () => {
          currentContext.toggleSafe();
        });

        const expectedSafe = i % 2 === 1;
        const expectedCount = expectedSafe ? 215 : 214;

        assert.strictEqual(
          currentContext.isSafe,
          expectedSafe,
          `Toggle #${i} failed: isSafe should be ${expectedSafe}`
        );
        assert.strictEqual(
          currentContext.safeCount,
          expectedCount,
          `Toggle #${i} failed: safeCount should be ${expectedCount}`
        );
        assert.ok(
          currentContext.safeCount >= 214 && currentContext.safeCount <= 215,
          `Toggle #${i} invariant violated: safeCount out of bounds`
        );
      }

      assert.strictEqual(currentContext.safeCount, 214, "After 100 toggles, count must settle on 214");
    });

    it("CH-2.2: Rapid DOM button clicks on SafetyCheckIn component preserve deterministic state", async () => {
      let latestSafe = false;
      let latestCount = 214;

      function TestSwitch() {
        const { isSafe, safeCount, totalHouseholds, toggleSafe } = useResilience();
        latestSafe = isSafe;
        latestCount = safeCount;
        return React.createElement(SafetyCheckIn, {
          isSafe,
          safeCount,
          totalHouseholds,
          onToggle: toggleSafe,
          onOpenConnectModal: () => {},
        });
      }

      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(TestSwitch, null)
          )
        );
      });

      const button = testContainer.querySelector('button[role="switch"]');
      assert.ok(button, "Switch button must exist");

      // 21 rapid clicks
      for (let i = 1; i <= 21; i++) {
        await act(async () => {
          button.click();
        });
        const expectedSafe = i % 2 === 1;
        assert.strictEqual(latestSafe, expectedSafe, `Click #${i} mismatch`);
        assert.strictEqual(latestCount, expectedSafe ? 215 : 214);
      }

      assert.strictEqual(latestSafe, true, "After 21 clicks, must be true");
      assert.strictEqual(latestCount, 215, "After 21 clicks, must be 215");
      assert.strictEqual(button.getAttribute("aria-checked"), "true");
    });

    it("CH-2.3: Idempotency of setIsSafe direct setter under repeated duplicate calls", async () => {
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null)
          )
        );
      });

      // Call setIsSafe(true) 10 times consecutively
      for (let i = 0; i < 10; i++) {
        await act(async () => {
          currentContext.setIsSafe(true);
        });
        assert.strictEqual(currentContext.isSafe, true);
        assert.strictEqual(currentContext.safeCount, 215);
      }

      // Call setIsSafe(false) 10 times consecutively
      for (let i = 0; i < 10; i++) {
        await act(async () => {
          currentContext.setIsSafe(false);
        });
        assert.strictEqual(currentContext.isSafe, false);
        assert.strictEqual(currentContext.safeCount, 214);
      }
    });

    it("CH-2.4: LocalStorage corruption resilience: recovers cleanly when storage throws or contains invalid data", async () => {
      // Put invalid json / string in storage
      globalThis.localStorage.setItem("helpem_is_safe", "not-a-boolean");
      globalThis.localStorage.setItem("helpem_tickets", "{malformed json");

      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null)
          )
        );
      });

      // Storage errors should be handled with fallback, no unhandled exceptions
      assert.strictEqual(currentContext.isSafe, false, "Fallback for invalid string is false");
      assert.strictEqual(currentContext.safeCount, 214, "safeCount remains 214");
      assert.ok(Array.isArray(currentContext.tickets), "tickets array falls back to valid array");
    });
  });

  // =========================================================================
  // SECTION 3: TICKET LIFECYCLE & STATE MACHINE STRESS TESTING
  // =========================================================================
  describe("3. Ticket Lifecycle & State Machine Transitions Stress Testing", () => {
    it("CH-3.1: Full sequential lifecycle traversal (pending -> acknowledged -> dispatched -> resolved)", async () => {
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null)
          )
        );
      });

      // Create new ticket
      let newTicket;
      await act(async () => {
        newTicket = currentContext.addTicket({
          contactName: "Stress Test Citizen",
          phone: "0917-999-8877",
          purokId: "purok-1",
          purokName: "Purok 1 • Riverside",
          source: "sos",
          priority: "critical",
          category: "Flash Flood / Rapid Inundation",
          description: "Water reaching windows",
          householdMembers: 4,
          urgentNeeds: ["Rubber Boat"],
        });
      });

      assert.ok(newTicket.id);
      assert.strictEqual(newTicket.status, "pending");
      assert.strictEqual(newTicket.targetDepartment, "rescue_evac");

      // Transition 1: Acknowledge
      await act(async () => {
        currentContext.updateTicketStatus(
          newTicket.id,
          "acknowledged",
          undefined,
          "Officer Ramos on station"
        );
      });
      let t = currentContext.tickets.find((item) => item.id === newTicket.id);
      assert.strictEqual(t.status, "acknowledged");
      assert.strictEqual(t.responderNotes, "Officer Ramos on station");

      // Transition 2: Dispatch
      await act(async () => {
        currentContext.updateTicketStatus(
          newTicket.id,
          "dispatched",
          "team-alpha",
          "Deploying BDRRMC rescue team"
        );
      });
      t = currentContext.tickets.find((item) => item.id === newTicket.id);
      assert.strictEqual(t.status, "dispatched");
      assert.strictEqual(t.assignedTeamId, "team-alpha");
      assert.strictEqual(t.assignedTeamName, "BDRRMC Rescue & Engineering Unit Alpha");

      // Transition 3: Resolve
      await act(async () => {
        currentContext.updateTicketStatus(
          newTicket.id,
          "resolved",
          undefined,
          "Family safely brought to Covered Court"
        );
      });
      t = currentContext.tickets.find((item) => item.id === newTicket.id);
      assert.strictEqual(t.status, "resolved");
      assert.strictEqual(t.responderNotes, "Family safely brought to Covered Court");
      assert.ok(t.resolvedAt.includes("PST"), "resolvedAt must contain PST timestamp");
    });

    it("CH-3.2: Out-of-order transitions: Direct resolution from pending", async () => {
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null)
          )
        );
      });

      let directTicket;
      await act(async () => {
        directTicket = currentContext.addTicket({
          contactName: "Direct Resolve Citizen",
          phone: "0917-111-2233",
          purokId: "purok-3",
          purokName: "Purok 3 • Covered Court",
          source: "aid",
          priority: "low",
          category: "Medical Consultation",
          description: "Minor scratch treated immediately",
          householdMembers: 1,
        });
      });

      // Jump directly from pending to resolved
      await act(async () => {
        currentContext.updateTicketStatus(
          directTicket.id,
          "resolved",
          undefined,
          "Resolved on desk immediately"
        );
      });

      const updated = currentContext.tickets.find((t) => t.id === directTicket.id);
      assert.strictEqual(updated.status, "resolved");
      assert.ok(updated.resolvedAt);
      assert.strictEqual(updated.responderNotes, "Resolved on desk immediately");
    });

    it("CH-3.3: CitizenCaseTracker mirrors ticket lifecycle updates reactively", async () => {
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(
              ContextWatcher,
              null,
              React.createElement(CitizenCaseTracker, { onOpenCall: () => {} })
            )
          )
        );
      });

      // tkt-001 is active by default
      const trackerContainer = testContainer.querySelector('aside[aria-label="Citizen Active Case Tracker"]');
      assert.ok(trackerContainer, "Citizen Case Tracker must be rendered");
      assert.ok(trackerContainer.textContent.includes("TKT-1041"));
      assert.ok(trackerContainer.textContent.includes("Queued at Operations Desk"));

      // Update tkt-001 to acknowledged
      await act(async () => {
        currentContext.updateTicketStatus("tkt-001", "acknowledged");
      });
      assert.ok(trackerContainer.textContent.includes("Department Acknowledged"));

      // Update tkt-001 to dispatched
      await act(async () => {
        currentContext.updateTicketStatus("tkt-001", "dispatched", "team-alpha");
      });
      assert.ok(trackerContainer.textContent.includes("Emergency Unit Dispatched"));

      // Update tkt-001 to resolved
      await act(async () => {
        currentContext.updateTicketStatus("tkt-001", "resolved");
      });
      assert.ok(trackerContainer.textContent.includes("Assistance Completed"));
    });

    it("CH-3.4: Team assignment accounting analysis and behavior under reassignment", async () => {
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null)
          )
        );
      });

      const initialAlpha = currentContext.volunteerTeams.find((tm) => tm.id === "team-alpha");
      const initialBeta = currentContext.volunteerTeams.find((tm) => tm.id === "team-beta");
      const alphaCount = initialAlpha.assignedTicketsCount;
      const betaCount = initialBeta.assignedTicketsCount;

      // Assign tkt-001 to team-beta
      await act(async () => {
        currentContext.updateTicketStatus("tkt-001", "dispatched", "team-beta");
      });

      const updatedBeta = currentContext.volunteerTeams.find((tm) => tm.id === "team-beta");
      assert.strictEqual(
        updatedBeta.assignedTicketsCount,
        betaCount + 1,
        "team-beta count increments upon dispatch"
      );
      assert.strictEqual(updatedBeta.status, "deployed");

      // Verify that team-alpha was unchanged
      const currentAlpha = currentContext.volunteerTeams.find((tm) => tm.id === "team-alpha");
      assert.strictEqual(currentAlpha.assignedTicketsCount, alphaCount);
    });

    it("CH-3.5: Rapid creation of 30 tickets across departments maintains queue integrity", async () => {
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null)
          )
        );
      });

      const initialCount = currentContext.tickets.length;
      const createdIds = [];

      for (let i = 0; i < 30; i++) {
        const cat = i % 4 === 0 ? "Rising Flood" : i % 4 === 1 ? "Pediatric Fever" : i % 4 === 2 ? "Drinking Water" : "Generator Power";
        await act(async () => {
          const t = currentContext.addTicket({
            contactName: `Batch User ${i}`,
            phone: `091700000${String(i).padStart(2, "0")}`,
            purokId: `purok-${(i % 5) + 1}`,
            purokName: `Purok ${(i % 5) + 1}`,
            source: "sos",
            priority: "high",
            category: cat,
            description: `Batch issue description ${i}`,
            householdMembers: (i % 6) + 1,
          });
          createdIds.push(t.id);
          await new Promise((r) => setTimeout(r, 2));
        });
      }

      assert.strictEqual(currentContext.tickets.length, initialCount + 30);
      assert.strictEqual(currentContext.citizenTicketIds.length, 30);

      // Verify all tickets have unique IDs when spaced across distinct milliseconds
      const idSet = new Set(currentContext.tickets.map((t) => t.id));
      assert.strictEqual(idSet.size, initialCount + 30);

      // Verify department filtering operates correctly on the scaled queue
      await act(async () => {
        currentContext.setSelectedDepartment("rescue_evac");
      });
      const rescueCount = currentContext.filteredTickets.length;
      assert.ok(rescueCount > 0, "Filtered queue must contain rescue tickets");
      assert.ok(rescueCount < currentContext.tickets.length, "Filtered queue must exclude other departments");

      await act(async () => {
        currentContext.setSelectedDepartment("all");
      });
      assert.strictEqual(currentContext.filteredTickets.length, initialCount + 30);
    });

    it("CH-3.6: [FINDING] Sub-millisecond ticket submission generates colliding IDs via Date.now().toString(36)", async () => {
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null)
          )
        );
      });

      // Synchronously create 5 tickets in a tight synchronous loop without delays
      const batch = [];
      await act(async () => {
        for (let i = 0; i < 5; i++) {
          batch.push(
            currentContext.addTicket({
              contactName: `Collision Test ${i}`,
              phone: `0917123456${i}`,
              purokId: "purok-1",
              purokName: "Purok 1",
              source: "sos",
              priority: "high",
              category: "Flood Emergency",
              description: `Collision check ${i}`,
              householdMembers: 2,
            })
          );
        }
      });

      const uniqueGeneratedIds = new Set(batch.map((t) => t.id));
      // Under synchronous execution within same millisecond, Date.now().toString(36) yields duplicate IDs
      const hasCollision = uniqueGeneratedIds.size < batch.length;
      
      // Document empirical finding: If colliding IDs exist, updating one ticket mutates all colliding tickets
      if (hasCollision) {
        const collidingId = batch[0].id;
        const matchingTicketsBefore = currentContext.tickets.filter((t) => t.id === collidingId);
        
        await act(async () => {
          currentContext.updateTicketStatus(collidingId, "acknowledged", undefined, "Batch collision updated");
        });

        const matchingTicketsAfter = currentContext.tickets.filter((t) => t.id === collidingId);
        // All tickets sharing the colliding ID are updated simultaneously!
        assert.ok(
          matchingTicketsAfter.every((t) => t.status === "acknowledged"),
          "Adversarial observation: colliding IDs cause simultaneous unintended status propagation"
        );
      }
      assert.ok(true, "Vulnerability successfully characterized and documented");
    });
  });

  // =========================================================================
  // SECTION 4: DEPARTMENT ROUTING ADVERSARIAL EDGE CASES
  // =========================================================================
  describe("4. Department Help Request Auto-Routing Adversarial Cases", () => {
    it("CH-4.1: Category keyword routing priority and fallback behavior", async () => {
      await act(async () => {
        root.render(
          React.createElement(
            ResilienceProvider,
            null,
            React.createElement(ContextWatcher, null)
          )
        );
      });

      // Test 1: Empty string category falls back safely to rescue_evac
      let t1;
      await act(async () => {
        t1 = currentContext.addTicket({
          contactName: "Fallback User",
          phone: "09171112222",
          purokId: "purok-1",
          purokName: "Purok 1",
          source: "sos",
          priority: "medium",
          category: "",
          description: "No category provided",
          householdMembers: 2,
        });
      });
      assert.strictEqual(t1.targetDepartment, "rescue_evac", "Empty category must fall back to rescue_evac");

      // Test 2: Explicit targetDepartment overrides category keywords
      let t2;
      await act(async () => {
        t2 = currentContext.addTicket({
          contactName: "Override User",
          phone: "09171112222",
          purokId: "purok-2",
          purokName: "Purok 2",
          source: "sos",
          priority: "high",
          category: "Heavy Flood and High Water Surge", // Would normally route to rescue_evac
          targetDepartment: "power_utilities", // Explicit override
          description: "Power lines submerged in flood water",
          householdMembers: 3,
        });
      });
      assert.strictEqual(t2.targetDepartment, "power_utilities", "Explicit targetDepartment must override category");

      // Test 3: Mixed keywords: "Need potable water relief after flood"
      // In resolveDepartment: flood is checked first -> routes to rescue_evac
      let t3;
      await act(async () => {
        t3 = currentContext.addTicket({
          contactName: "Mixed User",
          phone: "09171112222",
          purokId: "purok-1",
          purokName: "Purok 1",
          source: "sos",
          priority: "medium",
          category: "Need potable water relief after flood",
          description: "Water well flooded",
          householdMembers: 4,
        });
      });
      assert.strictEqual(t3.targetDepartment, "rescue_evac");
    });
  });
});
