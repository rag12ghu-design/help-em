/**
 * Help'Em E2E Test Harness & Environment Setup
 * Supports opaque-box UI rendering, event dispatching, and requirement assertions.
 */

import { Window } from "happy-dom";
import React, { act } from "react";
import ReactDOMClient from "react-dom/client";
import * as jsxRuntime from "react/jsx-runtime";
import ts from "typescript";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../..");

// Configure React act environment
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Setup Happy DOM
let windowInstance = null;
let currentRoot = null;
let currentContainer = null;

export function setupDom() {
  if (!windowInstance) {
    windowInstance = new Window({
      url: "http://localhost:3000",
      width: 1280,
      height: 800,
    });

    globalThis.window = windowInstance;
    globalThis.document = windowInstance.document;
    globalThis.HTMLElement = windowInstance.HTMLElement;
    globalThis.HTMLInputElement = windowInstance.HTMLInputElement;
    globalThis.HTMLButtonElement = windowInstance.HTMLButtonElement;
    globalThis.HTMLSelectElement = windowInstance.HTMLSelectElement;
    globalThis.HTMLTextAreaElement = windowInstance.HTMLTextAreaElement || windowInstance.HTMLElement;
    globalThis.Event = windowInstance.Event;
    globalThis.CustomEvent = windowInstance.CustomEvent;
    globalThis.MouseEvent = windowInstance.MouseEvent;
    globalThis.KeyboardEvent = windowInstance.KeyboardEvent;
  }

  windowInstance.document.body.innerHTML = "";
  if (windowInstance.localStorage && typeof windowInstance.localStorage.clear === "function") {
    windowInstance.localStorage.clear();
  }
  currentContainer = windowInstance.document.createElement("div");
  currentContainer.id = "app-root";
  windowInstance.document.body.appendChild(currentContainer);
  currentRoot = ReactDOMClient.createRoot(currentContainer);

  return { window: windowInstance, document: windowInstance.document };
}

export function setControlValue(element, value) {
  if (!element) return;
  const proto = Object.getPrototypeOf(element);
  const descriptor = Object.getOwnPropertyDescriptor(proto, "value");
  if (descriptor && descriptor.set) {
    descriptor.set.call(element, value);
  } else {
    element.value = value;
  }
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

export async function tearDownDom() {
  if (currentRoot) {
    await act(async () => {
      currentRoot.unmount();
    });
    currentRoot = null;
  }
  if (windowInstance) {
    windowInstance.document.body.innerHTML = "";
  }
}

// Module compilation & resolution cache
const moduleCache = new Map();

export function loadModule(filePath) {
  const resolvedPath = resolveFilePath(filePath);
  if (moduleCache.has(resolvedPath)) {
    return moduleCache.get(resolvedPath);
  }

  const fileExt = path.extname(resolvedPath);
  let fileContent = fs.readFileSync(resolvedPath, "utf8");

  // Mock next/image inline if needed
  fileContent = fileContent
    .replace(
      /import\s+Image\s+from\s+["']next\/image["'];?/g,
      `const Image = (props) => {
        const { priority, fill, ...rest } = props;
        const R = require("react");
        return R.createElement('img', { ...rest, 'data-priority': priority ? 'true' : undefined });
      };`
    )
    .replace('"use client";', "");

  const transpiled = ts.transpileModule(fileContent, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
    },
    fileName: resolvedPath,
  });

  const moduleExports = {};
  const moduleObj = { exports: moduleExports };

  const customRequire = (specifier) => {
    if (specifier === "react") return React;
    if (specifier === "react/jsx-runtime") return jsxRuntime;
    if (specifier === "next/image") {
      return (props) => {
        const { priority, fill, ...rest } = props;
        return React.createElement("img", {
          ...rest,
          "data-priority": priority ? "true" : undefined,
        });
      };
    }
    if (specifier === "lucide-react") {
      return new Proxy(
        {},
        {
          get: (target, prop) => {
            return (props) =>
              React.createElement("svg", {
                "data-icon": String(prop),
                ...props,
              });
          },
        }
      );
    }
    if (specifier.startsWith("@/")) {
      const rel = specifier.slice(2);
      const targetPath = path.resolve(projectRoot, "src", rel);
      return loadModule(targetPath);
    }
    if (specifier.startsWith("./") || specifier.startsWith("../")) {
      const targetPath = path.resolve(path.dirname(resolvedPath), specifier);
      return loadModule(targetPath);
    }
    throw new Error(`Unhandled import specifier: ${specifier} in ${resolvedPath}`);
  };

  const fn = new Function(
    "exports",
    "require",
    "module",
    "React",
    "__filename",
    "__dirname",
    transpiled.outputText
  );

  fn(
    moduleExports,
    customRequire,
    moduleObj,
    React,
    resolvedPath,
    path.dirname(resolvedPath)
  );

  const exportedValue = moduleObj.exports.default || moduleObj.exports;
  moduleCache.set(resolvedPath, moduleObj.exports);
  return moduleObj.exports;
}

