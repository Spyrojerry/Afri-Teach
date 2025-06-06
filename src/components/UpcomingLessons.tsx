import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MessageCircle, Video } from "lucide-react";
import { format, isPast, isSameDay, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Lesson } from "@/services/lessonService";

// Props interface
interface UpcomingLessonsProps {
  lessons: Lesson[];
  userRole: 'teacher' | 'student';
  emptyMessage?: string;
  onJoinLesson?: (lessonId: string) => void;
  onSendMessage?: (userId: string) => void;
}

export const UpcomingLessons = ({
  lessons,
  userRole,
  emptyMessage = "No upcoming lessons",
  onJoinLesson,
  onSendMessage
}: UpcomingLessonsProps) => {
  const navigate = useNavigate();
  const today = new Date();
  
  // Filter to upcoming lessons only (today or future)
  const upcomingLessons = lessons.filter(lesson => 
    !isPast(parseISO(lesson.date)) || isSameDay(parseISO(lesson.date), today)
  );
  
  // Sort by date and time
  const sortedLessons = [...upcomingLessons].sort((a, b) => {
    const dateA = parseISO(a.date);
    const dateB = parseISO(b.date);
    
    if (isSameDay(dateA, dateB)) {
      return a.startTime.localeCompare(b.startTime);
    }
    
    return dateA.getTime() - dateB.getTime();
  });
  
  // Format date and time for display
  const formatLessonDateTime = (date: string, startTime: string, endTime: string) => {
    const dateObj = parseISO(date);
    const today = new Date();
    
    let dateDisplay = '';
    if (isSameDay(dateObj, today)) {
      dateDisplay = 'Today';
    } else {
      dateDisplay = format(dateObj, 'EEEE, MMMM d');
    }
    
    // Format times to 12-hour with AM/PM
    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':');
      const hourNum = parseInt(hours, 10);
      const period = hourNum >= 12 ? 'PM' : 'AM';
      const hour12 = hourNum % 12 === 0 ? 12 : hourNum % 12;
      return `${hour12}:${minutes} ${period}`;
    };
    
    return `${dateDisplay}, ${formatTime(startTime)} - ${formatTime(endTime)}`;
  };
  
  // Helper to get the other user's info based on role
  const getOtherUser = (lesson: Lesson) => {
    if (userRole === 'student') {
      return {
        id: lesson.teacherId,
        name: lesson.teacherName || 'Teacher',
        avatar: lesson.teacherAvatar,
        role: 'teacher' as const
      };
    } else {
      return {
        id: lesson.studentId,
        name: lesson.studentName || 'Student',
        avatar: lesson.studentAvatar,
        role: 'student' as const
      };
    }
  };
  
  // Handle join lesson button click
  const handleJoinLesson = (lessonId: string) => {
    if (onJoinLesson) {
      onJoinLesson(lessonId);
    } else {
      // Navigate to virtual classroom
      navigate(`/${userRole}/classroom/${lessonId}`);
    }
  };
  
  // Handle send message button click
  const handleSendMessage = (userId: string) => {
    if (onSendMessage) {
      onSendMessage(userId);
    } else {
      console.log('Sending message to:', userId);
      // In a real implementation, you would open a message dialog
      alert('Opening message dialog...');
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
          <Calendar className="h-5 w-5" />
          Upcoming Lessons
        </CardTitle>
        <CardDescription>
          Your scheduled {userRole === 'teacher' ? 'teaching sessions' : 'learning sessions'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedLessons.length > 0 ? (
          sortedLessons.map((lesson) => {
            const otherUser = getOtherUser(lesson);
            return (
              <div key={lesson.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg gap-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={otherUser.avatar} alt={otherUser.name} />
                    <AvatarFallback className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                      {otherUser.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">{lesson.subject}</h4>
                    <p className="text-sm text-gray-600 truncate">
                      {userRole === 'teacher' ? 'with ' : 'by '}{otherUser.name}
                    </p>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                      <Clock className="h-4 w-4" />
                      <span>{formatLessonDateTime(lesson.date, lesson.startTime, lesson.endTime)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-2 sm:mt-0">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleSendMessage(otherUser.id)}
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Message
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 hover:from-slate-800 hover:via-purple-800 hover:to-slate-800"
                    onClick={() => handleJoinLesson(lesson.id)}
                  >
                    <Video className="h-4 w-4 mr-1" />
                    Join
                  </Button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">{emptyMessage}</p>
            {userRole === 'student' && (
              <Button 
                className="mt-4 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white font-medium py-3 disabled:opacity-50"
                onClick={() => navigate('/student/find-teachers')}
              >
                Find Teachers
              </Button>
            )}
            {userRole === 'teacher' && (
              <Button 
                className="mt-4 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 hover:from-slate-800 hover:via-purple-800 hover:to-slate-800"
                onClick={() => navigate('/teacher/availability')}
              >
                Set Availability
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 