import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { QuickStart } from "@/components/QuickStart";
import { Endpoints } from "@/components/Endpoints";
import { Playground } from "@/components/Playground";
import { Setup } from "@/components/Setup";
import { Community } from "@/components/Community";
import { Footer } from "@/components/Footer";

export function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <QuickStart />
        <Endpoints />
        <Playground />
        <Setup />
        <Community />
      </main>
      <Footer />
    </>
  );
}
