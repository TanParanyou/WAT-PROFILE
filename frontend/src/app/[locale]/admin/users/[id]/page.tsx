import React, { use } from "react";
import { UserEditor } from "../_components/UserEditor";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function UserPage({ params }: PageProps) {
  const { id } = use(params);
  const isCreate = id === "create";

  return <UserEditor id={isCreate ? undefined : id} />;
}
