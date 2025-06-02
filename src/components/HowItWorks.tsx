
import { Search, Calendar, Video, Star } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Search,
    title: "Find Your Perfect Teacher",
    description: "Browse our curated selection of qualified African educators. Filter by subject, experience level, and availability to find the perfect match for your learning goals."
  },
  {
    number: "02", 
    icon: Calendar,
    title: "Schedule Your Lesson",
    description: "Book lessons at times that work for you. Our smart scheduling system automatically handles time zone conversions between you and your teacher."
  },
  {
    number: "03",
    icon: Video,
    title: "Learn in HD Virtual Classrooms",
    description: "Join high-quality video lessons with interactive tools, screen sharing, and recording capabilities. Learn from anywhere with just an internet connection."
  },
  {
    number: "04",
    icon: Star,
    title: "Rate & Continue Learning",
    description: "Provide feedback to help our community grow. Track your progress, schedule follow-up lessons, and build lasting educational relationships."
  }
];

export const HowItWorks = () => {
  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How AfriTeach Works
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Getting started is simple. Follow these four easy steps to begin your 
            personalized learning journey with expert African educators.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            
            return (
              <div key={index} className="text-center group">
                <div className="relative mb-6">
                  <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className="h-8 w-8" />
                  </div>
                  
                  <div className="absolute -top-2 -right-2 bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 text-white text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center">
                    {step.number}
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {step.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
