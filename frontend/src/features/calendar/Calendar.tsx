"use client";

import type { ReactNode } from "react";
import type { CalendarLabels } from "./calendar-copy";
import type { CalendarConfig } from "./config";
import type { CalendarEventLike, CalendarResource } from "./core/types";
import { CalendarRoot } from "./ui/CalendarRoot";
import { getCalendarDays } from "./views/calendar-view-utils";
import { MonthView } from "./views/MonthView";
import { MonthAgenda } from "./views/MonthAgenda";
import { DayStrip } from "./views/DayStrip";
import { TimeGrid } from "./views/TimeGrid";
import { TimelineView } from "./views/TimelineView";
import { DayGridView } from "./views/DayGridView";
import type { CalendarController } from "./useCalendar";
import { useCalendarLayout } from "./useCalendarLayout";
import type { CalendarPreset } from "./presets/types";
import type { CalendarVariant } from "./calendar-theme";

export interface CalendarProps<TEvent extends CalendarEventLike> {
  preset: CalendarPreset;
  controller: CalendarController;
  events: readonly TEvent[];
  labels: CalendarLabels;
  variant: CalendarVariant;
  /** Optional inline lane definitions; the host owns their lifecycle. */
  resources?: readonly CalendarResource[];
  onEventActivate: (event: TEvent) => void;
  renderEvent?: (event: TEvent, density: "summary" | "row" | "timeGrid") => ReactNode;
  getEventClassName?: (event: TEvent, density: "summary" | "row" | "timeGrid") => string;
  formatEventTime?: (event: TEvent, date: string) => string | null;
  formatEventLocation?: (event: TEvent) => string | null;
  showTooltip?: boolean;
  renderTooltip?: (event: TEvent) => ReactNode;
  themeClassName?: string;
  controlClassName?: string;
  activeTabClassName?: string;
  inactiveTabClassName?: string;
  focusClassName?: string;
}

function getRootClasses(variant: CalendarVariant): Pick<CalendarProps<CalendarEventLike>, "themeClassName" | "controlClassName" | "activeTabClassName" | "inactiveTabClassName" | "focusClassName"> {
  if (variant === "admin") {
    return {
      themeClassName: "admin-theme bg-admin-canvas text-admin-foreground",
      controlClassName: "border border-admin-border bg-admin-canvas text-admin-foreground hover:bg-admin-surface",
      activeTabClassName: "bg-admin-action text-admin-on-action",
      inactiveTabClassName: "text-admin-foreground hover:bg-admin-surface",
      focusClassName: "focus-visible:outline-admin-focus",
    };
  }
  return {
    themeClassName: "public-theme bg-site-canvas text-site-foreground",
    controlClassName: "border border-site-border bg-site-canvas text-site-foreground hover:bg-site-surface",
    activeTabClassName: "bg-site-action text-site-on-action",
    inactiveTabClassName: "text-site-foreground hover:bg-site-surface",
    focusClassName: "focus-visible:outline-site-focus",
  };
}

