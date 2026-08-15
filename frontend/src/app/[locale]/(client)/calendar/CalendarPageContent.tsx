"use client";

import { useTranslations } from "next-intl";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";
import { PublicCalendarSection } from "@/features/calendar/integrations/wat/PublicCalendarSection";

export default function CalendarPageContent() {
  const t = useTranslations("CalendarPage");

  return (
    <div className="min-h-screen bg-site-canvas">
      <PageHeader variant="color" density="compact" align="left" title={t("title")} subtitle={t("subtitle")} />
      <PageContainer width="wide">
        <PublicCalendarSection />
      </PageContainer>
    </div>
  );
}
