"use client";

import { useEffect } from "react";
import { useRouter } from "@/navigation";

export default function PrivacyRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/privacy");
  }, [router]);
  return null;
}
