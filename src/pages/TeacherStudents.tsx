import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Search, 
  Calendar, 
  MessageCircle, 
  CheckCircle2, 
  Clock,
  BookOpen,
  Star,
  Filter,
  Loader2,
  X
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Link } from "react-router-dom";
import { format, isPast, parseISO } from "date-fns";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth-context";

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  profile_picture_url?: string;
  email: string;
  lessonsCompleted?: number;
  lastLesson?: string; // ISO date string
  nextLesson?: string; // ISO date string
  joinDate?: string; // ISO date string
  subjects?: string[];
  notes?: string;
}

interface StudentNote {
  id: number;
  studentId: string;
  text: string;
  createdAt: string; // ISO date string
}

interface Booking {
  id: string;
  student_id: string;
  teacher_id: string;
  subject: string;
  date: string;
  start_time: string;
  end_time: string;
  start_time_utc: string;
  end_time_utc: string;
  status: string;
  created_at: string;
}

const TeacherStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [studentNotes, setStudentNotes] = useState<StudentNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 1024);
  const [studentBookings, setStudentBookings] = useState<Booking[]>([]);
  const { user } = useAuth();

  // Handle resize events to detect mobile view
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 1024);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch students data from Supabase
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setIsLoading(true);
        if (!user?.id) return;
        
        console.log("Fetching student data for teacher:", user.id);
        
        // First, get bookings to find student IDs for this teacher
        const { data: bookings, error: bookingsError } = await supabase
          .from('bookings')
          .select('*')
          .eq('teacher_id', user.id);
        
        if (bookingsError) {
          console.error("Error fetching bookings:", bookingsError);
          throw bookingsError;
        }
        
        // Debug the structure of the first booking if available
        if (bookings && bookings.length > 0) {
          console.log("Sample booking structure:", Object.keys(bookings[0]));
        } else {
          console.log("No bookings found");
        }
        
        console.log("Bookings data:", bookings);
        
        // Extract unique student IDs
        const studentIds = [...new Set(bookings.map(booking => booking.student_id))];
        console.log("Student IDs:", studentIds);
        
        if (studentIds.length === 0) {
          console.log("No students found for this teacher");
          setStudents([]);
          setFilteredStudents([]);
          setIsLoading(false);
          return;
        }
        
        // Now fetch student data
        const { data: studentData, error: studentsError } = await supabase
          .from('students')
          .select('*')
          .in('id', studentIds);
        
        if (studentsError) {
          console.error("Error fetching students:", studentsError);
          throw studentsError;
        }
        
        console.log("Student data:", studentData);
        
        // Process students data with lesson information
        const processedStudents = studentData.map(student => {
          const studentBookings = bookings.filter(booking => booking.student_id === student.id);
          const completedLessons = studentBookings.filter(booking => booking.status === 'completed').length;
          const lastLesson = studentBookings.find(booking => 
            booking.status === 'completed' && isPast(new Date(booking.date))
          );
          const nextLesson = studentBookings.find(booking => 
            booking.status === 'confirmed' && !isPast(new Date(booking.date))
          );
          
          return {
            id: student.id,
            first_name: student.first_name,
            last_name: student.last_name,
            profile_picture_url: student.profile_picture_url,
            email: `student${student.id.substring(0, 4)}@example.com`, // Placeholder
            lessonsCompleted: completedLessons,
            lastLesson: lastLesson?.start_time_utc,
            nextLesson: nextLesson?.start_time_utc,
            joinDate: student.created_at,
            subjects: Array.isArray(student.subjects) ? student.subjects : [],
            notes: student.notes
          };
        });
        
        console.log("Processed students:", processedStudents);
        setStudents(processedStudents);
        setFilteredStudents(processedStudents);
      } catch (err) {
        console.error("Error fetching students:", err);
        setError("Failed to load students. Please try again later.");
        // Use mock data as fallback for testing
        const mockStudents = getMockStudents();
        setStudents(mockStudents);
        setFilteredStudents(mockStudents);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStudents();
  }, [user?.id]);

  // Fetch student bookings when a student is selected
  useEffect(() => {
    const fetchStudentBookings = async () => {
      if (!selectedStudent || !user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('teacher_id', user.id)
          .eq('student_id', selectedStudent.id)
          .limit(5);
        
        if (error) throw error;
        
        setStudentBookings(data || []);
      } catch (err) {
        console.error("Error fetching student bookings:", err);
        // Fallback to empty array
        setStudentBookings([]);
      }
    };
    
    fetchStudentBookings();
  }, [selectedStudent, user?.id]);

  // Mock data for students - Only used as fallback
  const getMockStudents = (): Student[] => {
    return [
      {
        id: "1",
        first_name: "John",
        last_name: "Smith",
        profile_picture_url: "/avatars/student-1.jpg",
        email: "john.smith@example.com",
        lessonsCompleted: 8,
        lastLesson: new Date(Date.now() - 7 * 24 * 3600000).toISOString(), // 7 days ago
        nextLesson: new Date(Date.now() + 2 * 24 * 3600000).toISOString(), // 2 days from now
        joinDate: new Date(Date.now() - 60 * 24 * 3600000).toISOString(), // 60 days ago
        subjects: ["Mathematics", "Physics"],
        notes: "Strong in algebra, needs more practice with calculus."
      },
      {
        id: "2",
        first_name: "Emily",
        last_name: "Johnson",
        profile_picture_url: "/avatars/student-2.jpg",
        email: "emily.j@example.com",
        lessonsCompleted: 12,
        lastLesson: new Date(Date.now() - 3 * 24 * 3600000).toISOString(), // 3 days ago
        nextLesson: new Date(Date.now() + 4 * 24 * 3600000).toISOString(), // 4 days from now
        joinDate: new Date(Date.now() - 90 * 24 * 3600000).toISOString(), // 90 days ago
        subjects: ["Chemistry", "Biology"]
      },
      {
        id: "3",
        first_name: "Michael",
        last_name: "Brown",
        profile_picture_url: "/avatars/student-3.jpg",
        email: "michael.brown@example.com",
        lessonsCompleted: 5,
        lastLesson: new Date(Date.now() - 10 * 24 * 3600000).toISOString(), // 10 days ago
        joinDate: new Date(Date.now() - 45 * 24 * 3600000).toISOString(), // 45 days ago
        subjects: ["Mathematics"]
      }
    ];
  };

  // Mock data for student notes
  useEffect(() => {
    if (selectedStudent) {
      // In a real app, this would be an API call
      const mockNotes: StudentNote[] = [
        {
          id: 1,
          studentId: selectedStudent.id,
          text: "Discussed quadratic equations today. John is making good progress.",
          createdAt: new Date(Date.now() - 14 * 24 * 3600000).toISOString() // 14 days ago
        },
        {
          id: 2,
          studentId: selectedStudent.id,
          text: "Reviewed last week's homework. All problems were solved correctly.",
          createdAt: new Date(Date.now() - 7 * 24 * 3600000).toISOString() // 7 days ago
        }
      ];

      setStudentNotes(mockNotes);
    }
  }, [selectedStudent]);

  // Filter students based on search query, selected tab, and subject
  useEffect(() => {
    let filtered = [...students];
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(student => 
        student.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by tab
    if (activeTab === "upcoming") {
      filtered = filtered.filter(student => student.nextLesson && !isPast(parseISO(student.nextLesson)));
    } else if (activeTab === "new") {
      // Consider students who joined within the last 30 days as "new"
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      filtered = filtered.filter(student => parseISO(student.joinDate) >= thirtyDaysAgo);
    }
    
    // Filter by subject
    if (filterSubject !== "all") {
      filtered = filtered.filter(student => 
        student.subjects.some(subject => subject.toLowerCase() === filterSubject.toLowerCase())
      );
    }
    
    setFilteredStudents(filtered);
  }, [students, searchQuery, activeTab, filterSubject]);

  // Add a new note for the selected student
  const handleAddNote = () => {
    if (!selectedStudent || !newNote.trim()) return;
    
    const newNoteObj: StudentNote = {
      id: Date.now(),
      studentId: selectedStudent.id,
      text: newNote,
      createdAt: new Date().toISOString()
    };
    
    setStudentNotes([newNoteObj, ...studentNotes]);
    setNewNote("");
    setShowNoteDialog(false);
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return format(parseISO(dateString), "MMM d, yyyy");
  };

  // Format time for display
  const formatTime = (dateString?: string) => {
    if (!dateString) return "";
    return format(parseISO(dateString), "h:mm a");
  };

  // Get all unique subjects from students
  const allSubjects = Array.from(
    new Set(students.flatMap(student => student.subjects || []))
  ).sort();

  // Render student details for both desktop and mobile views
  const renderStudentDetails = () => (
    <>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-purple-100">
            <AvatarImage src={selectedStudent?.profile_picture_url} alt={`${selectedStudent?.first_name} ${selectedStudent?.last_name}`} />
            <AvatarFallback>
              {selectedStudent?.first_name?.[0]}{selectedStudent?.last_name?.[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-xl font-bold">{selectedStudent?.first_name} {selectedStudent?.last_name}</h3>
            <p className="text-gray-500">{selectedStudent?.email}</p>
            <div className="flex items-center mt-1 text-sm text-gray-500">
              <Calendar className="h-4 w-4 mr-1" />
              <span>Joined {formatDate(selectedStudent?.joinDate)}</span>
            </div>
          </div>
        </div>
        <div className="flex max-md:flex-col max-md:space-y-2 space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1"
            asChild
          >
            <Link to="/teacher/messages">
              <MessageCircle className="h-4 w-4" />
              Message
            </Link>
          </Button>
          <Button 
            variant="default"
            size="sm"
            className="flex items-center gap-1"
            onClick={() => setShowNoteDialog(true)}
          >
            <CheckCircle2 className="h-4 w-4" />
            Add Note
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <BookOpen className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{selectedStudent?.lessonsCompleted || 0}</p>
              <p className="text-sm text-gray-500">Lessons Completed</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">
                {selectedStudent?.nextLesson 
                  ? formatDate(selectedStudent.nextLesson).split(',')[0]
                  : "N/A"}
              </p>
              <p className="text-sm text-gray-500">Next Lesson</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">
                {(selectedStudent?.lessonsCompleted || 0) > 0 ? "Active" : "New"}
              </p>
              <p className="text-sm text-gray-500">Status</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="space-y-6 mt-6">
        {/* Subjects */}
        <div>
          <h3 className="text-lg font-medium mb-2">Subjects</h3>
          <div className="flex flex-wrap gap-2">
            {selectedStudent?.subjects?.length ? (
              selectedStudent.subjects.map((subject, index) => (
                <Badge key={index} className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                  {subject}
                </Badge>
              ))
            ) : (
              <p className="text-gray-500">No subjects listed</p>
            )}
          </div>
        </div>
        
        {/* Notes */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium">Notes</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowNoteDialog(true)}
            >
              Add Note
            </Button>
          </div>
          
          {studentNotes.length > 0 ? (
            <div className="space-y-3">
              {studentNotes.map(note => (
                <Card key={note.id}>
                  <CardContent className="p-3">
                    <p className="text-sm">{note.text}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(note.createdAt)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No notes added yet</p>
            </div>
          )}
        </div>
        
        {/* Upcoming Lessons */}
        <div>
          <h3 className="text-lg font-medium mb-2">Upcoming Lessons</h3>
          {studentBookings.length > 0 ? (
            <div className="space-y-3">
              {studentBookings
                .filter(booking => booking.status === 'confirmed' && !isPast(new Date(booking.date)))
                .map(booking => (
                  <Card key={booking.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{booking.subject} Lesson</h4>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>
                              {format(new Date(booking.date), "MMM d, yyyy")} at {booking.start_time}
                            </span>
                          </div>
                        </div>
                        <Button size="sm">
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No upcoming lessons scheduled</p>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <DashboardLayout userType="teacher">
      <div className="container mx-auto px-4 py-8 pt-4">
        <h1 className="text-3xl font-bold mb-6">My Students</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Students List */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  Students
                </CardTitle>
                <Badge className="bg-blue-500">
                  {students.length} Total
                </Badge>
              </div>
              <div className="flex space-x-2 items-center">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Search students..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterSubject} onValueChange={setFilterSubject}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {allSubjects.map(subject => (
                      <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="new">New</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(70vh-200px)]">
                {filteredStudents.length > 0 ? (
                  <div className="divide-y">
                    {filteredStudents.map(student => (
                      <div 
                        key={student.id}
                        className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedStudent?.id === student.id ? 'bg-purple-50' : ''
                        }`}
                        onClick={() => setSelectedStudent(student)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12 border-2 border-gray-100">
                            <AvatarImage src={student.profile_picture_url} alt={`${student.first_name} ${student.last_name}`} />
                            <AvatarFallback>
                              {student.first_name.split(' ').map(n => n[0]).join('')}
                              {student.last_name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-grow">
                            <h3 className="font-medium">{`${student.first_name} ${student.last_name}`}</h3>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <BookOpen className="h-3.5 w-3.5" />
                              <span>{student.lessonsCompleted} lessons completed</span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {student.subjects?.map(subject => (
                                <Badge key={subject} variant="outline" className="text-xs">
                                  {subject}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        {student.nextLesson && (
                          <div className="mt-2 text-xs text-gray-500 flex items-center">
                            <Calendar className="h-3.5 w-3.5 mr-1 text-blue-500" />
                            Next: {formatDate(student.nextLesson)} at {formatTime(student.nextLesson)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-500 mb-1">No students found</h3>
                    <p className="text-sm text-gray-400">
                      {searchQuery || filterSubject !== "all"
                        ? "Try a different search or filter"
                        : "You don't have any students yet"}
                    </p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
          
          {/* Student Details */}
          {isMobileView ? (
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                {renderStudentDetails()}
              </CardHeader>
              
              <CardContent>
                {/* Content will be empty since we're using renderStudentDetails in CardHeader */}
              </CardContent>
            </Card>
          ) : (
            <Card className="lg:col-span-2">
              {selectedStudent ? (
                <>
                  <CardHeader className="pb-3">
                    {renderStudentDetails()}
                  </CardHeader>
                  
                  <CardContent>
                    {/* Content will be empty since we're using renderStudentDetails in CardHeader */}
                  </CardContent>
                </>
              ) : (
                <div className="flex items-center justify-center h-[70vh]">
                  <div className="text-center">
                    <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-600 mb-2">No student selected</h3>
                    <p className="text-gray-500 max-w-md">
                      Select a student from the list to view their details, manage notes, and see upcoming lessons.
                    </p>
                  </div>
                </div>
              )}
            </Card>
          )}
          
          {/* Student Details - Mobile View */}
          {isMobileView && selectedStudent && (
            <Sheet open={!!selectedStudent} onOpenChange={(open) => !open && setSelectedStudent(null)}>
              <SheetContent side="bottom" className="h-[85vh] pt-6 px-1 sm:px-6">
                <SheetHeader className="text-left relative">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setSelectedStudent(null)}
                    className="absolute right-0 top-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <SheetTitle className="text-xl">Student Details</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100%-60px)] mt-6 pr-4">
                  {renderStudentDetails()}
                </ScrollArea>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
      
      {/* Add Note Dialog */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note for {selectedStudent?.first_name} {selectedStudent?.last_name}</DialogTitle>
            <DialogDescription>
              Record important information about your student's progress.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter your notes here..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="min-h-[150px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNoteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNote}>
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default TeacherStudents; 