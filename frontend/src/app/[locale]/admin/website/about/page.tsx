"use client";

import { useEffect } from "react";
import { useRouter } from "@/navigation";

export default function AboutRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/about");
  }, [router]);
  return null;
}
