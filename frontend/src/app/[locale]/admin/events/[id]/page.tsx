"use client";

import React, { use } from "react";
import { EventEditor } from "../_components/EventEditor";

export default function EventDynamicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  
  const isCreate = id === "create";

  return <EventEditor id={isCreate ? undefined : id} />;
}
