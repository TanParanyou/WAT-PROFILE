import { redirect } from "@/navigation";

export default async function ContactPageEditorRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: "/admin/website/pages/PAGE-CONTACT", locale });
}
