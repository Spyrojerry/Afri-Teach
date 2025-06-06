import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  GraduationCap, 
  Menu, 
  X, 
  Search, 
  Calendar, 
  MessageCircle, 
  Settings, 
  DollarSign, 
  Users, 
  BookOpen, 
  LogOut, 
  User,
  LayoutDashboard,
  Bell,
  ArrowLeft,
  Loader2
} from "lucide-react";
import { Link, useLocation, Navigate, useNavigate } from "react-router-dom";
import { UserAvatar } from "./UserAvatar";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "./ui/badge";
import { 
  getUserNotifications, 
  markNotificationAsRead,
  Notification 
} from "@/services/notificationService";

interface DashboardLayoutProps {
  children: React.ReactNode;
  userType?: "student" | "teacher";
  showBackButton?: boolean;
  backTo?: string;
}

export const DashboardLayout = ({ 
  children, 
  userType, 
  showBackButton = false, 
  backTo 
}: DashboardLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userRole, isLoading, signOut, user } = useAuth();
  
  // Use provided userType or fallback to context userRole
  const actualUserType = userType || userRole;
  
  // Fetch real notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoadingNotifications(true);
        const notificationsData = await getUserNotifications(user.id);
        setNotifications(notificationsData);
      } catch (err) {
        console.error("Error fetching notifications:", err);
        // Fallback to empty array
        setNotifications([]);
      } finally {
        setIsLoadingNotifications(false);
      }
    };
    
    fetchNotifications();
  }, [user?.id]);
  
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
    } catch (err: unknown) {
      console.error("Error marking notification as read:", err instanceof Error ? err.message : String(err));
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
  
  // If loading, show loading state
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  // If no user role is available, redirect to login
  if (!actualUserType) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const studentNavItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/student/dashboard" },
    { icon: BookOpen, label: "My Lessons", href: "/student/lessons" },
    { icon: Search, label: "Find Teachers", href: "/student/find-teachers" },
    { icon: MessageCircle, label: "Messages", href: "/student/messages" },
  ];

  const teacherNavItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/teacher/dashboard" },
    { icon: BookOpen, label: "Lessons", href: "/teacher/lessons" },
    { icon: Users, label: "My Students", href: "/teacher/students" },
    { icon: MessageCircle, label: "Messages", href: "/teacher/messages" },
  ];

  const navItems = actualUserType === "student" ? studentNavItems : teacherNavItems;

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      });
      navigate("/login");
    } catch (error: any) {
      toast({
        title: "Error logging out",
        description: error.message || "An error occurred while logging out",
        variant: "destructive",
      });
    }
    setShowLogoutDialog(false);
  };

  const handleBackClick = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(`/${actualUserType}/profile`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-100 fixed top-0 z-50 w-full">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Menu Button */}
            <div className="flex items-center space-x-4">
              <button
                className="lg:hidden p-2"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                {isSidebarOpen ? (
                  <X className="h-6 w-6 text-gray-600" />
                ) : (
                  <Menu className="h-6 w-6 text-gray-600" />
                )}
              </button>
              
              {showBackButton ? (
                <button 
                  onClick={handleBackClick}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-600">Back to Profile</span>
                </button>
              ) : (
                <Link to="/" className="flex items-center space-x-2">
                  <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 p-2 rounded-lg">
                    <GraduationCap className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 bg-clip-text text-transparent">
                    AfriTeach
                  </span>
                </Link>
              )}
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-6">
              {!showBackButton && navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? "bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 text-white"
                        : "text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
              
            </nav>

            {/* User Avatar with Dropdown */}
            <div className="flex items-center space-x-2">
              {/* Mobile Notifications Button */}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="cursor-pointer">
                    <UserAvatar />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <Link to={`/${actualUserType}/profile`} className="w-full cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    {actualUserType === "teacher" && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to={`/${actualUserType}/schedule`} className="w-full cursor-pointer">
                            <Calendar className="mr-2 h-4 w-4" />
                            <span>My Schedule</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/${actualUserType}/earnings`} className="w-full cursor-pointer">
                            <DollarSign className="mr-2 h-4 w-4" />
                            <span>Earnings</span>
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuItem asChild>
                      <Link to={`/${actualUserType}/settings`} className="w-full cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowLogoutDialog(true)}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
             {/* Notifications Dropdown */}
             {!showBackButton && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="relative flex items-center justify-center p-2 rounded-full hover:bg-gray-100 focus:outline-none">
                      <Bell className="h-5 w-5 text-gray-600" />
                      {notifications.filter(n => !n.isRead).length > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center rounded-full bg-red-500 text-white text-xs">
                          {notifications.filter(n => !n.isRead).length}
                        </span>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-80" align="end">
                    <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {isLoadingNotifications ? (
                      <div className="flex justify-center items-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-purple-600 mr-2" />
                        <span className="text-sm text-gray-500">Loading notifications...</span>
                      </div>
                    ) : notifications.length > 0 ? (
                      <div className="max-h-[300px] overflow-y-auto">
                        {notifications.map((notification) => (
                          <DropdownMenuItem 
                            key={notification.id} 
                            className="flex flex-col items-start py-2"
                            onClick={() => handleMarkAsRead(notification.id)}
                          >
                            <div className="flex justify-between w-full">
                              <p className={!notification.isRead ? "font-medium" : ""}>{notification.title}</p>
                              {!notification.isRead && (
                                <Badge className="ml-2 bg-blue-500 h-2 w-2 rounded-full p-0" />
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            <span className="text-xs text-gray-500 mt-1">
                              {formatRelativeTime(notification.createdAt)}
                            </span>
                          </DropdownMenuItem>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        No new notifications
                      </div>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-center justify-center">
                      <Link to={`/${actualUserType}/notifications`} className="text-sm text-purple-600">View all notifications</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
              
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setIsSidebarOpen(false)}>
          <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Navigation</h3>
            </div>
            <nav className="p-4 space-y-2">
              {!showBackButton && navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 text-white"
                        : "text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
              <div className="border-t my-2"></div>
              <Link
                to={`/${actualUserType}/profile`}
                onClick={() => setIsSidebarOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-gray-600 hover:text-purple-600 hover:bg-purple-50"
              >
                <User className="h-5 w-5" />
                <span className="font-medium">Profile</span>
              </Link>
              {actualUserType === "teacher" && (
                <>
                  <Link
                    to={`/${actualUserType}/schedule`}
                    onClick={() => setIsSidebarOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                  >
                    <Calendar className="h-5 w-5" />
                    <span className="font-medium">My Schedule</span>
                  </Link>
                  <Link
                    to={`/${actualUserType}/earnings`}
                    onClick={() => setIsSidebarOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                  >
                    <DollarSign className="h-5 w-5" />
                    <span className="font-medium">Earnings</span>
                  </Link>
                </>
              )}
              <Link
                to={`/${actualUserType}/settings`}
                onClick={() => setIsSidebarOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-gray-600 hover:text-purple-600 hover:bg-purple-50"
              >
                <Settings className="h-5 w-5" />
                <span className="font-medium">Settings</span>
              </Link>
              <button
                onClick={() => {
                  setIsSidebarOpen(false);
                  setShowLogoutDialog(true);
                }}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-gray-600 hover:text-red-600 hover:bg-red-50 w-full text-left"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Logout</span>
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Logout Confirmation</DialogTitle>
            <DialogDescription>
              Are you sure you want to logout? Any unsaved changes may be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogoutDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleLogout} variant="destructive">
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
};
