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

// Define types for lesson and student
interface Student {
  id: string | number;
  name: string;
  avatar?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  profile_picture_url?: string;
}

interface Lesson {
  id: string | number;
  date: string; // ISO date string
  startTime: string;
  endTime: string;
  status: "upcoming" | "completed" | "cancelled";
  student: Student;
  subject: string;
  meetingLink?: string;
  notes?: string;
}

// Define a booking record type for better type safety
interface BookingRecord {
  id: string;
  teacher_id: string;
  student_id: string;
  created_at: string;
  status?: string;
  notes?: string;
  meeting_link?: string;
  start_time?: string;
  end_time?: string;
  start_time_utc?: string;
  end_time_utc?: string;
}

interface StudentRecord {
  id: string;
  first_name?: string;
  last_name?: string;
  profile_picture_url?: string;
}

const TeacherLessons = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [activeTab, setActiveTab] = useState("upcoming");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [filteredLessons, setFilteredLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch real data from Supabase
  useEffect(() => {
    const fetchLessons = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        console.log("Fetching lessons for teacher:", user.id);
        
        // Get bookings for this teacher
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            id,
            teacher_id,
            student_id,
            created_at,
            status,
            notes,
            meeting_link,
            start_time,
            end_time,
            start_time_utc,
            end_time_utc
          `)
          .eq('teacher_id', user.id);
        
        if (error) {
          console.error("Error fetching bookings:", error);
          throw error;
        }
        
        console.log("Raw bookings data:", data);
        
        if (!data || data.length === 0) {
          console.log("No bookings found for this teacher");
          setLessons([]);
          setFilteredLessons([]);
          setIsLoading(false);
          return;
        }
        
        // Get unique student IDs from bookings
        const studentIds = [...new Set(data
          .map(booking => booking?.student_id)
          .filter(id => id !== null && id !== undefined)
        )];
        
        // Fetch student data
        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
          .select('id, first_name, last_name, profile_picture_url')
          .in('id', studentIds);
        
        if (studentsError) {
          console.error("Error fetching students:", studentsError);
          throw studentsError;
        }
        
        console.log("Students data:", studentsData);
        
        // Transform bookings to lessons
        const processedLessons: Lesson[] = data.map((booking: any) => {
          // Find student for this booking
          const student = (studentsData?.find(s => (s as any).id === booking.student_id) as any) || {
            id: booking.student_id || "unknown",
            first_name: "Unknown",
            last_name: "Student"
          };
          
          // Extract date and time
          let bookingDate = booking.created_at || new Date().toISOString();
          let startTime = "00:00";
          let endTime = "01:00";
          
          // Use start_time and end_time if available
          if (booking.start_time) {
            bookingDate = new Date(booking.start_time).toISOString().split('T')[0];
            startTime = new Date(booking.start_time).toISOString().split('T')[1].substring(0, 5);
          }
          
          if (booking.end_time) {
            endTime = new Date(booking.end_time).toISOString().split('T')[1].substring(0, 5);
          }
          
          // Determine lesson status
          let status: "upcoming" | "completed" | "cancelled";
          
          // Map the database status to our frontend status
          if (booking.status === "confirmed" || booking.status === "pending") {
            status = "upcoming";
          } else if (booking.status === "completed") {
            status = "completed";
          } else if (booking.status === "cancelled" || booking.status === "rescheduled") {
            status = "cancelled";
          } else {
            // Determine based on date
            const lessonDate = booking.start_time ? new Date(booking.start_time) : new Date(bookingDate);
            if (isPast(lessonDate) && !isToday(lessonDate)) {
              status = "completed";
            } else {
              status = "upcoming";
            }
          }
          
          return {
            id: booking.id,
            date: bookingDate,
            startTime: startTime,
            endTime: endTime,
            status: status,
            student: {
              id: student.id,
              name: `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Unknown Student',
              first_name: student.first_name,
              last_name: student.last_name,
              avatar: student.profile_picture_url,
              profile_picture_url: student.profile_picture_url
            },
            subject: "General Lesson",
            meetingLink: booking.meeting_link,
            notes: booking.notes
          };
        });
        
        console.log("Processed lessons:", processedLessons);
        setLessons(processedLessons);
      } catch (err) {
        console.error("Error fetching lessons:", err);
        setError("Failed to load your lessons. Please try again later.");
        
        // Fallback to mock data
        const mockLessons: Lesson[] = [
          {
            id: 1,
            date: format(startOfToday(), 'yyyy-MM-dd'),
            startTime: "14:00",
            endTime: "15:00",
            status: "upcoming",
            student: {
              id: 1,
              name: "John Smith",
              avatar: "/avatars/student-1.jpg",
              email: "john.smith@example.com"
            },
            subject: "Mathematics",
            meetingLink: "https://meet.google.com/abc-defg-hij"
          },
          {
            id: 2,
            date: format(addDays(startOfToday(), 2), 'yyyy-MM-dd'),
            startTime: "10:00",
            endTime: "11:00",
            status: "upcoming",
            student: {
              id: 2,
              name: "Emily Johnson",
              avatar: "/avatars/student-2.jpg",
              email: "emily.j@example.com"
            },
            subject: "Algebra",
            meetingLink: "https://meet.google.com/klm-nopq-rst"
          },
          {
            id: 3,
            date: format(addDays(startOfToday(), -3), 'yyyy-MM-dd'),
            startTime: "09:00",
            endTime: "10:00",
            status: "completed",
            student: {
              id: 3,
              name: "Michael Brown",
              avatar: "/avatars/student-3.jpg"
            },
            subject: "Geometry",
            notes: "Covered coordinate geometry and distance formula. Michael needs more practice with circle equations."
          }
        ];
        setLessons(mockLessons);
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

  // Add notes to a lesson
  const addNotesToLesson = async (lessonId: string | number, notes: string) => {
    try {
      // Update in Supabase
      const { error } = await supabase
        .from('bookings')
        .update({ notes })
        .eq('id', lessonId);
      
      if (error) {
        console.error("Error updating notes:", error);
        return;
      }
      
      // Update local state
      setLessons(prevLessons => 
        prevLessons.map(lesson => 
          lesson.id === lessonId ? { ...lesson, notes } : lesson
        )
      );
    } catch (err) {
      console.error("Error adding notes:", err);
    }
  };

  return (
    <DashboardLayout userType="teacher">
      <div className="container mx-auto px-4 py-8 pt-4">
        <h1 className="text-3xl font-bold mb-6">My Lessons</h1>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            <span className="ml-2 text-gray-600">Loading lessons...</span>
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
                      Your scheduled lessons with students
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
                                  <h3 className="font-semibold">{lesson.subject}</h3>
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
                                  <AvatarImage src={lesson.student.avatar || lesson.student.profile_picture_url} alt={lesson.student.name} />
                                  <AvatarFallback>
                                    {lesson.student.name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h4 className="font-medium">{lesson.student.name}</h4>
                                  <div className="flex items-center text-sm text-gray-500">
                                    <Clock className="h-3.5 w-3.5 mr-1" />
                                    {formatTimeDisplay(lesson.startTime)} - {formatTimeDisplay(lesson.endTime)}
                                  </div>
                                </div>
                              </div>
                              
                              {lesson.meetingLink && lesson.status === 'upcoming' && (
                                <div className="mt-4">
                                  <Button className="w-full sm:w-auto" size="sm" onClick={() => window.open(lesson.meetingLink, '_blank')}>
                                    <Video className="h-4 w-4 mr-2" />
                                    Start Lesson
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
                                  <h3 className="font-semibold">{lesson.subject}</h3>
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
                                  <AvatarImage src={lesson.student.avatar || lesson.student.profile_picture_url} alt={lesson.student.name} />
                                  <AvatarFallback>
                                    {lesson.student.name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h4 className="font-medium">{lesson.student.name}</h4>
                                  <div className="flex items-center text-sm text-gray-500">
                                    <Clock className="h-3.5 w-3.5 mr-1" />
                                    {formatTimeDisplay(lesson.startTime)} - {formatTimeDisplay(lesson.endTime)}
                                  </div>
                                </div>
                              </div>
                              
                              {lesson.notes ? (
                                <div className="mt-3 p-3 bg-gray-50 rounded-md text-sm">
                                  <p className="font-medium mb-1">Lesson Notes:</p>
                                  <p className="text-gray-600">{lesson.notes}</p>
                                </div>
                              ) : (
                                <div className="mt-3">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="w-full"
                                    onClick={() => {
                                      const notes = prompt("Add notes for this lesson:");
                                      if (notes) addNotesToLesson(lesson.id, notes);
                                    }}
                                  >
                                    Add Lesson Notes
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
        )}
      </div>
    </DashboardLayout>
  );
};

export default TeacherLessons; 