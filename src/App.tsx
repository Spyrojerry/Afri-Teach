import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { AuthProvider } from "@/contexts/auth-context";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentProfile from "./pages/StudentProfile";
import TeacherProfile from "./pages/TeacherProfile";
import StudentLessons from "./pages/StudentLessons";
import TeacherSchedule from "./pages/TeacherSchedule";
import TeacherEarnings from "./pages/TeacherEarnings";
import TeacherLessons from "./pages/TeacherLessons";
import TeacherStudents from "./pages/TeacherStudents";
import FindTeachers from "./pages/FindTeachers";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ManageAvailability from "./pages/ManageAvailability";
import BookLesson from "./pages/BookLesson";
import VirtualClassroomPage from "./pages/VirtualClassroomPage";
import NotFound from "./pages/NotFound";
import AuthCallback from "./pages/AuthCallback";
import Onboarding from "./pages/Onboarding";
import Notifications from "./pages/Notifications";
import Messages from "./pages/Messages";
import BookingRequests from "./pages/BookingRequests";
import StudentSettings from "./pages/StudentSettings";
import TeacherSettings from "./pages/TeacherSettings";
import PublicFindTeachers from "./pages/PublicFindTeachers";
import AdminCenter from "./pages/AdminCenter";

const queryClient = new QueryClient();

const protect = (
  element: ReactNode,
  role?: "student" | "teacher" | "admin",
  skipOnboardingCheck = false,
) => (
  <ProtectedRoute requiredRole={role} skipOnboardingCheck={skipOnboardingCheck}>
    {element}
  </ProtectedRoute>
);

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <div key={location.pathname} className="page-transition">
      <Routes location={location}>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/teachers" element={<PublicFindTeachers />} />
        <Route path="/admin" element={protect(<AdminCenter />, "admin")} />
        <Route path="/onboarding" element={protect(<Onboarding />, undefined, true)} />
        <Route path="/student/dashboard" element={protect(<StudentDashboard />, "student")} />
        <Route path="/teacher/dashboard" element={protect(<TeacherDashboard />, "teacher")} />
        <Route path="/student/profile" element={protect(<StudentProfile />, "student")} />
        <Route path="/teacher/profile" element={protect(<TeacherProfile />, "teacher")} />
        <Route path="/student/find-teachers" element={protect(<FindTeachers />, "student")} />
        <Route path="/teacher/availability" element={protect(<ManageAvailability />, "teacher")} />
        <Route path="/student/lessons" element={protect(<StudentLessons />, "student")} />
        <Route path="/teacher/schedule" element={protect(<TeacherSchedule />, "teacher")} />
        <Route path="/student/book-lesson/:teacherId" element={protect(<BookLesson />, "student")} />
        <Route path="/student/classroom/:lessonId" element={protect(<VirtualClassroomPage />, "student")} />
        <Route path="/teacher/classroom/:lessonId" element={protect(<VirtualClassroomPage />, "teacher")} />
        <Route path="/teacher/earnings" element={protect(<TeacherEarnings />, "teacher")} />
        <Route path="/teacher/lessons" element={protect(<TeacherLessons />, "teacher")} />
        <Route path="/teacher/students" element={protect(<TeacherStudents />, "teacher")} />
        <Route path="/teacher/booking-requests" element={protect(<BookingRequests />, "teacher")} />
        <Route path="/student/notifications" element={protect(<Notifications />, "student")} />
        <Route path="/teacher/notifications" element={protect(<Notifications />, "teacher")} />
        <Route path="/student/messages" element={protect(<Messages />, "student")} />
        <Route path="/teacher/messages" element={protect(<Messages />, "teacher")} />
        <Route path="/student/settings" element={protect(<StudentSettings />, "student")} />
        <Route path="/teacher/settings" element={protect(<TeacherSettings />, "teacher")} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <Analytics />
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AnimatedRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
