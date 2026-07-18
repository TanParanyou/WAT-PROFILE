import type { ReactNode } from "react";
import { EmptyState } from "@/components/public/states/EmptyState";
import { QueryErrorState } from "@/components/public/states/QueryErrorState";
import { useTranslations } from "next-intl";

interface PublicContentStateBoundaryProps {
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  hasData: boolean;
  onRetry: () => void;
  loading: ReactNode;
  children: ReactNode;
}

export function PublicContentStateBoundary({ isLoading, isError, isFetching, hasData, onRetry, loading, children }: PublicContentStateBoundaryProps) {
  const t = useTranslations("PublicState");
  if (isLoading) return <>{loading}</>;
  if (isError) return <QueryErrorState title={t("errorTitle")} description={t("errorDescription")} retryLabel={t("retry")} onRetry={onRetry} isRetrying={isFetching} />;
  if (!hasData) return <EmptyState title={t("emptyContent")} description={t("emptyContent")} />;
  return <>{children}</>;
}
