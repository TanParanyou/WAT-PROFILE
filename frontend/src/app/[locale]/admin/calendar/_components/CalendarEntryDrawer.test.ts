import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { NextIntlClientProvider } from "next-intl";
import { canShowCalendarEditor } from "./CalendarEntryDrawer";
import { CalendarEntryDrawer } from "./CalendarEntryDrawer";
import type { CalendarEntry } from "@/features/calendar/types";

const testWindow = new Window();
Object.defineProperties(globalThis, {
  window: { configurable: true, value: testWindow },
  self: { configurable: true, value: testWindow },
  document: { configurable: true, value: testWindow.document },
  navigator: { configurable: true, value: testWindow.navigator },
  HTMLElement: { configurable: true, value: testWindow.HTMLElement },
  HTMLButtonElement: { configurable: true, value: testWindow.HTMLButtonElement },
  Node: { configurable: true, value: testWindow.Node },
  Event: { configurable: true, value: testWindow.Event },
  KeyboardEvent: { configurable: true, value: testWindow.KeyboardEvent },
  MouseEvent: { configurable: true, value: testWindow.MouseEvent },
  IS_REACT_ACT_ENVIRONMENT: { configurable: true, value: true },
});

const entry = (canEdit: boolean): CalendarEntry => ({
  id: "42",
  source: "event",
  title: "Merit gathering",
  start: "2026-08-10",
  end: "2026-08-11",
  allDay: true,
  status: "active",
  display: { tone: "default" },
  detail: { canEdit, editorHref: "/admin/events/42" },
});

const labels = {
  edit: "Edit event",
  close: "Close",
  source: "Source",
  status: "Status",
  active: "Active",
  inactive: "Inactive",
  location: "Location",
  description: "Description",
};

function drawerElement(entryValue: CalendarEntry, onClose: () => void) {
  return createElement(
    NextIntlClientProvider,
    { locale: "th", messages: {} },
    createElement(CalendarEntryDrawer, {
      entry: entryValue,
      open: true,
      onClose,
      labels,
    }),
  );
}

test("drawer hides editor action when canEdit is false", () => {
  assert.equal(canShowCalendarEditor(entry(false)), false);
});

test("drawer exposes editor action only for permitted entries", () => {
  assert.equal(canShowCalendarEditor(entry(true)), true);
});

test("drawer opens the selected entry and keeps editor navigation permission-aware", () => {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  let closeCalls = 0;

  act(() => {
    root.render(drawerElement(entry(true), () => { closeCalls += 1; }));
  });

  try {
    const dialog = document.body.querySelector('[role="dialog"]');
    assert.ok(dialog);
    assert.equal(dialog.querySelector("h2")?.textContent, "Merit gathering");
    const editLink = dialog.querySelector<HTMLAnchorElement>("a");
    assert.ok(editLink);
    assert.equal(editLink.textContent, "Edit event");
    assert.match(editLink.getAttribute("href") ?? "", /admin\/events\/42$/);

    act(() => {
      dialog.querySelector<HTMLButtonElement>('[aria-label="Close"]')?.click();
    });
    assert.equal(closeCalls, 1);
  } finally {
    act(() => { root.unmount(); });
    container.remove();
    document.body.replaceChildren();
  }
});

test("drawer does not render an editor link for an entry without permission", () => {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);

  act(() => {
    root.render(drawerElement(entry(false), () => undefined));
  });

  try {
    const dialog = document.body.querySelector('[role="dialog"]');
    assert.ok(dialog);
    assert.equal(dialog.querySelector("a"), null);
  } finally {
    act(() => { root.unmount(); });
    container.remove();
    document.body.replaceChildren();
  }
});
