import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import { act, createElement, type ReactElement } from "react";
import { renderToString } from "react-dom/server";
import { createRoot } from "react-dom/client";
import { useCalendarLayout } from "./useCalendarLayout";
import type { CalendarView } from "./core/types";
import type { CalendarResponsiveLayouts } from "./presets/types";

const testWindow = new Window();
let mediaMatches = false;
let lastQuery = "";
const mediaListeners = new Set<() => void>();

Object.defineProperty(testWindow, "matchMedia", {
  configurable: true,
  value: (query: string) => {
    lastQuery = query;
    return {
      media: query,
      matches: mediaMatches,
      addEventListener: (_event: string, listener: () => void) => mediaListeners.add(listener),
      removeEventListener: (_event: string, listener: () => void) => mediaListeners.delete(listener),
    };
  },
});
Object.defineProperties(globalThis, {
  window: { configurable: true, value: testWindow },
  document: { configurable: true, value: testWindow.document },
  navigator: { configurable: true, value: testWindow.navigator },
  HTMLElement: { configurable: true, value: testWindow.HTMLElement },
  Node: { configurable: true, value: testWindow.Node },
  IS_REACT_ACT_ENVIRONMENT: { configurable: true, value: true },
});

const layouts: CalendarResponsiveLayouts = {
  desktop: { month: "monthGrid", week: "timeGrid", day: "timeGrid" },
  mobile: { month: "monthAgenda", week: "dayStrip", day: "timeGrid" },
  mobileBreakpoint: 640,
};

function setMediaMatches(nextMatches: boolean) {
  mediaMatches = nextMatches;
  for (const listener of mediaListeners) listener();
}

function Harness({ view }: { view: CalendarView }): ReactElement {
  const layout = useCalendarLayout(view, layouts);
  return createElement("output", { "data-layout": layout }, layout);
}

function render(element: ReactElement) {
  const container = testWindow.document.createElement("div");
  testWindow.document.body.append(container);
  const root = createRoot(container);
  act(() => root.render(element));
  return {
    container,
    cleanup() {
      act(() => root.unmount());
      container.remove();
    },
  };
}

test("resolves desktop and mobile layouts through matchMedia without changing semantic view", () => {
  mediaMatches = false;
  mediaListeners.clear();
  const serverMarkup = renderToString(createElement(Harness, { view: "month" }));
  assert.match(serverMarkup, /monthGrid/);

  const screen = render(createElement(Harness, { view: "month" }));
  try {
    assert.equal(screen.container.querySelector("output")?.dataset.layout, "monthGrid");
    act(() => setMediaMatches(true));
    assert.equal(screen.container.querySelector("output")?.dataset.layout, "monthAgenda");
    act(() => setMediaMatches(false));
    assert.equal(screen.container.querySelector("output")?.dataset.layout, "monthGrid");
    assert.equal(lastQuery, "(max-width: 639px)");
  } finally {
    screen.cleanup();
  }
});

test("resolves the mobile Week presentation while keeping the semantic view Week", () => {
  mediaMatches = true;
  mediaListeners.clear();
  const screen = render(createElement(Harness, { view: "week" }));
  try {
    assert.equal(screen.container.querySelector("output")?.dataset.layout, "dayStrip");
  } finally {
    screen.cleanup();
  }
});