export function Calendar<TEvent extends CalendarEventLike>({
  preset,
  controller,
  events,
  labels,
  variant,
  resources,
  onEventActivate,
  renderEvent,
  getEventClassName,
  formatEventTime,
  formatEventLocation,
  showTooltip = true,
  renderTooltip,
  themeClassName,
  controlClassName,
  activeTabClassName,
  inactiveTabClassName,
  focusClassName,
}: CalendarProps<TEvent>) {
  const visibleDays = getCalendarDays(controller.visibleRange);
  const timeGridDays = controller.view === "day" ? [controller.selectedDate] : visibleDays;
  const defaults = getRootClasses(variant);
  const effectivePreset: CalendarPreset = {
    ...preset,
    enabledViews: controller.config.enabledViews,
  };
  const layout = useCalendarLayout(controller.view, controller.config.layouts);
  const viewContent = layout === "monthGrid"
    ? (
      <MonthView
        controller={controller}
        entries={events}
        resources={resources}
        labels={labels}
        variant={variant}
        onEntryActivate={onEventActivate}
        renderEvent={renderEvent}
        formatTime={formatEventTime}
        formatLocation={formatEventLocation}
        getEventClassName={getEventClassName}
        showTooltip={showTooltip}
        renderTooltip={renderTooltip}
        maxVisibleEvents={controller.config.month.maxVisibleEvents}
      />
    )
    : layout === "monthAgenda"
      ? (
        <MonthAgenda
          controller={controller}
          entries={events}
          resources={resources}
          labels={labels}
          variant={variant}
          onEntryActivate={onEventActivate}
          renderEvent={renderEvent}
          formatTime={formatEventTime}
          formatLocation={formatEventLocation}
          getEventClassName={getEventClassName}
          showTooltip={showTooltip}
          renderTooltip={renderTooltip}
          maxVisibleEvents={controller.config.month.maxVisibleEvents}
        />
      )
      : layout === "dayStrip"
        ? (
          <DayStrip
            days={visibleDays}
            selectedDate={controller.selectedDate}
            entries={events}
            labels={labels}
            variant={variant}
            onDaySelect={controller.selectDate}
            onEntryActivate={onEventActivate}
            renderEvent={renderEvent}
            getEventClassName={getEventClassName}
            showTooltip={showTooltip}
            renderTooltip={renderTooltip}
            stickyHeader={controller.config.timeGrid.stickyHeader}
            stickyTimeAxis={controller.config.timeGrid.stickyTimeAxis}
            maxVisibleAllDayEvents={controller.config.timeGrid.maxVisibleAllDayEvents}
            minMinutes={controller.config.timeGrid.minMinutes}
            maxMinutes={controller.config.timeGrid.maxMinutes}
            slotDurationMinutes={controller.config.timeGrid.slotDurationMinutes}
            slotHeight={controller.config.timeGrid.slotHeight}
            minimumDayWidth={controller.config.timeGrid.minimumDayWidth}
          />
        )
      : layout === "timeGrid"
      ? (
        <TimeGrid
          days={timeGridDays}
          entries={events}
          labels={labels}
          variant={variant}
          onEntryActivate={onEventActivate}
          showDayHeaders
          selectedDate={controller.selectedDate}
          onDaySelect={controller.selectDate}
          renderEvent={renderEvent}
          getEventClassName={getEventClassName ? (event) => getEventClassName(event, "timeGrid") : undefined}
          showTooltip={showTooltip}
          renderTooltip={renderTooltip}
          stickyHeader={controller.config.timeGrid.stickyHeader}
          stickyTimeAxis={controller.config.timeGrid.stickyTimeAxis}
          maxVisibleAllDayEvents={controller.config.timeGrid.maxVisibleAllDayEvents}
          minMinutes={controller.config.timeGrid.minMinutes}
          maxMinutes={controller.config.timeGrid.maxMinutes}
          slotDurationMinutes={controller.config.timeGrid.slotDurationMinutes}
          slotHeight={controller.config.timeGrid.slotHeight}
          minimumDayWidth={controller.config.timeGrid.minimumDayWidth}
        />
      )
      : layout === "timeline"
        ? (
          <TimelineView
            controller={controller}
            entries={events}
            resources={resources ?? []}
            labels={labels}
            variant={variant}
            onEntryActivate={onEventActivate}
            renderEvent={renderEvent}
            getEventClassName={getEventClassName}
            formatEventTime={formatEventTime}
            minMinutes={controller.config.timeGrid.minMinutes}
            maxMinutes={controller.config.timeGrid.maxMinutes}
            stickyHeader={controller.config.timeGrid.stickyHeader}
          />
        )
        : layout === "resourceDayGrid"
          ? (
            <DayGridView
              controller={controller}
              entries={events}
              resources={resources ?? []}
              labels={labels}
              variant={variant}
              onEntryActivate={onEventActivate}
              renderEvent={renderEvent}
              getEventClassName={getEventClassName}
              formatEventTime={formatEventTime}
            />
          )
          : null;

  return (
    <CalendarRoot
      preset={effectivePreset}
      view={controller.view}
      date={controller.date}
      visibleRange={controller.visibleRange}
      layout={layout}
      labels={labels}
      onViewChange={controller.setView}
      onPrevious={controller.previous}
      onNext={controller.next}
      onToday={controller.today}
      themeClassName={themeClassName ?? defaults.themeClassName}
      controlClassName={controlClassName ?? defaults.controlClassName}
      activeTabClassName={activeTabClassName ?? defaults.activeTabClassName}
      inactiveTabClassName={inactiveTabClassName ?? defaults.inactiveTabClassName}
      focusClassName={focusClassName ?? defaults.focusClassName}
    >
      {viewContent}
    </CalendarRoot>
  );
}

export type { CalendarConfig };
