"use client";

import { useEffect } from "react";
import { useRouter } from "@/navigation";

export default function ImpressumRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/impressum");
  }, [router]);
  return null;
}
