"use client";

import { useEffect } from "react";
import { useRouter } from "@/navigation";

export default function ContactRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/contact");
  }, [router]);
  return null;
}
