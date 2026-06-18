import { useEffect, useState } from "react";
import { BookOpen, Clock, Loader2, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface FeaturedTeacher {
  id: string;
  name: string;
  subjects: string[];
  country: string;
  countryFlag: string;
  rating: number;
  reviews: number;
  experience: string;
  hourlyRate: number;
  image?: string;
  verified: boolean;
}

const asString = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;

const asNumber = (value: unknown, fallback = 0) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const asStringArray = (value: unknown) =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

export const TeacherShowcase = () => {
  const [teachers, setTeachers] = useState<FeaturedTeacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedTeachers = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: queryError } = await supabase
          .from("teachers")
          .select("*")
          .limit(12);

        if (queryError) throw queryError;

        const featured = (Array.isArray(data) ? data : [])
          .map((row: Record<string, unknown>): FeaturedTeacher => {
            const firstName = asString(row.first_name, "AfriTeach");
            const lastName = asString(row.last_name, "Teacher");

            return {
              id: asString(row.id),
              name: `${firstName} ${lastName}`.trim(),
              subjects: asStringArray(row.subjects),
              country: asString(row.country, "Africa"),
              countryFlag: asString(row.country_flag, "🌍"),
              rating: asNumber(row.average_rating),
              reviews: asNumber(row.reviews_count),
              experience: asString(row.experience, "New teacher"),
              hourlyRate: asNumber(row.hourly_rate),
              image: asString(row.profile_picture_url) || undefined,
              verified: row.is_verified === true,
            };
          })
          .filter((teacher) => teacher.id)
          .sort((a, b) => {
            if (a.verified !== b.verified) return Number(b.verified) - Number(a.verified);
            return b.rating - a.rating;
          })
          .slice(0, 3);

        setTeachers(featured);
      } catch (fetchError) {
        console.error("Failed to load featured teachers:", fetchError);
        setError("Featured teachers are temporarily unavailable.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedTeachers();
  }, []);

  const getLoginLinkState = (teacherId: string) => ({
    from: { pathname: `/student/book-lesson/${teacherId}` },
  });

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

        {isLoading ? (
          <div className="flex min-h-64 items-center justify-center text-gray-600">
            <Loader2 className="mr-2 h-6 w-6 animate-spin text-emerald-600" />
            Loading featured teachers...
          </div>
        ) : error ? (
          <div className="min-h-40 rounded-xl border border-red-100 bg-red-50 p-8 text-center text-red-700">
            {error}
          </div>
        ) : teachers.length === 0 ? (
          <div className="min-h-40 rounded-xl border border-gray-200 bg-gray-50 p-8 text-center text-gray-600">
            No teacher profiles are available yet. Please check back soon.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {teachers.map((teacher) => (
              <div
                key={teacher.id}
                className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                <div className="relative h-48 bg-gradient-to-br from-purple-100 via-emerald-50 to-blue-100">
                  {teacher.image ? (
                    <img
                      src={teacher.image}
                      alt={teacher.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-5xl font-bold text-purple-700">
                      {teacher.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}
                    </div>
                  )}
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

                <div className="p-6">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{teacher.name}</h3>
                      <p className="text-emerald-600 font-medium">
                        {teacher.subjects[0] || "General Education"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-lg font-bold text-gray-900">
                        {teacher.hourlyRate > 0 ? `$${teacher.hourlyRate}/hour` : "Rate on request"}
                      </div>
                      <div className="flex items-center justify-end gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">
                          {teacher.rating > 0 ? teacher.rating.toFixed(1) : "New"}
                        </span>
                        {teacher.reviews > 0 && (
                          <span className="text-xs text-gray-500">({teacher.reviews})</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {teacher.subjects.slice(0, 2).map((subject) => (
                      <span key={subject} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                        {subject}
                      </span>
                    ))}
                    {teacher.subjects.length > 2 && (
                      <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-full">
                        +{teacher.subjects.length - 2} more
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <BookOpen className="h-4 w-4" />
                      <span>{teacher.experience}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>View profile for current availability</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      to="/login"
                      state={getLoginLinkState(teacher.id)}
                      className="flex-1"
                    >
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                        Book Lesson
                      </Button>
                    </Link>
                    <Link to="/login" state={getLoginLinkState(teacher.id)}>
                      <Button variant="outline" className="px-4">
                        View Profile
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-10">
          <Link to="/teachers">
            <Button variant="outline" size="lg" className="px-8">
              View All Teachers
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
