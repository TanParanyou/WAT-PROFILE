import React, { use } from "react";
import { ChantingEditor } from "../_components/ChantingEditor";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AdminChantingDynamicPage({ params }: PageProps) {
  const { id } = use(params);
  const isCreate = id === "create" || id === "new";

  return <ChantingEditor id={isCreate ? undefined : id} />;
}
