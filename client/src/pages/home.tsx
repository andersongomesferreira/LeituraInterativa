import Hero from "@/components/home/hero";
import AgeRanges from "@/components/home/age-ranges";
import HowItWorks from "@/components/home/how-it-works";
import CharactersGallery from "@/components/home/characters-gallery";
import SubscriptionPlans from "@/components/home/subscription-plans";
import FAQ from "@/components/home/faq";
import CallToAction from "@/components/home/call-to-action";
import { Helmet } from "react-helmet";

const Home = () => {
  return (
    <>
      <Helmet>
        <title>LeiturinhaBot - Histórias infantis personalizadas</title>
        <meta name="description" content="Histórias infantis personalizadas em português brasileiro geradas por inteligência artificial." />
      </Helmet>
      
      <div className="flex flex-col">
        <Hero />
        <AgeRanges />
        <HowItWorks />
        <CharactersGallery />
        <SubscriptionPlans />
        <FAQ />
        <CallToAction />
      </div>
    </>
  );
};

export default Home;
