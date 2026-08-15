import { redirect } from "next/navigation";

interface Props { params: Promise<{ locale: string }> }

export default async function LegacyRegistrationManageAlias({ params }: Props) {
  const { locale } = await params;
  redirect(`/${locale}/events/registrations/manage`);
}
