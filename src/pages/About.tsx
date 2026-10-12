import SEO from "@/components/SEO";
import { DarkModeToggle } from "@/components/about/DarkModeToggle";
import { Hero } from "@/components/about/Hero";
import { WhoWeAre } from "@/components/about/WhoWeAre";
import { MissionVision } from "@/components/about/MissionVision";
import { Perks } from "@/components/about/Perks";
import { Team } from "@/components/about/Team";
import "@/styles/about.css";
import { useTeamMembers } from "@/hooks/useOptimizedData";

const About = () => {
  const { team, loading, error, refetch } = useTeamMembers();

  return (
    <div className="about-page bg-gray-50 dark:bg-gray-900 min-h-screen">
      <SEO
        title="About Electroo Buddy - Leading Electrical Service Provider in Ujjain"
        description="Learn about Electroo Buddy's team of certified electricians with years of experience. We provide reliable, affordable electrical services for residential and commercial needs in Ujjain."
        keywords="about electroo buddy, electrical company Ujjain, certified electricians, licensed electrical contractors, professional electricians, electrical service team"
        canonical="/about"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Electroo Buddy",
          "description": "Professional electrical service provider with certified and experienced electricians",
          "url": "https://electroobuddy.com",
          "logo": "https://electroobuddy.com/logo.png",
          "foundingDate": "1992",
          "areaServed": {
            "@type": "City",
            "name": "Ujjain"
          },
          "founder": {
            "@type": "Person",
            "name": "Electroo Buddy Team"
          },
          "employee": {
            "@type": "Thing",
            "description": "Team of certified electricians and electrical professionals"
          }
        }}
      />
      
      <DarkModeToggle />
      <Hero />
      <WhoWeAre />
      <MissionVision />
      <Perks />
      <Team members={team} loading={loading} error={error} onRetry={refetch} />
    </div>
  );
};

export default About;
