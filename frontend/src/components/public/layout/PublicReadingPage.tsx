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
    <div className="min-h-screen bg-site-canvas">
      <PageHeader variant="reading" align="left" title={title} subtitle={subtitle} />
      <PageContainer width="reading">
        <article className="prose prose-lg max-w-none text-site-foreground prose-headings:font-heading prose-headings:text-site-foreground prose-a:text-site-accent">
          {children}
        </article>
      </PageContainer>
    </div>
  );
}
