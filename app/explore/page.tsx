import type { Metadata } from "next";
import { ExploreGrid } from "../components/ExploreGrid";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { seededOwnerships } from "../lib/seed-data";

export const metadata: Metadata = {
  title: "Explore all 1,440 minutes",
  description: "Find your minute in the Buy1Minute day.",
};

export default function ExplorePage() {
  return (
    <main className="page-shell explore-page">
      <SiteHeader />
      <section className="page-intro">
        <span className="eyebrow">THE ENTIRE DAY · UTC</span>
        <h1>1,440 chances<br />to own the internet.</h1>
        <div className="explore-stats">
          <span><strong>{seededOwnerships.length}</strong> owned</span>
          <span><strong>{1_440 - seededOwnerships.length}</strong> available</span>
          <span><strong>60 sec</strong> every day</span>
        </div>
      </section>
      <ExploreGrid />
      <SiteFooter />
    </main>
  );
}

