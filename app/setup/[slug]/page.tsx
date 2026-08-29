import { notFound } from "next/navigation";
import { SetupForm } from "../../components/SetupForm";
import { SiteFooter } from "../../components/SiteFooter";
import { SiteHeader } from "../../components/SiteHeader";
import { parseMinuteSlug } from "../../lib/time";

type PageProps = { params: Promise<{ slug: string }>; searchParams: Promise<{ reservation?: string }> };

export default async function SetupPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { reservation } = await searchParams;
  const index = parseMinuteSlug(slug);
  if (index === null) notFound();
  return (
    <main className="page-shell setup-page">
      <SiteHeader />
      <SetupForm minuteIndex={index} reservationId={reservation ?? null} />
      <SiteFooter />
    </main>
  );
}
