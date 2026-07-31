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
    <div className="min-h-screen bg-[#fffef2]">
      <PageHeader variant="reading" align="left" title={title} subtitle={subtitle} />
      <PageContainer width="reading">
        <article className="prose prose-lg max-w-none text-[#333] prose-headings:font-heading prose-headings:text-[#333] prose-a:text-[#945c26]">
          {children}
        </article>
      </PageContainer>
    </div>
  );
}
