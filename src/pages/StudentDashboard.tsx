import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UpcomingLessons } from "@/components/UpcomingLessons";
import { DashboardLayout } from "@/components/DashboardLayout";
import { format, parseISO } from "date-fns";
import { useAuth } from "@/contexts/auth-context";
import { getUpcomingLessons, getPastLessons, getLessonStats, Lesson } from "@/services/lessonService";
import { getUserNotifications, Notification } from "@/services/notificationService";
import { 
  Calendar, 
  Clock, 
  GraduationCap, 
  BookOpen,
  Search,
  UserCheck,
  Bell,
  History,
  Video,
  MessageCircle,
  Loader2
} from "lucide-react";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [upcomingLessons, setUpcomingLessons] = useState<Lesson[]>([]);
  const [pastLessons, setPastLessons] = useState<Lesson[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState({
    upcomingLessons: 0,
    completedLessons: 0,
    uniqueConnections: 0,
    totalHours: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      try {
        // Fetch all data in parallel
        const [upcomingData, pastData, statsData, notificationsData] = await Promise.all([
          getUpcomingLessons(user.id, 'student'),
          getPastLessons(user.id, 'student'),
          getLessonStats(user.id, 'student'),
          getUserNotifications(user.id)
        ]);
        
        setUpcomingLessons(upcomingData);
        setPastLessons(pastData);
        setStats(statsData);
        setNotifications(notificationsData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [user?.id]);

  // Handler for navigating to the find teachers page
  const handleFindTeachers = () => {
    navigate("/student/find-teachers");
  };

  // Format a date string for display
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "MMMM d, yyyy");
    } catch (error) {
      return dateString;
    }
  };

  // Get badge color based on notification type
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'lesson_reminder':
        return 'bg-blue-50 border-blue-500 text-blue-700';
      case 'booking_confirmation':
        return 'bg-green-50 border-green-500 text-green-700';
      case 'message':
        return 'bg-purple-50 border-purple-500 text-purple-700';
      default:
        return 'bg-gray-50 border-gray-500 text-gray-700';
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout userType="student">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="student">
      <div className="container mx-auto py-4 space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Student Dashboard</h1>
          <p className="text-gray-500">Welcome back{user?.user_metadata?.first_name ? `, ${user.user_metadata.first_name}` : ''}! Manage your learning journey</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Upcoming Lessons</p>
                  <p className="text-2xl font-bold mt-1">{stats.upcomingLessons}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Calendar className="h-6 w-6 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Completed Lessons</p>
                  <p className="text-2xl font-bold mt-1">{stats.completedLessons}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <GraduationCap className="h-6 w-6 text-green-700" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Teachers</p>
                  <p className="text-2xl font-bold mt-1">{stats.uniqueConnections}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <UserCheck className="h-6 w-6 text-purple-700" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Study Hours</p>
                  <p className="text-2xl font-bold mt-1">{stats.totalHours}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <Clock className="h-6 w-6 text-orange-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6 lg:space-y-8">
            {/* Upcoming Lessons */}
            <UpcomingLessons 
              lessons={upcomingLessons}
              userRole="student"
              emptyMessage="No upcoming lessons. Find a teacher to book your first lesson!"
            />

            {/* Past Lessons */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
                  <History className="h-5 w-5" />
                  Past Lessons
                </CardTitle>
                <CardDescription>Your learning history</CardDescription>
              </CardHeader>
              <CardContent>
                {pastLessons.length > 0 ? (
                  <div className="space-y-4">
                    {pastLessons.map((lesson) => (
                      <div key={lesson.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4">
                        <div className="min-w-0">
                          <h4 className="font-semibold text-gray-900">{lesson.subject}</h4>
                          <p className="text-sm text-gray-600">by {lesson.teacherName || "Teacher"}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            <span>{formatDate(lesson.date)}</span>
                            <span>•</span>
                            <span>{`${lesson.startTime} - ${lesson.endTime}`}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            {lesson.status}
                          </Badge>
                          <Button variant="outline" size="sm">
                            Rate
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No past lessons yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 lg:space-y-8">
            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {notifications.length > 0 ? (
                  notifications.map(notification => (
                    <div 
                      key={notification.id} 
                      className={`p-3 rounded-lg border-l-4 ${getNotificationColor(notification.type)}`}
                    >
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="text-xs">{notification.message}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-500">No new notifications</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Find Teachers Card */}
            <Card>
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <Search className="h-8 w-8 mx-auto text-blue-600" />
                  <h3 className="font-semibold text-lg">Find New Teachers</h3>
                  <p className="text-sm text-gray-500">Explore our network of qualified teachers from across Africa</p>
                  <Button 
                    className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600"
                    onClick={handleFindTeachers}
                  >
                    Browse Teachers
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