function resolveFilePath(rawPath) {
  const candidates = [
    rawPath,
    `${rawPath}.tsx`,
    `${rawPath}.ts`,
    `${rawPath}.jsx`,
    `${rawPath}.js`,
    path.join(rawPath, "index.tsx"),
    path.join(rawPath, "index.ts"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) {
      return path.normalize(c);
    }
  }
  throw new Error(`File not found: ${rawPath}`);
}

/**
 * Mount the Help'Em main page in the Happy DOM environment
 */
export async function mountApp() {
  setupDom();
  const pagePath = path.resolve(projectRoot, "src/app/page.tsx");
  const pageModule = loadModule(pagePath);
  const Component = pageModule.default || pageModule;

  await act(async () => {
    currentRoot.render(React.createElement(Component));
  });

  return getAppHelpers();
}

/**
 * Helper utility to interact with the mounted page
 */
export function getAppHelpers() {
  const doc = globalThis.document;

  return {
    doc,
    container: currentContainer,

    // Dynamic Island navigation
    getDynamicIsland: () => {
      const nav = doc.querySelector('nav[aria-label="Community Mesh Navigation Capsule"]') ||
        doc.querySelector('nav[aria-label="Campus Mesh Navigation Capsule"]') ||
        doc.querySelector('nav[aria-label="Campus Mesh Navigation"]') ||
        doc.querySelector('header nav');
      return {
        element: nav,
        brandText: nav?.textContent?.includes("Help'Em") || false,
        meshActive: nav?.textContent?.includes("Community Mesh Active") || nav?.textContent?.includes("Campus Mesh Active") || false,
        openAppButton: nav?.querySelector("button"),
      };
    },

    // 3D Mascot Hero
    getMascotHero: () => {
      const img = doc.querySelector('img[src*="mascot"]') ||
        doc.querySelector('img[alt*="Mascot"]') ||
        doc.querySelector('img[alt*="mascot"]');
      return {
        element: img,
        src: img?.getAttribute("src"),
        alt: img?.getAttribute("alt"),
        isPriority: img?.getAttribute("data-priority") === "true",
      };
    },

    // Layer Switcher
    getLayerSwitcher: () => {
      const buttons = Array.from(doc.querySelectorAll("button")).filter(b =>
        b.textContent?.includes("Purok Map") || b.textContent?.includes("Typhoon Radar")
      );
      const purokMapBtn = buttons.find(b => b.textContent?.includes("Purok Map"));
      const typhoonRadarBtn = buttons.find(b => b.textContent?.includes("Typhoon Radar"));

      return {
        purokMapBtn,
        typhoonRadarBtn,
        switchPurok: async () => {
          if (purokMapBtn) {
            await act(async () => {
              purokMapBtn.click();
            });
          }
        },
        switchRadar: async () => {
          if (typhoonRadarBtn) {
            await act(async () => {
              typhoonRadarBtn.click();
            });
          }
        },
      };
    },

    // Purok Pins
    getPurokPins: () => {
      // Find pin buttons by data-testid or text content or aria-label
      let pinButtons = Array.from(doc.querySelectorAll('[data-testid^="purok-pin-"]'));
      if (pinButtons.length === 0) {
        pinButtons = Array.from(doc.querySelectorAll("button")).filter(b => {
          const text = b.textContent || "";
          return /Purok\s*[1-5]/i.test(text) && !b.closest("select");
        });
      }
      return pinButtons;
    },

    clickPurokPin: async (pinIndex) => {
      const pins = getAppHelpers().getPurokPins();
      const target = pins[pinIndex - 1] || pins.find(p => p.textContent?.includes(`Purok ${pinIndex}`));
      if (!target) throw new Error(`Purok pin ${pinIndex} not found`);
      await act(async () => {
        target.click();
      });
    },

    // Inspector HUD Card
    getInspectorHUD: () => {
      const card = doc.querySelector('[data-testid="hud-inspector-card"]') ||
        doc.querySelector('[data-testid="map-hud-inspector"]') ||
        Array.from(doc.querySelectorAll("div")).find(d =>
          d.textContent?.includes("Safe") &&
          (d.textContent?.includes("Purok 1") ||
           d.textContent?.includes("Purok 2") ||
           d.textContent?.includes("Purok 3") ||
           d.textContent?.includes("Purok 4") ||
           d.textContent?.includes("Purok 5"))
        );
      return {
        element: card,
        text: card?.textContent || "",
      };
    },

    // Safety Toggle Switch & Badge
    getSafetySwitch: () => {
      const btn = doc.querySelector('button[role="switch"]') ||
        doc.querySelector('#safety-checkin-switch');
      const badge = doc.querySelector('[data-testid="safety-status-badge"]');
      return {
        element: btn,
        isChecked: btn?.getAttribute("aria-checked") === "true",
        badgeText: badge?.textContent?.trim() || (btn?.getAttribute("aria-checked") === "true" ? "Safe" : "Unchecked"),
        toggle: async () => {
          if (btn) {
            await act(async () => {
              btn.click();
            });
          }
        },
      };
    },

    // Household Safety Counter
    getSafetyCounterText: () => {
      const regex = /(\d+)\s+of\s+(\d+)\s+Families\s+Safe/i;
      const match = doc.body.textContent?.match(regex);
      return match ? { full: match[0], safe: parseInt(match[1], 10), total: parseInt(match[2], 10) } : null;
    },

    // Action Dispatch Modal
    getModal: () => {
      const modal = doc.querySelector('.fixed.inset-0') ||
        Array.from(doc.querySelectorAll("div")).find(d =>
          d.className?.includes("fixed") && d.textContent?.includes("Household")
        );
      if (!modal) return null;

      const titleEl = modal.querySelector("#modal-title") || modal.querySelector("h2") || modal.querySelector("h3");
      const title = titleEl?.textContent || "";
      const closeBtn = modal.querySelector("button");
      const form = modal.querySelector("form");
      const nameInput = modal.querySelector('input[placeholder*="Juan dela Cruz"]') ||
        modal.querySelector('input[placeholder*="Name"]') ||
        Array.from(modal.querySelectorAll("input")).find(i => i.type === "text");
      const phoneInput = modal.querySelector('input[type="tel"]');
      const purokSelect = modal.querySelector("select");
      const membersInput = modal.querySelector('input[type="number"]');
      const submitBtn = modal.querySelector('button[type="submit"]');

      return {
        modalElement: modal,
        title,
        closeBtn,
        form,
        nameInput,
        phoneInput,
        purokSelect,
        membersInput,
        submitBtn,
        close: async () => {
          if (closeBtn) {
            await act(async () => {
              closeBtn.click();
            });
          }
        },
        submit: async (formData = {}) => {
          await act(async () => {
            if (nameInput && formData.name !== undefined) {
              setControlValue(nameInput, formData.name);
            }
            if (phoneInput && formData.phone !== undefined) {
              setControlValue(phoneInput, formData.phone);
            }
            if (purokSelect && formData.purok !== undefined) {
              setControlValue(purokSelect, formData.purok);
            }
            if (membersInput && formData.members !== undefined) {
              setControlValue(membersInput, formData.members);
            }
            if (form) {
              form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
            }
          });
        },
      };
    },

    // Modal Trigger Buttons
    openModalVia: async (triggerType) => {
      let btn = null;
      if (triggerType === "open-app") {
        btn = getAppHelpers().getDynamicIsland().openAppButton;
      } else if (triggerType === "connect-campus") {
        btn = Array.from(doc.querySelectorAll("button")).find(b =>
          b.textContent?.includes("Connect Your Household") ||
          b.textContent?.includes("Connect Your Campus")
        );
      } else if (triggerType === "sos") {
        btn = doc.querySelector('button[title*="emergency"]') ||
          Array.from(doc.querySelectorAll("button")).find(b =>
            b.querySelector('svg[data-icon="X"]') && b.closest(".rounded-\\[28px\\]")
          );
      } else if (triggerType === "aid") {
        btn = Array.from(doc.querySelectorAll("button")).find(b =>
          b.textContent?.includes("Connect to Station")
        );
      } else if (triggerType === "enroll-family") {
        btn = Array.from(doc.querySelectorAll("button")).find(b =>
          b.textContent?.includes("Enroll Family")
        );
      }

      if (!btn) throw new Error(`Modal trigger '${triggerType}' button not found`);
      await act(async () => {
        btn.click();
      });
      return getAppHelpers().getModal();
    },

    // Ground Truth Debunker Cards
    getDebunkerCards: () => {
      const rumorSection = Array.from(doc.querySelectorAll("div")).filter(d =>
        d.textContent?.includes("Unverified Group Chat Rumors") ||
        d.textContent?.includes("May nagsabi gumuho daw ang dike")
      );
      const truthSection = Array.from(doc.querySelectorAll("div")).filter(d =>
        d.textContent?.includes("Help'Em Verified Barangay Truth") ||
        d.textContent?.includes("Dike Inspection Fact-Check")
      );
      return {
        rumorsFound: rumorSection.length > 0,
        truthFound: truthSection.length > 0,
        allText: doc.body.textContent || "",
      };
    },

    // Barangay Aid Stations Cards
    getAidCards: () => {
      const stationButtons = Array.from(doc.querySelectorAll("button")).filter(b =>
        b.textContent?.includes("Connect to Station")
      );
      const cards = stationButtons.map(btn => btn.closest('.rounded-2xl') || btn.parentElement?.parentElement);
      return cards.filter(Boolean);
    },

    // Hotlines in Footer
    getHotlines: () => {
      const footer = doc.querySelector("footer");
      const text = footer?.textContent || "";
      return {
        footerElement: footer,
        hasBrgyDesk: text.includes("0917-889-MMSU"),
        hasClinic: text.includes("600-0459"),
        hasCdrrmo: text.includes("911"),
        hasMmsuAffiliation: text.includes("Mariano Marcos State University"),
      };
    },
  };
}
