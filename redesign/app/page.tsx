import type { Metadata } from "next";
import { LiveHomepage } from "./components/LiveHomepage";

export const metadata: Metadata = {
  title: "Buy1Minute — Own one minute of the internet",
  description: "Own a permanent minute and take over the homepage for 60 seconds every day.",
};

export default function Home() {
  return <LiveHomepage />;
}
