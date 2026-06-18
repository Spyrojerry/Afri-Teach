import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Calendar } from "@/components/ui/calendar";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  CalendarDays, 
  Clock, 
  Video, 
  Info, 
  Calendar as CalendarIcon, 
  ListTodo,
  Loader2
} from "lucide-react";
import { 
  format, 
  isSameDay, 
  parseISO, 
  isPast, 
  isToday, 
  addDays, 
  startOfToday 
} from "date-fns";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

// Define types for lesson and teacher
interface Teacher {
  id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
  profile_picture_url?: string;
  subject: string;
  timezone?: string;
}

interface Lesson {
  id: string | number;
  date: string; // ISO date string
  startTime: string;
  endTime: string;
  status: "upcoming" | "completed" | "cancelled";
  teacher: Teacher;
  meetingLink?: string;
  notes?: string;
}

// Define an interface for the booking data structure
interface BookingData {
  id: string | number;
  start_time?: string;
  end_time?: string;
  start_time_utc?: string;
  end_time_utc?: string;
  status?: string;
  notes?: string;
  meeting_link?: string;
  teacher_id?: string;
  created_at?: string;
}

// Define an interface for the teacher data structure
interface TeacherData {
  id: string;
  first_name?: string;
  last_name?: string;
  profile_picture_url?: string;
  subjects?: string[];
  time_zone?: string;
}

