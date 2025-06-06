import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Bell, 
  CheckCircle2, 
  Calendar, 
  DollarSign, 
  MessageCircle, 
  User,
  Trash,
  Filter,
  Loader2
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { 
  getUserNotifications,
  markNotificationAsRead,
  Notification as NotificationType
} from "@/services/notificationService";

const Notifications = () => {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userRole, user } = useAuth();

  // Fetch real notifications data from Supabase
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        console.log("Fetching notifications for user:", user.id);
        
        // Use the notificationService to fetch notifications
        const notificationsData = await getUserNotifications(user.id);
        console.log("Notifications data:", notificationsData);
        
        setNotifications(notificationsData);
      } catch (err) {
        console.error("Error fetching notifications:", err);
        setError("Failed to load notifications. Please try again later.");
        
        // Fallback to mock data
        setNotifications(getMockNotifications());
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchNotifications();
  }, [user?.id]);

  // Mock notifications data for fallback
  const getMockNotifications = (): NotificationType[] => {
    return [
      {
        id: "1",
        userId: user?.id || "",
        title: "New Lesson Booked",
        message: "John Smith has booked a Mathematics lesson with you for tomorrow at 2:00 PM.",
        timestamp: new Date(Date.now() - 10 * 60000).toISOString(), // 10 minutes ago
        isRead: false,
        type: "lesson",
        createdAt: new Date(Date.now() - 10 * 60000).toISOString()
      },
      {
        id: "2",
        userId: user?.id || "",
        title: "Upcoming Lesson Reminder",
        message: "Your lesson with Prof. Chinua Achebe starts in 1 hour. Don't forget to join on time.",
        timestamp: new Date(Date.now() - 55 * 60000).toISOString(), // 55 minutes ago
        isRead: false,
        type: "lesson",
        createdAt: new Date(Date.now() - 55 * 60000).toISOString()
      },
      {
        id: "3",
        userId: user?.id || "",
        title: "Payment Processed",
        message: "Your payment of $50 for last week's lesson has been processed successfully.",
        timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), // 2 hours ago
        isRead: true,
        type: "payment",
        createdAt: new Date(Date.now() - 2 * 3600000).toISOString()
      }
    ];
  };

  // Filter notifications based on selected tab and type
  const filteredNotifications = notifications.filter(notification => {
    // Filter by read/unread
    if (activeTab === "unread" && notification.isRead) {
      return false;
    }
    
    // Filter by type
    if (filterType !== "all" && notification.type !== filterType) {
      return false;
    }
    
    return true;
  });

  // Mark notification as read
  const handleMarkAsRead = async (id: string) => {
    try {
      const success = await markNotificationAsRead(id);
      
      if (success) {
        setNotifications(prevNotifications =>
          prevNotifications.map(notification =>
            notification.id === id ? { ...notification, isRead: true } : notification
          )
        );
      }
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      // Get all unread notification IDs
      const unreadIds = notifications
        .filter(notification => !notification.isRead)
        .map(notification => notification.id);
      
      // Mark each one as read
      for (const id of unreadIds) {
        await markNotificationAsRead(id);
      }
      
      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.map(notification => ({ ...notification, isRead: true }))
      );
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  // Delete notification
  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setNotifications(prevNotifications =>
        prevNotifications.filter(notification => notification.id !== id)
      );
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  // Format timestamp to relative time
  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diff = now.getTime() - date.getTime();
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  // Get icon for notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "lesson":
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case "payment":
        return <DollarSign className="h-5 w-5 text-green-500" />;
      case "message":
        return <MessageCircle className="h-5 w-5 text-purple-500" />;
      case "system":
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <DashboardLayout userType={userRole}>
      <div className="container mx-auto px-4 py-8 pt-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Notifications</h1>
          {notifications.some(n => !n.isRead) && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={markAllAsRead}
              className="flex items-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Mark all as read
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>All Notifications</CardTitle>
                  <CardDescription>
                    Stay updated with your activity on AfriTeach
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="lesson">Lessons</SelectItem>
                      <SelectItem value="payment">Payments</SelectItem>
                      <SelectItem value="message">Messages</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="unread">
                    Unread
                    {notifications.some(n => !n.isRead) && (
                      <Badge className="ml-2 bg-red-500">
                        {notifications.filter(n => !n.isRead).length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                  <span className="ml-2 text-gray-600">Loading notifications...</span>
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
              ) : filteredNotifications.length > 0 ? (
                <div className="space-y-4">
                  {filteredNotifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`p-4 border rounded-lg transition-colors ${
                        notification.isRead ? 'bg-white' : 'bg-blue-50'
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-grow">
                          <div className="flex justify-between items-start">
                            <h3 className="font-medium">{notification.title}</h3>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">
                                {formatRelativeTime(notification.createdAt || notification.timestamp)}
                              </span>
                              <div className="flex">
                                {!notification.isRead && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-8 w-8"
                                          onClick={() => handleMarkAsRead(notification.id)}
                                        >
                                          <CheckCircle2 className="h-4 w-4 text-blue-500" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Mark as read</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8"
                                        onClick={() => deleteNotification(notification.id)}
                                      >
                                        <Trash className="h-4 w-4 text-red-500" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Delete</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-500 mb-1">No notifications found</h3>
                  <p className="text-sm text-gray-400">
                    {activeTab === "unread" 
                      ? "You've read all your notifications" 
                      : filterType !== "all" 
                        ? `No ${filterType} notifications` 
                        : "You don't have any notifications yet"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Notifications; 