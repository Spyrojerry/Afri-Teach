
import { Clock, Shield, Globe, Video, Star, CreditCard } from "lucide-react";

const features = [
  {
    icon: Clock,
    title: "Smart Time Zone Matching",
    description: "Automatically converts schedules to your local time zone. Never miss a lesson due to confusion.",
    color: "emerald"
  },
  {
    icon: Shield,
    title: "Verified Educators",
    description: "All teachers undergo thorough background checks and qualification verification for your peace of mind.",
    color: "blue"
  },
  {
    icon: Video,
    title: "HD Virtual Classrooms",
    description: "Crystal-clear video calls with screen sharing, recording, and interactive tools for effective learning.",
    color: "purple"
  },
  {
    icon: Globe,
    title: "Cultural Learning Exchange",
    description: "Learn subjects while experiencing rich African cultures and perspectives that broaden your worldview.",
    color: "orange"
  },
  {
    icon: Star,
    title: "Quality Guarantee",
    description: "Our rating system and satisfaction guarantee ensure you receive exceptional educational experiences.",
    color: "yellow"
  },
  {
    icon: CreditCard,
    title: "Transparent Pricing",
    description: "Clear, upfront pricing with secure international payments. No hidden fees or surprises.",
    color: "green"
  }
];

const colorClasses = {
  emerald: "text-emerald-600 bg-emerald-50",
  blue: "text-blue-600 bg-blue-50",
  purple: "text-purple-600 bg-purple-50",
  orange: "text-orange-600 bg-orange-50",
  yellow: "text-yellow-600 bg-yellow-50",
  green: "text-green-600 bg-green-50"
};

export const Features = () => {
  return (
    <section className="py-16 md:py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why Choose AfriTeach?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We've designed every feature with your success in mind, creating a seamless 
            bridge between talented African educators and eager learners worldwide.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            const colorClass = colorClasses[feature.color as keyof typeof colorClasses];
            
            return (
              <div 
                key={index}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300"
              >
                <div className={`w-12 h-12 rounded-lg ${colorClass} flex items-center justify-center mb-4`}>
                  <IconComponent className="h-6 w-6" />
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
