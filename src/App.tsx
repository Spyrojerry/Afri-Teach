import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import { Analytics } from "@vercel/analytics/react";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <Analytics />
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/teachers" element={<PublicFindTeachers />} />
            <Route 
              path="/onboarding" 
              element={
                <ProtectedRoute skipOnboardingCheck={true}>
                  <Onboarding />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/dashboard" 
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/teacher/dashboard" 
              element={
                <ProtectedRoute requiredRole="teacher">
                  <TeacherDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/profile" 
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentProfile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/teacher/profile" 
              element={
                <ProtectedRoute requiredRole="teacher">
                  <TeacherProfile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/find-teachers" 
              element={
                <ProtectedRoute requiredRole="student">
                  <FindTeachers />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/teacher/availability" 
              element={
                <ProtectedRoute requiredRole="teacher">
                  <ManageAvailability />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/lessons" 
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentLessons />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/teacher/schedule" 
              element={
                <ProtectedRoute requiredRole="teacher">
                  <TeacherSchedule />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/book-lesson/:teacherId" 
              element={
                <ProtectedRoute requiredRole="student">
                  <BookLesson />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/classroom/:lessonId" 
              element={
                <ProtectedRoute requiredRole="student">
                  <VirtualClassroomPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/teacher/classroom/:lessonId" 
              element={
                <ProtectedRoute requiredRole="teacher">
                  <VirtualClassroomPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/teacher/earnings" 
              element={
                <ProtectedRoute requiredRole="teacher">
                  <TeacherEarnings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/teacher/lessons" 
              element={
                <ProtectedRoute requiredRole="teacher">
                  <TeacherLessons />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/teacher/students" 
              element={
                <ProtectedRoute requiredRole="teacher">
                  <TeacherStudents />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/teacher/booking-requests" 
              element={
                <ProtectedRoute requiredRole="teacher">
                  <BookingRequests />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/notifications" 
              element={
                <ProtectedRoute requiredRole="student">
                  <Notifications />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/teacher/notifications" 
              element={
                <ProtectedRoute requiredRole="teacher">
                  <Notifications />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/messages" 
              element={
                <ProtectedRoute requiredRole="student">
                  <Messages />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/teacher/messages" 
              element={
                <ProtectedRoute requiredRole="teacher">
                  <Messages />
                </ProtectedRoute>
              } 
            />
            {/* Settings Routes */}
            <Route 
              path="/student/settings" 
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentSettings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/teacher/settings" 
              element={
                <ProtectedRoute requiredRole="teacher">
                  <TeacherSettings />
                </ProtectedRoute>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
