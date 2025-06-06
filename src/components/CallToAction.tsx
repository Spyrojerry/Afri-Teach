import { Button } from "@/components/ui/button";
import { ArrowRight, Users, BookOpen, Globe } from "lucide-react";
import { Link } from "react-router-dom";

export const CallToAction = () => {
  return (
    <section className="py-16 md:py-20 bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-20 h-20 border border-white/20 rounded-full"></div>
        <div className="absolute top-32 right-16 w-16 h-16 border border-white/20 rounded-full"></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 border border-white/20 rounded-full"></div>
        <div className="absolute bottom-32 right-1/3 w-12 h-12 border border-white/20 rounded-full"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Transform Your Learning Journey Today
          </h2>
          
          <p className="text-lg md:text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Connect with passionate African educators who bring real-world experience, 
            cultural insights, and personalized teaching to every lesson.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="flex flex-col items-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-3">
                <Users className="h-8 w-8" />
              </div>
              <div className="text-2xl font-bold">500+</div>
              <div className="text-purple-200 text-sm">Verified Teachers</div>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-3">
                <BookOpen className="h-8 w-8" />
              </div>
              <div className="text-2xl font-bold">10,000+</div>
              <div className="text-purple-200 text-sm">Lessons Completed</div>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-3">
                <Globe className="h-8 w-8" />
              </div>
              <div className="text-2xl font-bold">15+</div>
              <div className="text-purple-200 text-sm">African Countries</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/teachers">
              <Button 
                size="lg" 
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 text-lg font-medium group"
              >
                Start Learning Now
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            
            <Link to="/register">
              <Button 
                variant="outline" 
                size="lg" 
                className="border-white/30 text-white bg-white/10 px-8 py-4 text-lg font-medium"
              >
                Become a Teacher
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 pt-8 border-t border-white/20">
            <p className="text-purple-200 text-sm mb-4">Trusted by students worldwide</p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              <div className="text-xs font-medium">Stanford University</div>
              <div className="text-xs font-medium">MIT</div>
              <div className="text-xs font-medium">Harvard Extension</div>
              <div className="text-xs font-medium">UC Berkeley</div>
              <div className="text-xs font-medium">NYU</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
