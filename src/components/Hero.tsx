
import { Button } from "@/components/ui/button";
import { Search, MapPin, Clock, Star } from "lucide-react";

export const Hero = () => {
  return (
    <section className="relative bg-gradient-to-br from-blue-50 via-white to-emerald-50 py-12 md:py-20 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Column - Content */}
          <div className="text-center lg:text-left">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Connect with
              <span className="text-emerald-600 block">African Educators</span>
              <span className="text-blue-600">Learn Without Limits</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0">
              Bridge continents through education. Access skilled African teachers for personalized lessons, 
              anytime, anywhere. Quality education that transcends borders.
            </p>

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-6 mb-8">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <MapPin className="h-4 w-4 text-emerald-600" />
                <span>15+ African Countries</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>4.8/5 Average Rating</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Clock className="h-4 w-4 text-blue-600" />
                <span>24/7 Availability</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button 
                size="lg" 
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 text-base"
              >
                Find a Teacher
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3 text-base"
              >
                Become a Teacher
              </Button>
            </div>
          </div>

          {/* Right Column - Search Interface Preview */}
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Find Your Perfect Teacher</h3>
              
              {/* Search Form Preview */}
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Subject (e.g., Mathematics, English, Science)"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                
                <select className="w-full py-3 px-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                  <option>Grade Level</option>
                  <option>Elementary (K-5)</option>
                  <option>Middle School (6-8)</option>
                  <option>High School (9-12)</option>
                  <option>College/University</option>
                </select>

                <select className="w-full py-3 px-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                  <option>Preferred Time Zone</option>
                  <option>Eastern Time (ET)</option>
                  <option>Central Time (CT)</option>
                  <option>Mountain Time (MT)</option>
                  <option>Pacific Time (PT)</option>
                </select>

                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 py-3">
                  Search Teachers
                </Button>
              </div>

              {/* Preview Stats */}
              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">500+</div>
                  <div className="text-xs text-gray-600">Teachers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">50+</div>
                  <div className="text-xs text-gray-600">Subjects</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">98%</div>
                  <div className="text-xs text-gray-600">Success Rate</div>
                </div>
              </div>
            </div>

            {/* Floating elements for visual appeal */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-emerald-100 rounded-full opacity-60"></div>
            <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-blue-100 rounded-full opacity-60"></div>
          </div>
        </div>
      </div>
    </section>
  );
};
