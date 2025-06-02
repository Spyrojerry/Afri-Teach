
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GraduationCap, Menu, X, Search, Calendar, MessageCircle, Settings, DollarSign, Users, BookOpen } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface DashboardLayoutProps {
  children: React.ReactNode;
  userType: "student" | "teacher";
}

export const DashboardLayout = ({ children, userType }: DashboardLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const studentNavItems = [
    { icon: Search, label: "Find Teachers", href: "/student/find-teachers" },
    { icon: Calendar, label: "My Schedule", href: "/student/schedule" },
    { icon: BookOpen, label: "My Lessons", href: "/student/lessons" },
    { icon: MessageCircle, label: "Messages", href: "/student/messages" },
    { icon: Settings, label: "Settings", href: "/student/settings" },
  ];

  const teacherNavItems = [
    { icon: Calendar, label: "My Schedule", href: "/teacher/schedule" },
    { icon: Users, label: "My Students", href: "/teacher/students" },
    { icon: BookOpen, label: "Lessons", href: "/teacher/lessons" },
    { icon: DollarSign, label: "Earnings", href: "/teacher/earnings" },
    { icon: MessageCircle, label: "Messages", href: "/teacher/messages" },
    { icon: Settings, label: "Settings", href: "/teacher/settings" },
  ];

  const navItems = userType === "student" ? studentNavItems : teacherNavItems;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 w-full">
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
              
              <Link to="/" className="flex items-center space-x-2">
                <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-2 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">
                  AfriTeach
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-6">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? "bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 text-white"
                        : "text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-purple-600">
                Profile
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-red-600">
                Logout
              </Button>
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
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 text-white"
                        : "text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};
