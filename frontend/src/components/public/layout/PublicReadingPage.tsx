import type { ReactNode } from "react";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";

interface PublicReadingPageProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function PublicReadingPage({ title, subtitle, children }: PublicReadingPageProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-background">
      <PageHeader variant="reading" align="left" title={title} subtitle={subtitle} />
      <PageContainer width="reading">
        <article className="prose prose-lg max-w-none text-text-900 dark:prose-invert">
          {children}
        </article>
      </PageContainer>
    </div>
  );
}
