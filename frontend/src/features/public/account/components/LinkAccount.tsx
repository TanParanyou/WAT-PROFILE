"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { useSearchParams } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { confirmGoogleLink } from "@/features/public/account/api";

export function LinkAccountContent() {
  const t = useTranslations("Account");
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const token = searchParams.get("token") ?? "";
  const [state, setState] = useState<"approval_sent" | "confirming" | "success" | "invalid">(
    status === "approval_sent" ? "approval_sent" : token ? "confirming" : "invalid",
  );
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    if (state !== "confirming") return;
    confirmGoogleLink(token)
      .then(() => setState("success"))
      .catch(() => setState("invalid"));
  }, [state, token]);

  if (state === "approval_sent") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-start gap-2 border border-emerald-700 bg-emerald-50 p-3 text-sm text-emerald-700"
      >
        <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <div>
          <p className="font-semibold">{t("link.approvalSentTitle")}</p>
          <p className="mt-1">{t("link.approvalSentBody")}</p>
        </div>
      </div>
    );
  }

  if (state === "confirming") {
    return (
      <div className="flex items-center gap-2 text-sm text-site-muted">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        <span>{t("link.confirming")}</span>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="space-y-4">
        <div
          role="status"
          aria-live="polite"
          className="flex items-start gap-2 border border-emerald-700 bg-emerald-50 p-3 text-sm text-emerald-700"
        >
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <div>
            <p className="font-semibold">{t("link.successTitle")}</p>
            <p className="mt-1">{t("link.successBody")}</p>
          </div>
        </div>
        <p>
          <Link
            href="/account"
            className="font-medium text-text-900 underline decoration-primary/40 underline-offset-4"
          >
            {t("link.loginLink")}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        role="alert"
        className="flex items-start gap-2 border border-red-700 bg-red-50 p-3 text-sm text-red-700"
      >
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <div>
          <p className="font-semibold">{t("link.invalidTitle")}</p>
          <p className="mt-1">{t("link.invalidBody")}</p>
        </div>
      </div>
      <p>
        <Link
          href="/account/login"
          className="font-medium text-text-900 underline decoration-primary/40 underline-offset-4"
        >
          {t("link.loginLink")}
        </Link>
      </p>
    </div>
  );
}
