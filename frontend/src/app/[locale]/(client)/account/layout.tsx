import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NEXT_PUBLIC_PUBLIC_ACCOUNT_AUTH_ENABLED !== "true") notFound();
  return children;
}
