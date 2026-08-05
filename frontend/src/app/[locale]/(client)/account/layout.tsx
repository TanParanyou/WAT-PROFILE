import { notFound } from "next/navigation";
import { AccountShell } from "@/features/public/account/components/AccountShell";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NEXT_PUBLIC_PUBLIC_ACCOUNT_AUTH_ENABLED !== "true") notFound();
  return <AccountShell>{children}</AccountShell>;
}
