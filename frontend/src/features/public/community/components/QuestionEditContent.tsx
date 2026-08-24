"use client";

import { useTranslations } from "next-intl";
import PageContainer from "@/components/layout/PageContainer";
import { QueryErrorState } from "@/components/public/states/QueryErrorState";
import { useAccountSession } from "@/features/public/account/AccountSessionProvider";
import { useOwnedCommunityQuestionQuery } from "../queries";
import { QuestionForm } from "./QuestionForm";

export function QuestionEditContent({ id }: { id: string }) {
  const t = useTranslations("Community");
  const session = useAccountSession();
  const query = useOwnedCommunityQuestionQuery(id, session.status === "authenticated");

  if (session.status === "loading" || query.isLoading) {
    return (
      <div className="min-h-screen bg-site-canvas pt-[72px]">
        <PageContainer width="reading">
          <div className="h-96 animate-pulse bg-site-surface" aria-label={t("loading")} />
        </PageContainer>
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="min-h-screen bg-site-canvas pt-[72px]">
        <PageContainer width="reading">
          <QueryErrorState
            title={t("questionNotFound")}
            description={t("loadErrorDescription")}
            retryLabel={t("retry")}
            onRetry={() => query.refetch()}
            isRetrying={query.isFetching}
          />
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-site-canvas pt-[72px]">
      <PageContainer width="reading">
        <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl font-medium text-site-foreground">{t("editQuestion")}</h1>
        <p className="mt-2 sm:mt-3 text-sm sm:text-base text-site-body">{t("editQuestionDescription")}</p>
        <div className="mt-8 sm:mt-10">
          <QuestionForm initial={query.data} />
        </div>
      </PageContainer>
    </div>
  );
}
