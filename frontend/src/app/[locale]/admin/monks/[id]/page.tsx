import React, { use } from "react";
import { MonkEditor } from "../_components/MonkEditor";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function MonkPage({ params }: PageProps) {
  const { id } = use(params);
  const isCreate = id === "create";

  return <MonkEditor id={isCreate ? undefined : id} />;
}
