
import { Button } from "@/components/ui/button";
import { Search, MapPin, Clock, Star, ArrowRight } from "lucide-react";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden w-full">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5Q0EzQUYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIxLjUiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40"></div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Column - Content */}
          <div className="text-center lg:text-left">
            <div className="mb-6">
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                🌍 Connecting Continents Through Education
              </span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight mb-6 lg:mb-8">
              Learn from
              <span className="block bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                African Educators
              </span>
              <span className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl text-gray-300">
                Anywhere, Anytime
              </span>
            </h1>
            
            <p className="text-lg lg:text-xl text-gray-300 mb-8 lg:mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Bridge continents through personalized education. Connect with skilled African teachers 
              for one-on-one lessons that transcend borders and transform learning.
            </p>

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-6 lg:gap-8 mb-8 lg:mb-10">
              <div className="flex items-center gap-3 text-gray-300">
                <div className="bg-emerald-500/20 p-2 rounded-lg">
                  <MapPin className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <div className="font-semibold text-white text-sm lg:text-base">15+ Countries</div>
                  <div className="text-xs lg:text-sm text-gray-400">African Teachers</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <div className="bg-yellow-500/20 p-2 rounded-lg">
                  <Star className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <div className="font-semibold text-white text-sm lg:text-base">4.9/5 Rating</div>
                  <div className="text-xs lg:text-sm text-gray-400">Student Satisfaction</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <div className="bg-blue-500/20 p-2 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <div className="font-semibold text-white text-sm lg:text-base">24/7 Access</div>
                  <div className="text-xs lg:text-sm text-gray-400">Flexible Scheduling</div>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-6 lg:px-8 py-3 lg:py-4 text-base lg:text-lg font-medium group shadow-xl"
              >
                Find Your Teacher
                <ArrowRight className="ml-2 h-4 w-4 lg:h-5 lg:w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-white/30 text-white hover:bg-white/10 px-6 lg:px-8 py-3 lg:py-4 text-base lg:text-lg font-medium backdrop-blur-sm"
              >
                Become a Teacher
              </Button>
            </div>
          </div>

          {/* Right Column - Search Interface Preview */}
          <div className="relative mt-8 lg:mt-0">
            <div className="bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl p-6 lg:p-8 border border-white/20 w-full max-w-lg mx-auto lg:max-w-none">
              <h3 className="text-xl lg:text-2xl font-semibold text-white mb-4 lg:mb-6">Find Your Perfect Teacher</h3>
              
              {/* Search Form Preview */}
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Subject (e.g., Mathematics, English, Science)"
                    className="w-full pl-12 pr-4 py-3 lg:py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm lg:text-base"
                  />
                </div>
                
                <select className="w-full py-3 lg:py-4 px-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm lg:text-base">
                  <option className="text-gray-900">Grade Level</option>
                  <option className="text-gray-900">Elementary (K-5)</option>
                  <option className="text-gray-900">Middle School (6-8)</option>
                  <option className="text-gray-900">High School (9-12)</option>
                  <option className="text-gray-900">College/University</option>
                </select>

                <select className="w-full py-3 lg:py-4 px-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm lg:text-base">
                  <option className="text-gray-900">Preferred Time Zone</option>
                  <option className="text-gray-900">Eastern Time (ET)</option>
                  <option className="text-gray-900">Central Time (CT)</option>
                  <option className="text-gray-900">Mountain Time (MT)</option>
                  <option className="text-gray-900">Pacific Time (PT)</option>
                </select>

                <Button className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 py-3 lg:py-4 text-base lg:text-lg font-medium shadow-xl">
                  Search Teachers
                </Button>
              </div>

              {/* Preview Stats */}
              <div className="grid grid-cols-3 gap-4 lg:gap-6 mt-6 lg:mt-8 pt-4 lg:pt-6 border-t border-white/20">
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">500+</div>
                  <div className="text-xs lg:text-sm text-gray-300">Teachers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">50+</div>
                  <div className="text-xs lg:text-sm text-gray-300">Subjects</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">98%</div>
                  <div className="text-xs lg:text-sm text-gray-300">Success Rate</div>
                </div>
              </div>
            </div>

            {/* Floating elements for visual appeal */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-emerald-400/20 rounded-full blur-xl"></div>
            <div className="absolute -bottom-8 -left-8 w-20 h-20 bg-blue-400/20 rounded-full blur-xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
};