const StudentLessons = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [filteredLessons, setFilteredLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch real booking data from Supabase
  useEffect(() => {
    const fetchLessons = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        console.log("Fetching lessons for student:", user.id);
        
        // Get bookings for this student - using minimal columns to avoid errors
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            id,
            teacher_id,
            student_id,
            status,
            subject,
            notes,
            meeting_link,
            start_time_utc,
            end_time_utc,
            created_at
          `)
          .eq('student_id', user.id);
        
        if (error) {
          console.error("Error fetching bookings:", error);
          throw error;
        }
        
        console.log("Raw bookings data:", data);
        
        if (!data || data.length === 0) {
          console.log("No bookings found for this student");
          setLessons([]);
          setFilteredLessons([]);
          setIsLoading(false);
          return;
        }
        
        // Get unique teacher IDs from bookings with null checks
        const teacherIds = [...new Set(data
          .map(booking => booking?.teacher_id)
          .filter(id => id !== null && id !== undefined)
        )];
        
        // Fetch teacher data
        const { data: teachersData, error: teachersError } = await supabase
          .from('teachers')
          .select('id, first_name, last_name, profile_picture_url, subjects, time_zone')
          .in('id', teacherIds);
        
        // Type assertion for teachers
        const teachers = teachersData as any[];
        
        if (teachersError) {
          console.error("Error fetching teachers:", teachersError);
          throw teachersError;
        }
        
        console.log("Teachers data:", teachers);
        
        // Transform bookings to lessons
        const processedLessons: Lesson[] = data.map(booking => {
          // Find teacher for this booking
          const teacher = teachers?.find(t => t.id === booking.teacher_id) || {
            id: booking.teacher_id || "unknown",
            first_name: "Unknown",
            last_name: "Teacher",
            subjects: []
          };
          
          // Extract date and time from booking
          const start = new Date(booking.start_time_utc);
          const end = new Date(booking.end_time_utc);
          const bookingDate = start.toISOString().slice(0, 10);
          const startTime = start.toTimeString().slice(0, 5);
          const endTime = end.toTimeString().slice(0, 5);

          let status: "upcoming" | "completed" | "cancelled" = "upcoming";
          if (booking.status === "completed" || end < new Date()) {
            status = "completed";
          } else if (booking.status === "cancelled") {
            status = "cancelled";
          }
          
          // Use teacher's first subject or default to "General"
          const subjectFromTeacher = 
            Array.isArray(teacher.subjects) && teacher.subjects.length > 0 
              ? teacher.subjects[0] 
              : "General";
          
          return {
            id: booking.id,
            date: bookingDate,
            startTime: startTime,
            endTime: endTime,
            status: status,
            teacher: {
              id: teacher.id,
              name: `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim() || 'Unknown Teacher',
              first_name: teacher.first_name,
              last_name: teacher.last_name,
              avatar: teacher.profile_picture_url,
              profile_picture_url: teacher.profile_picture_url,
              subject: booking.subject || subjectFromTeacher,
              timezone: teacher.time_zone
            },
            meetingLink: booking.meeting_link,
            notes: booking.notes
          };
        });
        
        console.log("Processed lessons:", processedLessons);
        setLessons(processedLessons);
      } catch (err) {
        console.error("Error fetching lessons:", err);
        setError("Failed to load your lessons. Please try again later.");
        
        setLessons([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLessons();
  }, [user?.id]);

  // Filter lessons based on active tab and selected date
  useEffect(() => {
    let filtered = [...lessons];
    
    // Filter by tab
    if (activeTab === "upcoming") {
      filtered = filtered.filter(lesson => !isPast(parseISO(`${lesson.date}T${lesson.endTime}`)) || isToday(parseISO(lesson.date)));
    } else if (activeTab === "past") {
      filtered = filtered.filter(lesson => isPast(parseISO(`${lesson.date}T${lesson.endTime}`)) && !isToday(parseISO(lesson.date)));
    }
    
    // Filter by selected date if applicable
    if (selectedDate) {
      filtered = filtered.filter(lesson => isSameDay(parseISO(lesson.date), selectedDate));
    }
    
    setFilteredLessons(filtered);
  }, [lessons, activeTab, selectedDate]);

  // Format time to AM/PM
  const formatTimeDisplay = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hourNum = parseInt(hours, 10);
    const period = hourNum >= 12 ? 'PM' : 'AM';
    const hour12 = hourNum % 12 === 0 ? 12 : hourNum % 12;
    return `${hour12}:${minutes} ${period}`;
  };

  // Check if a date has lessons scheduled
  const hasLessons = (date: Date) => {
    return lessons.some(lesson => isSameDay(parseISO(lesson.date), date));
  };

  // Get status badge
  const getStatusBadge = (status: Lesson['status']) => {
    switch (status) {
      case 'upcoming':
        return <Badge className="bg-blue-500">Upcoming</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500">Cancelled</Badge>;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout userType="student">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold mb-6">My Lessons</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Section */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-purple-600" />
                Lesson Calendar
              </CardTitle>
              <CardDescription>
                View your scheduled lessons across different dates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                modifiers={{
                  hasLesson: (date) => hasLessons(date)
                }}
                modifiersClassNames={{
                  hasLesson: "bg-purple-50 text-purple-600 font-bold border border-purple-200"
                }}
              />
              
              <div className="mt-4 text-sm text-center text-gray-500">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-200 border border-purple-300"></div>
                  <span>Dates with scheduled lessons</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Lessons List Section */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex items-center justify-between mb-4">
                <TabsList>
                  <TabsTrigger value="upcoming" className="flex items-center gap-1">
                    <CalendarIcon className="h-4 w-4" />
                    Upcoming
                  </TabsTrigger>
                  <TabsTrigger value="past" className="flex items-center gap-1">
                    <ListTodo className="h-4 w-4" />
                    Past Lessons
                  </TabsTrigger>
                </TabsList>
                
                {selectedDate && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedDate(undefined)}
                    className="text-sm"
                  >
                    Clear date filter
                  </Button>
                )}
              </div>
              
              <TabsContent value="upcoming" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming Lessons</CardTitle>
                    <CardDescription>
                      Your scheduled lessons that are coming up
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {filteredLessons.length > 0 ? (
                      <div className="space-y-4">
                        {filteredLessons.map(lesson => (
                          <Card key={lesson.id} className="overflow-hidden">
                            <div className="p-4 border-b bg-gradient-to-r from-purple-50 to-indigo-50">
                              <div className="flex justify-between items-center">
                                <div>
                                  <h3 className="font-semibold">{lesson.teacher.subject}</h3>
                                  <p className="text-sm text-gray-500">
                                    {format(parseISO(lesson.date), 'EEEE, MMMM d, yyyy')}
                                  </p>
                                </div>
                                {getStatusBadge(lesson.status)}
                              </div>
                            </div>
                            <div className="p-4">
                              <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12 border-2 border-purple-100">
                                  <AvatarImage src={lesson.teacher.avatar} alt={lesson.teacher.name} />
                                  <AvatarFallback>
                                    {lesson.teacher.name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h4 className="font-medium">{lesson.teacher.name}</h4>
                                  <div className="flex items-center text-sm text-gray-500">
                                    <Clock className="h-3.5 w-3.5 mr-1" />
                                    {formatTimeDisplay(lesson.startTime)} - {formatTimeDisplay(lesson.endTime)} 
                                    <span className="mx-1">•</span>
                                    {lesson.teacher.timezone}
                                  </div>
                                </div>
                              </div>
                              
                              {lesson.meetingLink && lesson.status === 'upcoming' && (
                                <div className="mt-4">
                                  <Button
                                    className="w-full sm:w-auto"
                                    size="sm"
                                    onClick={() => navigate(`/student/classroom/${lesson.id}`)}
                                  >
                                    <Video className="h-4 w-4 mr-2" />
                                    Join Lesson
                                  </Button>
                                </div>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-gray-50 rounded-lg">
                        <Info className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                        <h3 className="text-lg font-medium text-gray-600">No upcoming lessons</h3>
                        <p className="text-gray-500 mt-1">
                          {selectedDate 
                            ? `No lessons scheduled for ${format(selectedDate, 'MMMM d, yyyy')}`
                            : "You don't have any upcoming lessons scheduled"}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="past" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Past Lessons</CardTitle>
                    <CardDescription>
                      Review your completed and cancelled lessons
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {filteredLessons.length > 0 ? (
                      <div className="space-y-4">
                        {filteredLessons.map(lesson => (
                          <Card key={lesson.id} className="overflow-hidden">
                            <div className="p-4 border-b bg-gradient-to-r from-gray-50 to-slate-50">
                              <div className="flex justify-between items-center">
                                <div>
                                  <h3 className="font-semibold">{lesson.teacher.subject}</h3>
                                  <p className="text-sm text-gray-500">
                                    {format(parseISO(lesson.date), 'EEEE, MMMM d, yyyy')}
                                  </p>
                                </div>
                                {getStatusBadge(lesson.status)}
                              </div>
                            </div>
                            <div className="p-4">
                              <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12 border-2 border-gray-100">
                                  <AvatarImage src={lesson.teacher.avatar} alt={lesson.teacher.name} />
                                  <AvatarFallback>
                                    {lesson.teacher.name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h4 className="font-medium">{lesson.teacher.name}</h4>
                                  <div className="flex items-center text-sm text-gray-500">
                                    <Clock className="h-3.5 w-3.5 mr-1" />
                                    {formatTimeDisplay(lesson.startTime)} - {formatTimeDisplay(lesson.endTime)}
                                  </div>
                                </div>
                              </div>
                              
                              {lesson.notes && (
                                <div className="mt-3 p-3 bg-gray-50 rounded-md text-sm">
                                  <p className="font-medium mb-1">Lesson Notes:</p>
                                  <p className="text-gray-600">{lesson.notes}</p>
                                </div>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-gray-50 rounded-lg">
                        <Info className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                        <h3 className="text-lg font-medium text-gray-600">No past lessons</h3>
                        <p className="text-gray-500 mt-1">
                          {selectedDate 
                            ? `No lessons for ${format(selectedDate, 'MMMM d, yyyy')}`
                            : "You don't have any past lessons"}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentLessons; 
