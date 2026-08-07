import { notFound } from "next/navigation";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NEXT_PUBLIC_PUBLIC_ACCOUNT_AUTH_ENABLED !== "true") notFound();
  return children;
}
