import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Hero } from "@/components/Hero";
import { TeacherShowcase } from "@/components/TeacherShowcase";
import { Features } from "@/components/Features";
import { HowItWorks } from "@/components/HowItWorks";
import { CallToAction } from "@/components/CallToAction";
import { useAuth } from "@/contexts/auth-context";

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userRole, isLoading } = useAuth();
  
  // Create refs for different sections
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  
  // Redirect logged-in users to their respective dashboards
  useEffect(() => {
    if (!isLoading && user) {
      if (userRole === 'student') {
        navigate('/student/dashboard');
      } else if (userRole === 'teacher') {
        navigate('/teacher/dashboard');
      }
    }
  }, [user, userRole, isLoading, navigate]);
  
  // Scroll to section if hash is present in URL
  useEffect(() => {
    if (location.hash) {
      const sectionId = location.hash.substring(1); // Remove the # character
      const section = document.getElementById(sectionId);
      if (section) {
        setTimeout(() => {
          section.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [location.hash]);

  return (
    <Layout>
      <Hero />
      <TeacherShowcase />
      <div id="features" ref={featuresRef}>
        <Features />
      </div>
      <div id="how-it-works" ref={howItWorksRef}>
        <HowItWorks />
      </div>
      <CallToAction />
    </Layout>
  );
};

export default Index;
