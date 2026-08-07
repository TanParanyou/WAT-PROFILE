"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { useSearchParams } from "next/navigation";
import { confirmGoogleLink } from "@/features/public/account/api";
import { useAccountSession } from "@/features/public/account/AccountSessionProvider";
import { buildAccountHref } from "../accountNavigation";
import { AccountFeedback } from "./AccountFeedback";
import { AccountFlowFooter } from "./AccountFlowFooter";

const actionClass =
  "inline-flex min-h-11 items-center justify-center bg-site-action px-6 py-[13px] font-semibold text-site-on-action transition-colors hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus";
const secondaryActionClass =
  "inline-flex min-h-11 items-center justify-center border border-site-border px-6 py-[13px] font-semibold text-site-foreground transition-colors hover:bg-site-canvas-strong focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus";

export function LinkAccountContent() {
  const t = useTranslations("Account");
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const token = searchParams.get("token") ?? "";
  const { adoptCurrentSession } = useAccountSession();
  const [state, setState] = useState<"approval_sent" | "confirming" | "success" | "invalid">(
    status === "approval_sent" ? "approval_sent" : token ? "confirming" : "invalid",
  );
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    if (state !== "confirming") return;
    confirmGoogleLink(token)
      .then(async () => {
        await adoptCurrentSession();
        setState("success");
      })
      .catch(() => setState("invalid"));
  }, [state, token, adoptCurrentSession]);

  if (state === "approval_sent") {
    return (
      <div className="space-y-4">
        <AccountFeedback
          state={{ kind: "success", title: t("link.approvalSentTitle"), body: t("link.approvalSentBody") }}
        />
        <AccountFlowFooter
          primary={
            <Link href="/account/login" className={actionClass}>
              {t("link.loginLink")}
            </Link>
          }
        />
      </div>
    );
  }

  if (state === "confirming") {
    return (
      <AccountFeedback state={{ kind: "loading", message: t("link.confirming") }} />
    );
  }

  if (state === "success") {
    return (
      <div className="space-y-4">
        <AccountFeedback state={{ kind: "success", title: t("link.successTitle"), body: t("link.successBody") }} />
        <AccountFlowFooter
          primary={
            <Link href={buildAccountHref("security")} className={actionClass}>
              {t("account.tabsSecurity")}
            </Link>
          }
          secondary={
            <Link href="/account" className={secondaryActionClass}>
              {t("account.title")}
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AccountFeedback state={{ kind: "error", message: `${t("link.invalidTitle")}. ${t("link.invalidBody")}` }} />
      <AccountFlowFooter
        primary={
          <Link href="/account/login" className={actionClass}>
            {t("link.loginLink")}
          </Link>
        }
        secondary={
          <Link href={buildAccountHref("security")} className={secondaryActionClass}>
            {t("account.tabsSecurity")}
          </Link>
        }
      />
    </div>
  );
}
