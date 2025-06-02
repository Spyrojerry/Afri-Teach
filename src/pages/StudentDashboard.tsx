
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layout } from "@/components/Layout";
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  Star, 
  Video, 
  Search,
  TrendingUp,
  MessageCircle,
  Award
} from "lucide-react";

const StudentDashboard = () => {
  const upcomingLessons = [
    {
      id: 1,
      subject: "Advanced Mathematics",
      teacher: "Dr. Amara Okonkwo",
      time: "Today, 3:00 PM EST",
      duration: "60 min",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=100&h=100&fit=crop&crop=face"
    },
    {
      id: 2,
      subject: "English Literature",
      teacher: "Prof. Kwame Asante",
      time: "Tomorrow, 10:00 AM EST",
      duration: "45 min",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
    }
  ];

  const recentLessons = [
    {
      id: 1,
      subject: "Biology",
      teacher: "Dr. Fatima Hassan",
      date: "Dec 1, 2024",
      rating: 5,
      status: "completed"
    },
    {
      id: 2,
      subject: "Chemistry",
      teacher: "Prof. John Mbeki",
      date: "Nov 28, 2024",
      rating: 4,
      status: "completed"
    }
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, Sarah!</h1>
            <p className="text-gray-600">Ready to continue your learning journey?</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100">Total Lessons</p>
                    <p className="text-3xl font-bold">24</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-emerald-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100">Hours Learned</p>
                    <p className="text-3xl font-bold">36</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100">Avg Rating</p>
                    <p className="text-3xl font-bold">4.8</p>
                  </div>
                  <Star className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100">Teachers Met</p>
                    <p className="text-3xl font-bold">8</p>
                  </div>
                  <Award className="h-8 w-8 text-orange-200" />
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
                  <CardDescription>Your scheduled learning sessions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {upcomingLessons.map((lesson) => (
                    <div key={lesson.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <img
                          src={lesson.avatar}
                          alt={lesson.teacher}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                          <h4 className="font-semibold text-gray-900">{lesson.subject}</h4>
                          <p className="text-sm text-gray-600">{lesson.teacher}</p>
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
                          Join
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {upcomingLessons.length === 0 && (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No upcoming lessons</p>
                      <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700">
                        <Search className="h-4 w-4 mr-2" />
                        Find a Teacher
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Lessons */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Recent Lessons
                  </CardTitle>
                  <CardDescription>Your learning history</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentLessons.map((lesson) => (
                      <div key={lesson.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-semibold text-gray-900">{lesson.subject}</h4>
                          <p className="text-sm text-gray-600">{lesson.teacher}</p>
                          <p className="text-xs text-gray-500">{lesson.date}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < lesson.rating ? "text-yellow-400 fill-current" : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            {lesson.status}
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
                    <Search className="h-4 w-4 mr-2" />
                    Find Teachers
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Calendar className="h-4 w-4 mr-2" />
                    View Schedule
                  </Button>
                  <Button variant="outline" className="w-full">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Messages
                  </Button>
                </CardContent>
              </Card>

              {/* Learning Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Learning Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Mathematics</span>
                      <span>80%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-emerald-600 h-2 rounded-full" style={{ width: "80%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>English</span>
                      <span>65%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: "65%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Science</span>
                      <span>45%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: "45%" }}></div>
                    </div>
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

export default StudentDashboard;
