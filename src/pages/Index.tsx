
import { Hero } from "@/components/Hero";
import { TeacherShowcase } from "@/components/TeacherShowcase";
import { Features } from "@/components/Features";
import { HowItWorks } from "@/components/HowItWorks";
import { CallToAction } from "@/components/CallToAction";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <TeacherShowcase />
      <Features />
      <HowItWorks />
      <CallToAction />
    </div>
  );
};

export default Index;
