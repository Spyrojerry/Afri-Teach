import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'student' | 'teacher' | 'admin';
  skipOnboardingCheck?: boolean;
}

export const ProtectedRoute = ({ 
  children, 
  requiredRole,
  skipOnboardingCheck = false
}: ProtectedRouteProps) => {
  const { user, userRole, isLoading } = useAuth();
  const location = useLocation();
  const onboardingCompleted = user?.user_metadata?.onboarding_completed === true;
  const isOnboardingPath = location.pathname === '/onboarding';

  if (isLoading) {
    // You could render a loading spinner here
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user needs to complete onboarding
  if (!skipOnboardingCheck && !onboardingCompleted && !isOnboardingPath) {
    return <Navigate to="/onboarding" replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    // Redirect to appropriate dashboard or unauthorized page
    if (userRole === 'student') {
      return <Navigate to="/student/dashboard" replace />;
    } else if (userRole === 'teacher') {
      return <Navigate to="/teacher/dashboard" replace />;
    } else {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};