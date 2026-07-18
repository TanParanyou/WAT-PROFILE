"use client";

import { usePublicEventsQuery } from "@/features/public/events/queries";

export default function EventAlertModal() {
  usePublicEventsQuery(1);
  return null;
}
