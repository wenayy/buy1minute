import { notFound } from "next/navigation";
import { SetupForm } from "../../components/SetupForm";
import { SiteFooter } from "../../components/SiteFooter";
import { SiteHeader } from "../../components/SiteHeader";
import { parseMinuteSlug } from "../../lib/time";

type PageProps = { params: Promise<{ slug: string }> };

export default async function SetupPage({ params }: PageProps) {
  const { slug } = await params;
  const index = parseMinuteSlug(slug);
  if (index === null) notFound();
  return (
    <main className="page-shell setup-page">
      <SiteHeader />
      <SetupForm minuteIndex={index} />
      <SiteFooter />
    </main>
  );
}

