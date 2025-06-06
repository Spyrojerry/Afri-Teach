import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UpcomingLessons } from "@/components/UpcomingLessons";
import { DashboardLayout } from "@/components/DashboardLayout";
import { format, parseISO } from "date-fns";
import { useAuth } from "@/contexts/auth-context";
import {
  getUpcomingLessons,
  getPastLessons,
  getLessonStats,
  Lesson,
} from "@/services/lessonService";
import {
  getUserNotifications,
  Notification,
} from "@/services/notificationService";
import { getTeacherProfile, Teacher } from "@/services/teacherService";
import { getTeacherEarningsSummary } from "@/services/paymentService";
import { 
  getTeacherBookingRequests, 
  updateBookingRequestStatus, 
  BookingRequest 
} from "@/services/bookingRequestService";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Calendar,
  Clock,
  DollarSign,
  Star,
  Users,
  Video,
  MessageCircle,
  Settings,
  BookOpen,
  TrendingUp,
  Bell,
  CalendarClock,
  Loader2,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from "lucide-react";

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [upcomingLessons, setUpcomingLessons] = useState<Lesson[]>([]);
  const [pastLessons, setPastLessons] = useState<Lesson[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [teacherProfile, setTeacherProfile] = useState<Teacher | null>(null);
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [stats, setStats] = useState({
    upcomingLessons: 0,
    completedLessons: 0,
    uniqueConnections: 0,
    totalHours: 0,
    totalEarnings: 0,
    averageRating: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      try {
        // Fetch all data in parallel
        const [
          upcomingData,
          pastData,
          statsData,
          notificationsData,
          profileData,
          earningsData,
          bookingRequestsData,
        ] = await Promise.all([
          getUpcomingLessons(user.id, "teacher"),
          getPastLessons(user.id, "teacher"),
          getLessonStats(user.id, "teacher"),
          getUserNotifications(user.id),
          getTeacherProfile(user.id),
          getTeacherEarningsSummary(user.id),
          getTeacherBookingRequests(user.id),
        ]);

        setUpcomingLessons(upcomingData);
        setPastLessons(pastData);
        setTeacherProfile(profileData);
        setBookingRequests(bookingRequestsData);

        setStats({
          ...statsData,
          totalEarnings: earningsData.totalEarnings,
          averageRating: profileData?.rating || 0,
        });

        setNotifications(notificationsData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  // Handler for navigating to the availability management page
  const handleManageAvailability = () => {
    navigate("/teacher/availability");
  };

  // Handler for navigating to the profile edit page
  const handleEditProfile = () => {
    navigate("/teacher/profile");
  };

  // Format a date string for display
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "MMM d, yyyy");
    } catch (error) {
      return dateString;
    }
  };

  // Get badge color based on notification type
  const getNotificationColor = (type: string) => {
    switch (type) {
      case "lesson_reminder":
        return "bg-blue-50 border-blue-500 text-blue-700";
      case "booking_confirmation":
        return "bg-green-50 border-green-500 text-green-700";
      case "message":
        return "bg-purple-50 border-purple-500 text-purple-700";
      case "payment":
        return "bg-yellow-50 border-yellow-500 text-yellow-700";
      default:
        return "bg-gray-50 border-gray-500 text-gray-700";
    }
  };

  // Navigate to booking requests page
  const handleViewAllBookingRequests = () => {
    navigate("/teacher/booking-requests");
  };

  // Handle accepting a booking request
  const handleAcceptRequest = async (requestId: string) => {
    try {
      const success = await updateBookingRequestStatus(requestId, "approved");
      if (success) {
        // Update local state
        setBookingRequests(prevRequests => 
          prevRequests.map(req => 
            req.id === requestId ? { ...req, status: "approved" } : req
          )
        );
      }
    } catch (error) {
      console.error("Error accepting booking request:", error);
    }
  };

  // Handle rejecting a booking request
  const handleRejectRequest = async (requestId: string) => {
    try {
      const success = await updateBookingRequestStatus(requestId, "rejected");
      if (success) {
        // Update local state
        setBookingRequests(prevRequests => 
          prevRequests.map(req => 
            req.id === requestId ? { ...req, status: "rejected" } : req
          )
        );
      }
    } catch (error) {
      console.error("Error rejecting booking request:", error);
    }
  };

  // Format relative time for created_at
  const formatRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      if (diffInSeconds < 60) {
        return "just now";
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
      } else {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} day${days > 1 ? 's' : ''} ago`;
      }
    } catch (error) {
      return "unknown time";
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout userType="teacher">
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
    <DashboardLayout userType="teacher">
      <div className="container mx-auto py-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Teacher Dashboard
          </h1>
          <p className="text-gray-500">
            Welcome back
            {teacherProfile?.fullName
              ? `, ${teacherProfile.fullName.split(" ")[0]}`
              : user?.user_metadata?.first_name
              ? `, ${user.user_metadata.first_name}`
              : ""}
            ! Manage your teaching schedule and lessons
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Upcoming Lessons
                  </p>
                  <p className="text-2xl font-bold mt-1">
                    {stats.upcomingLessons}
                  </p>
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
                  <p className="text-sm font-medium text-gray-500">
                    Total Students
                  </p>
                  <p className="text-2xl font-bold mt-1">
                    {stats.uniqueConnections}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Users className="h-6 w-6 text-purple-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Average Rating
                  </p>
                  <p className="text-2xl font-bold mt-1">
                    {stats.averageRating || "N/A"}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Star className="h-6 w-6 text-yellow-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Total Earnings
                  </p>
                  <p className="text-2xl font-bold mt-1">
                    ${stats.totalEarnings}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <DollarSign className="h-6 w-6 text-green-700" />
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
              userRole="teacher"
              emptyMessage="No upcoming lessons. Set your availability to get bookings."
            />

            {/* Booking Requests */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
                    <ClipboardCheck className="h-5 w-5" />
                    Booking Requests
                  </CardTitle>
                  <Badge className="bg-yellow-500">
                    {bookingRequests.filter(req => req.status === "pending").length} Pending
                  </Badge>
                </div>
                <CardDescription>New lesson requests from students</CardDescription>
              </CardHeader>
              <CardContent>
                {bookingRequests.filter(req => req.status === "pending").length > 0 ? (
                  <div className="space-y-4">
                    {bookingRequests
                      .filter(request => request.status === "pending")
                      .slice(0, 3)
                      .map((request) => (
                        <div
                          key={request.id}
                          className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border rounded-lg"
                        >
                          <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarImage src={request.studentAvatar} />
                            <AvatarFallback>
                              {request.studentName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-grow min-w-0">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                              <h4 className="font-semibold truncate">{request.studentName}</h4>
                              <span className="text-xs text-gray-500">{formatRelativeTime(request.created_at)}</span>
                            </div>
                            <p className="text-sm text-gray-600">{request.subject} Lesson</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                              <div className="flex items-center">
                                <Calendar className="h-3.5 w-3.5 mr-1" />
                                <span>{formatDate(request.date)}</span>
                              </div>
                              <span>•</span>
                              <div className="flex items-center">
                                <Clock className="h-3.5 w-3.5 mr-1" />
                                <span>{request.startTime} - {request.endTime}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-red-600 border-red-200 hover:bg-red-50 h-8 px-2"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent any parent click handlers
                                handleRejectRequest(request.id);
                              }}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-green-600 border-green-200 hover:bg-green-50 h-8 px-2"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent any parent click handlers
                                handleAcceptRequest(request.id);
                              }}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ClipboardCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No pending booking requests</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-center pt-0">
                <Button
                  variant="outline"
                  onClick={handleViewAllBookingRequests}
                  className="w-full sm:w-auto"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View All Booking Requests
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 lg:space-y-8">
            {/* Profile Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings className="h-5 w-5" />
                  Profile Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {teacherProfile ? (
                  <>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Subjects
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {teacherProfile.subjects?.map((subject, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="bg-purple-100 text-purple-800 hover:bg-purple-200"
                          >
                            {subject}
                          </Badge>
                        ))}
                        {!teacherProfile.subjects?.length && (
                          <p className="text-sm text-gray-400">
                            No subjects added yet
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Hourly Rate
                      </p>
                      <p className="text-sm mt-1">
                        {teacherProfile.hourlyRate
                          ? `$${teacherProfile.hourlyRate}/hour`
                          : "Not set"}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleEditProfile}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500 mb-3">
                      Complete your teacher profile to get started
                    </p>
                    <Button className="w-full" onClick={handleEditProfile}>
                      Set Up Profile
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

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
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border-l-4 ${getNotificationColor(
                        notification.type
                      )}`}
                    >
                      <p className="text-sm font-medium">
                        {notification.title}
                      </p>
                      <p className="text-xs">{notification.message}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-500">
                      No new notifications
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Manage Availability Card */}
            <Card>
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <CalendarClock className="h-8 w-8 mx-auto text-blue-600" />
                  <h3 className="font-semibold text-lg">Manage Availability</h3>
                  <p className="text-sm text-gray-500">
                    Set your teaching hours to receive more bookings
                  </p>
                  <Button
                    className="w-full bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 hover:from-slate-800 hover:via-purple-800 hover:to-slate-800"
                    onClick={handleManageAvailability}
                  >
                    Set Availability
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

export default TeacherDashboard;
