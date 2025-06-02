
import { Star, MapPin, Clock, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

const featuredTeachers = [
  {
    id: 1,
    name: "Dr. Amara Okonkwo",
    subject: "Advanced Mathematics",
    country: "Nigeria",
    countryFlag: "🇳🇬",
    rating: 4.9,
    reviews: 127,
    experience: "8 years",
    price: "$25/hour",
    nextAvailable: "Today 3:00 PM EST",
    specialties: ["Calculus", "Algebra", "Statistics"],
    image: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=400&h=400&fit=crop&crop=face",
    verified: true
  },
  {
    id: 2,
    name: "Prof. Kwame Asante",
    subject: "English Literature",
    country: "Ghana",
    countryFlag: "🇬🇭",
    rating: 4.8,
    reviews: 89,
    experience: "12 years",
    price: "$22/hour",
    nextAvailable: "Tomorrow 10:00 AM EST",
    specialties: ["Creative Writing", "Grammar", "Poetry"],
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
    verified: true
  },
  {
    id: 3,
    name: "Dr. Fatima Hassan",
    subject: "Biology & Life Sciences",
    country: "Kenya",
    countryFlag: "🇰🇪",
    rating: 5.0,
    reviews: 156,
    experience: "10 years",
    price: "$28/hour",
    nextAvailable: "Today 7:00 PM EST",
    specialties: ["Molecular Biology", "Genetics", "Ecology"],
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face",
    verified: true
  }
];

export const TeacherShowcase = () => {
  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Meet Our Featured Teachers
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover exceptional educators from across Africa, each bringing unique expertise 
            and passion to transform your learning experience.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {featuredTeachers.map((teacher) => (
            <div 
              key={teacher.id} 
              className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              {/* Teacher Image */}
              <div className="relative">
                <img 
                  src={teacher.image} 
                  alt={teacher.name}
                  className="w-full h-48 object-cover"
                />
                {teacher.verified && (
                  <div className="absolute top-3 right-3 bg-emerald-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                    ✓ Verified
                  </div>
                )}
                <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  <span>{teacher.countryFlag}</span>
                  <span>{teacher.country}</span>
                </div>
              </div>

              {/* Teacher Info */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{teacher.name}</h3>
                    <p className="text-emerald-600 font-medium">{teacher.subject}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">{teacher.price}</div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{teacher.rating}</span>
                      <span className="text-xs text-gray-500">({teacher.reviews})</span>
                    </div>
                  </div>
                </div>

                {/* Specialties */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {teacher.specialties.slice(0, 2).map((specialty, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                    >
                      {specialty}
                    </span>
                  ))}
                  {teacher.specialties.length > 2 && (
                    <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-full">
                      +{teacher.specialties.length - 2} more
                    </span>
                  )}
                </div>

                {/* Quick Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <BookOpen className="h-4 w-4" />
                    <span>{teacher.experience} experience</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>Next: {teacher.nextAvailable}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                    Book Lesson
                  </Button>
                  <Button variant="outline" className="px-4">
                    View Profile
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Button variant="outline" size="lg" className="px-8">
            View All Teachers
          </Button>
        </div>
      </div>
    </section>
  );
};
