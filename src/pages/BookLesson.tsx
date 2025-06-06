import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { BookingCalendar } from "@/components/BookingCalendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, Star, MapPin, Clock, BookOpen, GraduationCap, Languages, Monitor, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { TimeSlot } from "@/components/BookingCalendar";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

// Define teacher interface
interface Teacher {
  id: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  subject?: string;
  specialties?: string[];
  subjects?: string[];
  country?: string;
  country_flag?: string;
  countryFlag?: string;
  rating?: number;
  average_rating?: number;
  reviews?: number;
  reviews_count?: number;
  experience?: string;
  price?: string;
  hourly_rate?: number;
  bio?: string;
  education?: string;
  qualifications?: Record<string, any>;
  languages?: string[];
  teachingStyle?: string;
  avatar?: string;
  profile_picture_url?: string;
  timezone?: string;
  time_zone?: string;
}

const BookLesson = () => {
  const { teacherId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<{
    date: Date;
    slot: TimeSlot;
    moduleId?: string;
    moduleName?: string;
  } | null>(null);
  
  // Fetch real teacher data from Supabase
  useEffect(() => {
    const fetchTeacher = async () => {
      if (!teacherId) {
        setError("No teacher ID provided");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Get teacher data
        const { data, error } = await supabase
          .from('teachers')
          .select('*')
          .eq('id', teacherId)
          .single();
        
        if (error) {
          console.error("Error fetching teacher:", error);
          throw error;
        }
        
        if (!data) {
          throw new Error("Teacher not found");
        }
        
        console.log("Teacher data:", data);
        
        // Process teacher data
        const processedTeacher: Teacher = {
          id: data.id,
          name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
          first_name: data.first_name,
          last_name: data.last_name,
          subject: Array.isArray(data.subjects) && data.subjects.length > 0 
            ? data.subjects[0] 
            : "General",
          specialties: Array.isArray(data.subjects) ? data.subjects : [],
          subjects: Array.isArray(data.subjects) ? data.subjects : [],
          country: data.country || "Unknown",
          countryFlag: data.country_flag || "🌍",
          country_flag: data.country_flag,
          rating: data.average_rating || 4.5,
          average_rating: data.average_rating,
          reviews: data.reviews_count || 0,
          reviews_count: data.reviews_count,
          experience: data.experience || "New teacher",
          price: `$${data.hourly_rate || 25}/hour`,
          hourly_rate: data.hourly_rate,
          bio: data.bio || "No bio available",
          education: data.qualifications?.education || "Not specified",
          qualifications: data.qualifications,
          languages: data.qualifications?.languages || ["English"],
          teachingStyle: data.qualifications?.teaching_style || "Interactive",
          avatar: data.profile_picture_url,
          profile_picture_url: data.profile_picture_url,
          timezone: data.time_zone || "GMT",
          time_zone: data.time_zone
        };
        
        setTeacher(processedTeacher);
      } catch (err) {
        console.error("Failed to fetch teacher:", err);
        setError("Failed to load teacher data. Please try again later.");
        
        // Fallback to mock data if needed
        const mockTeacher: Teacher = {
          id: teacherId || "1",
          name: "Dr. Amara Okonkwo",
          subject: "Mathematics",
          specialties: ["Calculus", "Algebra", "Statistics"],
          country: "Nigeria",
          countryFlag: "🇳🇬",
          rating: 4.9,
          reviews: 127,
          experience: "8 years",
          price: "$25/hour",
          bio: "I'm a passionate mathematics teacher with a PhD in Applied Mathematics. I specialize in making complex mathematical concepts easy to understand through visualization and practical examples.",
          education: "PhD in Applied Mathematics, University of Lagos",
          languages: ["English", "Yoruba", "Igbo"],
          teachingStyle: "Interactive, Visual, Problem-solving focused",
          avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=100&h=100&fit=crop&crop=face",
          timezone: "WAT (UTC+1)"
        };
        
        setTeacher(mockTeacher);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeacher();
  }, [teacherId]);
  
  // Handle booking completion
  const handleBookingComplete = (teacherId: string, slot: TimeSlot, date: Date, moduleId?: string, moduleName?: string) => {
    // Store the booking details for confirmation dialog
    setBookingDetails({
      date,
      slot,
      moduleId,
      moduleName
    });
    
    // Show confirmation dialog
    setShowConfirmation(true);
  };
  
  // Navigate to the learning module or dashboard
  const handleNavigateAfterBooking = (destination: 'module' | 'dashboard') => {
    setShowConfirmation(false);
    
    if (destination === 'module' && bookingDetails?.moduleId) {
      // Navigate to the module page (if it exists)
      navigate(`/student/modules/${bookingDetails.moduleId}`);
    } else {
      // Navigate to dashboard
      navigate("/student/dashboard");
    }
  };
  
  if (loading) {
    return (
      <DashboardLayout userType="student">
        <div className="flex justify-center items-center h-64 flex-col gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
          <p className="text-gray-600">Loading teacher profile...</p>
        </div>
      </DashboardLayout>
    );
  }
  
  if (error || !teacher) {
    return (
      <DashboardLayout userType="student">
        <div className="flex justify-center items-center h-64 flex-col gap-4">
          <p className="text-red-500">{error || "Teacher not found"}</p>
          <Button variant="outline" onClick={() => navigate("/student/find-teachers")}>
            Return to Find Teachers
          </Button>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout userType="student">
      <div className="space-y-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Teacher Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Teacher Profile</CardTitle>
                <CardDescription>Details about your selected teacher</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={teacher.avatar || teacher.profile_picture_url} alt={teacher.name} />
                    <AvatarFallback className="bg-gradient-to-r from-purple-600 to-purple-700 text-white text-xl">
                      {teacher.name?.split(" ").map(n => n[0]).join("") || "TP"}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="mt-4 text-xl font-bold">{teacher.name}</h2>
                  <p className="text-emerald-600 font-medium">{teacher.subject} Teacher</p>
                  <div className="flex items-center mt-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="ml-1 font-medium">{teacher.rating || teacher.average_rating}</span>
                    <span className="text-sm text-gray-500 ml-1">({teacher.reviews || teacher.reviews_count || 0} reviews)</span>
                  </div>
                  <Badge variant="outline" className="mt-2 flex items-center gap-1">
                    <span>{teacher.countryFlag || teacher.country_flag || "🌍"}</span>
                    <span>{teacher.country || "Unknown"}</span>
                  </Badge>
                </div>
                
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex gap-3">
                    <GraduationCap className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium">Education</h3>
                      <p className="text-sm text-gray-600">{teacher.education || "Not specified"}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <BookOpen className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium">Experience</h3>
                      <p className="text-sm text-gray-600">{teacher.experience || "New teacher"}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Languages className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium">Languages</h3>
                      <p className="text-sm text-gray-600">{teacher.languages?.join(", ") || "English"}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Clock className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium">Timezone</h3>
                      <p className="text-sm text-gray-600">{teacher.timezone || teacher.time_zone || "GMT"}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Monitor className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium">Teaching Style</h3>
                      <p className="text-sm text-gray-600">{teacher.teachingStyle || "Interactive"}</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-2">About</h3>
                  <p className="text-sm text-gray-600">{teacher.bio || "No bio available"}</p>
                </div>
                
                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-2">Specialties</h3>
                  <div className="flex flex-wrap gap-2">
                    {(teacher.specialties || teacher.subjects || []).map((specialty, index) => (
                      <Badge key={index} variant="secondary">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Booking Calendar */}
          <div className="lg:col-span-2">
            <BookingCalendar 
              teacher={teacher} 
              onBookLesson={handleBookingComplete}
            />
          </div>
        </div>
      </div>
      
      {/* Booking Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Booking Confirmed!</DialogTitle>
            <DialogDescription>
              Your lesson has been scheduled successfully.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-4 mt-2 bg-green-50 rounded-lg border border-green-100">
            <div className="flex items-center gap-2 text-green-700 mb-2">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">What would you like to do next?</span>
            </div>
            
            {bookingDetails?.moduleId && (
              <p className="text-sm text-gray-600 mb-4">
                You've selected the module "{bookingDetails.moduleName}". Would you like to start learning now?
              </p>
            )}
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Button 
              variant="outline"
              onClick={() => handleNavigateAfterBooking('dashboard')}
            >
              Go to Dashboard
            </Button>
            
            {bookingDetails?.moduleId && (
              <Button 
                className="bg-gradient-to-r from-purple-600 to-purple-800"
                onClick={() => handleNavigateAfterBooking('module')}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Start Learning
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default BookLesson; 