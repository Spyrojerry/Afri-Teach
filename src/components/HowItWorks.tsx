
import { Search, Calendar, Video, Star } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Discover Teachers",
    description: "Browse our curated selection of verified African educators by subject, experience, and availability.",
    step: "01"
  },
  {
    icon: Calendar,
    title: "Book Your Lesson",
    description: "Choose a convenient time slot with automatic time zone conversion and secure payment processing.",
    step: "02"
  },
  {
    icon: Video,
    title: "Learn Together",
    description: "Join your HD virtual classroom and engage in personalized, interactive learning sessions.",
    step: "03"
  },
  {
    icon: Star,
    title: "Rate & Repeat",
    description: "Share feedback to help our community grow and book your next lesson with ease.",
    step: "04"
  }
];

export const HowItWorks = () => {
  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How AfriTeach Works
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Getting started is simple. In just four easy steps, you'll be connected 
            with world-class African educators ready to transform your learning journey.
          </p>
        </div>

        <div className="relative">
          {/* Connection Lines for Desktop */}
          <div className="hidden lg:block absolute top-16 left-1/2 transform -translate-x-1/2 w-3/4 h-0.5 bg-gradient-to-r from-emerald-200 via-blue-200 to-purple-200"></div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              
              return (
                <div key={index} className="relative text-center">
                  {/* Step Number */}
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-600 text-white rounded-full text-lg font-bold mb-6 relative z-10">
                    {step.step}
                  </div>

                  {/* Icon */}
                  <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-4 relative z-10">
                    <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="h-6 w-6 text-emerald-600" />
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {step.title}
                    </h3>
                    
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Mobile Connection Arrow */}
                  {index < steps.length - 1 && (
                    <div className="lg:hidden flex justify-center mt-4 mb-4">
                      <div className="w-0.5 h-8 bg-gray-200"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl p-8 md:p-12">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Ready to Start Learning?
            </h3>
            <p className="text-lg text-gray-600 mb-6 max-w-xl mx-auto">
              Join thousands of students who are already experiencing the power of 
              personalized education with African teachers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg font-medium transition-colors">
                Find Your Teacher
              </button>
              <button className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-8 py-3 rounded-lg font-medium transition-colors">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
