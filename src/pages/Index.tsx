
import { Layout } from "@/components/Layout";
import { Hero } from "@/components/Hero";
import { TeacherShowcase } from "@/components/TeacherShowcase";
import { Features } from "@/components/Features";
import { HowItWorks } from "@/components/HowItWorks";
import { CallToAction } from "@/components/CallToAction";

const Index = () => {
  return (
    <Layout>
      <Hero />
      <TeacherShowcase />
      <Features />
      <HowItWorks />
      <CallToAction />
    </Layout>
  );
};

export default Index;
