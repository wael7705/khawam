import { HeroSection } from '../components/HeroSection';
import { AboutSection } from '../components/AboutSection';
import { ProcessSection } from '../components/ProcessSection';
import { StatsCounter } from '../components/StatsCounter';
import { FeaturedWorks } from '../components/FeaturedWorks';

export function Home() {
  return (
    <main>
      <section id="home">
        <HeroSection />
      </section>
      <section id="about">
        <AboutSection />
      </section>
      <section id="process">
        <ProcessSection />
      </section>
      <StatsCounter />
      <section id="works">
        <FeaturedWorks />
      </section>
    </main>
  );
}
