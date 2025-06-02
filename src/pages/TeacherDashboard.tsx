
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layout } from "@/components/Layout";
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
  Bell
} from "lucide-react";

const TeacherDashboard = () => {
  const upcomingLessons = [
    {
      id: 1,
      student: "Sarah Johnson",
      subject: "Advanced Mathematics",
      time: "Today, 3:00 PM WAT",
      duration: "60 min",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=100&h=100&fit=crop&crop=face"
    },
    {
      id: 2,
      student: "Michael Chen",
      subject: "Calculus",
      time: "Tomorrow, 2:00 PM WAT",
      duration: "45 min",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
    }
  ];

  const recentBookings = [
    {
      id: 1,
      student: "Emma Wilson",
      subject: "Statistics",
      date: "Dec 1, 2024",
      earnings: "$25",
      status: "completed"
    },
    {
      id: 2,
      student: "David Brown",
      subject: "Algebra",
      date: "Nov 30, 2024",
      earnings: "$25",
      status: "completed"
    }
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, Dr. Amara!</h1>
            <p className="text-gray-600">Manage your teaching schedule and connect with students</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100">Total Earnings</p>
                    <p className="text-3xl font-bold">$1,245</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-emerald-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100">Lessons Taught</p>
                    <p className="text-3xl font-bold">48</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100">Rating</p>
                    <p className="text-3xl font-bold">4.9</p>
                  </div>
                  <Star className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100">Students</p>
                    <p className="text-3xl font-bold">32</p>
                  </div>
                  <Users className="h-8 w-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Upcoming Lessons */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Upcoming Lessons
                  </CardTitle>
                  <CardDescription>Your scheduled teaching sessions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {upcomingLessons.map((lesson) => (
                    <div key={lesson.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <img
                          src={lesson.avatar}
                          alt={lesson.student}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                          <h4 className="font-semibold text-gray-900">{lesson.subject}</h4>
                          <p className="text-sm text-gray-600">with {lesson.student}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {lesson.time}
                            </span>
                            <span>{lesson.duration}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Message
                        </Button>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                          <Video className="h-4 w-4 mr-1" />
                          Start
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {upcomingLessons.length === 0 && (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No upcoming lessons</p>
                      <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700">
                        <Settings className="h-4 w-4 mr-2" />
                        Set Availability
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Bookings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Recent Bookings
                  </CardTitle>
                  <CardDescription>Your teaching history</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentBookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-semibold text-gray-900">{booking.subject}</h4>
                          <p className="text-sm text-gray-600">with {booking.student}</p>
                          <p className="text-xs text-gray-500">{booking.date}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-semibold text-emerald-600">{booking.earnings}</span>
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            {booking.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                    <Settings className="h-4 w-4 mr-2" />
                    Set Availability
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Calendar className="h-4 w-4 mr-2" />
                    View Calendar
                  </Button>
                  <Button variant="outline" className="w-full">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Messages
                  </Button>
                  <Button variant="outline" className="w-full">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Earnings
                  </Button>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Student Satisfaction</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="font-semibold">4.9</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Response Rate</span>
                    <span className="font-semibold text-emerald-600">98%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Completion Rate</span>
                    <span className="font-semibold text-blue-600">96%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">This Month</span>
                    <span className="font-semibold">12 lessons</span>
                  </div>
                </CardContent>
              </Card>

              {/* Notifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    <p className="text-sm font-medium text-blue-900">New booking request</p>
                    <p className="text-xs text-blue-700">Sarah wants to book Mathematics</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                    <p className="text-sm font-medium text-green-900">Payment received</p>
                    <p className="text-xs text-green-700">$25 from completed lesson</p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                    <p className="text-sm font-medium text-yellow-900">Profile update needed</p>
                    <p className="text-xs text-yellow-700">Add more subjects to increase bookings</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TeacherDashboard;
