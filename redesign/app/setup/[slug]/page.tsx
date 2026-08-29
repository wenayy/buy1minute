import { notFound } from "next/navigation";
import { SetupForm } from "../../components/SetupForm";
import { SiteFooter } from "../../components/SiteFooter";
import { SiteHeader } from "../../components/SiteHeader";
import { parseMinuteSlug } from "../../lib/time";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ reservation?: string }>;
};

export default async function SetupPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { reservation } = await searchParams;
  const index = parseMinuteSlug(slug);
  if (index === null) {
    notFound();
    return null;
  }

  return (
    <main className="min-h-screen flex flex-col bg-[#08080a]">
      <SiteHeader />
      <div className="flex-1 flex items-center justify-center py-12">
        <SetupForm minuteIndex={index} reservationId={reservation ?? null} />
      </div>
      <SiteFooter />
    </main>
  );
}
