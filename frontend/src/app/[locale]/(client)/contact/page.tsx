import ContactContent from "./ContactContent";

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <ContactContent locale={locale} />;
}
