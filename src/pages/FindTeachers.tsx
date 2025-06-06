import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, Search, Filter, MapPin, Clock, BookOpen, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Teacher interface
interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
  profile_picture_url?: string;
  subjects: string[];
  experience: string;
  average_rating: number;
  hourly_rate: number;
  time_zone: string;
  country: string;
  country_flag: string;
  reviews_count: number;
}

interface FindTeachersProps {
  isPublic?: boolean;
  onProtectedAction?: (action: string) => boolean;
}

const FindTeachers = ({ isPublic = false, onProtectedAction }: FindTeachersProps) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch teachers data from Supabase
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching teachers data...");
        
        // Get all teachers
        const { data, error } = await supabase
          .from('teachers')
          .select('*');
        
        if (error) {
          console.error("Database error:", error);
          throw error;
        }
        
        console.log("Raw teachers data:", data);
        
        if (!data || data.length === 0) {
          console.log("No teachers found in database");
          setTeachers([]);
          setFilteredTeachers([]);
          return;
        }
        
        // Process the teachers data with safer approach
        if (!Array.isArray(data)) {
          console.error("Expected array of teachers but got:", data);
          throw new Error("Invalid data format received from database");
        }
        
        const processedTeachers = data
          .map((teacher: { 
            id?: string; 
            first_name?: string; 
            last_name?: string; 
            profile_picture_url?: string;
            subjects?: string[];
            experience?: string;
            average_rating?: number;
            hourly_rate?: number;
            time_zone?: string;
            country?: string;
            country_flag?: string;
            reviews_count?: number;
          }) => {
            // Create teacher object with safe property access
            return {
              id: typeof teacher.id === 'string' ? teacher.id : "",
              first_name: typeof teacher.first_name === 'string' ? teacher.first_name : "Unknown",
              last_name: typeof teacher.last_name === 'string' ? teacher.last_name : "Teacher",
              profile_picture_url: typeof teacher.profile_picture_url === 'string' ? teacher.profile_picture_url : undefined,
              subjects: Array.isArray(teacher.subjects) ? teacher.subjects : [],
              experience: typeof teacher.experience === 'string' ? teacher.experience : "New teacher",
              average_rating: typeof teacher.average_rating === 'number' ? teacher.average_rating : 4.5,
              hourly_rate: typeof teacher.hourly_rate === 'number' ? teacher.hourly_rate : 25,
              time_zone: typeof teacher.time_zone === 'string' ? teacher.time_zone : "GMT",
              country: typeof teacher.country === 'string' ? teacher.country : "Unknown",
              country_flag: typeof teacher.country_flag === 'string' ? teacher.country_flag : "🌍",
              reviews_count: typeof teacher.reviews_count === 'number' ? teacher.reviews_count : Math.floor(Math.random() * 100) + 1
            } as Teacher;
          });
        
        console.log("Processed teachers:", processedTeachers);
        setTeachers(processedTeachers);
        setFilteredTeachers(processedTeachers);
      } catch (err) {
        console.error("Failed to fetch teachers:", err);
        setError("Failed to load teachers data. Please try again later.");
        
        // Fallback to mock data for testing
        console.log("Using mock teacher data as fallback");
        const mockTeachers = getMockTeachers();
        setTeachers(mockTeachers);
        setFilteredTeachers(mockTeachers);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTeachers();
  }, []);
  
  // Mock teachers data for fallback/testing
  const getMockTeachers = (): Teacher[] => {
    return [
      {
        id: "1",
        first_name: "Amara",
        last_name: "Okonkwo",
        profile_picture_url: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=100&h=100&fit=crop&crop=face",
        subjects: ["Calculus", "Algebra", "Statistics"],
        country: "Nigeria",
        country_flag: "🇳🇬",
        average_rating: 4.9,
        reviews_count: 127,
        experience: "8 years",
        hourly_rate: 25,
        time_zone: "Africa/Lagos"
      },
      {
        id: "2",
        first_name: "Kwame",
        last_name: "Asante",
        profile_picture_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
        subjects: ["Mechanics", "Quantum Physics", "Electromagnetism"],
        country: "Ghana",
        country_flag: "🇬🇭",
        average_rating: 4.8,
        reviews_count: 93,
        experience: "12 years",
        hourly_rate: 30,
        time_zone: "Africa/Accra"
      },
      {
        id: "3",
        first_name: "Fatima",
        last_name: "Hassan",
        profile_picture_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face",
        subjects: ["Molecular Biology", "Genetics", "Ecology"],
        country: "Kenya",
        country_flag: "🇰🇪",
        average_rating: 4.7,
        reviews_count: 85,
        experience: "6 years",
        hourly_rate: 22,
        time_zone: "Africa/Nairobi"
      }
    ];
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      setFilteredTeachers(teachers);
      return;
    }
    
    // Filter teachers based on search query
    const filtered = teachers.filter(teacher => 
      `${teacher.first_name} ${teacher.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.subjects.some(subject => 
        subject.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
    
    setFilteredTeachers(filtered);
  };

  // Handle booking a lesson with a teacher
  const handleBookLesson = (teacherId: string) => {
    if (isPublic && onProtectedAction) {
      // If in public mode, check if the action is allowed
      const canProceed = onProtectedAction('book-lesson');
      if (!canProceed) return;
    }
    navigate(`/student/book-lesson/${teacherId}`);
  };

  // Handle viewing a teacher's profile
  const handleViewProfile = (teacherId: string) => {
    if (isPublic && onProtectedAction) {
      // If in public mode, check if the action is allowed
      const canProceed = onProtectedAction('view-profile');
      if (!canProceed) return;
    }
    navigate(`/student/book-lesson/${teacherId}`);
  };

  // Get next available time (would come from availability in real app)
  const getNextAvailable = (teacher: Teacher) => {
    // Random availability for demo
    const randomHour = Math.floor(Math.random() * 12) + 8;
    const isToday = Math.random() > 0.5;
    return isToday 
      ? `Today ${randomHour}:00 ${randomHour >= 12 ? 'PM' : 'AM'}`
      : `Tomorrow ${randomHour}:00 ${randomHour >= 12 ? 'PM' : 'AM'}`;
  };

  return (
    <DashboardLayout userType="student">
      <div className="container mx-auto py-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Find Teachers</h1>
          <p className="text-gray-500">Discover and connect with expert teachers from across Africa</p>
        </div>
        
        {/* Search and Filter */}
        <Card className="bg-white">
          <CardContent className="p-4">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by subject, name, or specialty..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit" className="bg-gradient-to-r from-purple-600 to-purple-800">
                Search
              </Button>
              <Button type="button" variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </form>
          </CardContent>
        </Card>
        
        {/* Loading, Error, or Results */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            <span className="ml-2 text-gray-600">Loading teachers...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeachers.length > 0 ? (
              filteredTeachers.map(teacher => (
                <Card key={teacher.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    <div className="p-4 flex items-start space-x-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={teacher.profile_picture_url} alt={`${teacher.first_name} ${teacher.last_name}`} />
                        <AvatarFallback className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                          {teacher.first_name[0]}{teacher.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{teacher.first_name} {teacher.last_name}</h3>
                            <p className="text-sm text-emerald-600">
                              {teacher.subjects.length > 0 
                                ? teacher.subjects[0] 
                                : "Teacher"}
                            </p>
                          </div>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <span>{teacher.country_flag}</span>
                            <span>{teacher.country}</span>
                          </Badge>
                        </div>
                        <div className="flex items-center mt-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium ml-1">{teacher.average_rating.toFixed(1)}</span>
                          <span className="text-xs text-gray-500 ml-1">({teacher.reviews_count} reviews)</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="px-4 pb-2">
                      <div className="flex flex-wrap gap-1 mb-3">
                        {teacher.subjects.map((specialty, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          <span>{teacher.experience}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{getNextAvailable(teacher)}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                        <div className="text-lg font-bold">${teacher.hourly_rate}/hour</div>
                        <div className="flex gap-2">
                          <Button 
                            className="bg-gradient-to-r from-purple-600 to-purple-800"
                            onClick={() => handleViewProfile(teacher.id)}
                          >
                            View Profile
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">No teachers found matching your search criteria.</p>
                <Button 
                  variant="link" 
                  onClick={() => {
                    setSearchQuery("");
                    setFilteredTeachers(teachers);
                  }}
                >
                  Clear search
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default FindTeachers;