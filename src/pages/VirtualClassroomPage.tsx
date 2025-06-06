import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { VirtualClassroom } from "@/components/VirtualClassroom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft } from "lucide-react";

// Mock lesson data - in a real app, this would come from the backend
const mockLesson = {
  id: "lesson-1",
  subject: "Advanced Mathematics",
  date: "2024-06-15",
  startTime: "15:00",
  endTime: "16:00",
  status: 'active' as const,
  teacher: {
    id: "teacher-1",
    name: "Dr. Amara Okonkwo",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=100&h=100&fit=crop&crop=face",
  },
  student: {
    id: "student-1",
    name: "Sarah Johnson",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face",
  },
  notes: ""
};

const VirtualClassroomPage = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState(mockLesson);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // In a real app, this would fetch the lesson data from the backend
    const fetchLesson = async () => {
      try {
        // Simulate API call
        setLoading(true);
        
        // Normally you would fetch the lesson data here
        // const response = await api.getLessonById(lessonId);
        // setLesson(response.data);
        
        // For now, we'll just use mock data
        setTimeout(() => {
          // Update mock data with the lessonId from URL
          setLesson({
            ...mockLesson,
            id: lessonId || mockLesson.id
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Error fetching lesson:", error);
        setError("Failed to load the lesson. Please try again later.");
        setLoading(false);
        
        toast({
          title: "Error",
          description: "Failed to load the lesson. Please try again later.",
          variant: "destructive",
        });
      }
    };
    
    if (lessonId) {
      fetchLesson();
    } else {
      setError("Lesson ID is required");
      setLoading(false);
    }
  }, [lessonId, toast]);
  
  const handleEndSession = () => {
    toast({
      title: "Session Ended",
      description: "Your virtual classroom session has ended.",
    });
    
    // Navigate back to dashboard
    if (userRole === 'teacher') {
      navigate('/teacher/dashboard');
    } else {
      navigate('/student/dashboard');
    }
  };
  
  const handleBackToDashboard = () => {
    // Navigate back to dashboard
    if (userRole === 'teacher') {
      navigate('/teacher/dashboard');
    } else {
      navigate('/student/dashboard');
    }
  };
  
  if (loading) {
    return (
      <DashboardLayout userType={userRole || undefined}>
        <div className="flex items-center justify-center h-[70vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (error) {
    return (
      <DashboardLayout userType={userRole || undefined}>
        <div className="flex flex-col items-center justify-center h-[70vh]">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={handleBackToDashboard}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout userType={userRole || undefined}>
      <div className="mb-4">
        <Button variant="outline" size="sm" onClick={handleBackToDashboard}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
      
      <VirtualClassroom 
        lesson={lesson}
        userRole={userRole || 'student'}
        userId={user?.id || ''}
        onEndSession={handleEndSession}
      />
    </DashboardLayout>
  );
};

export default VirtualClassroomPage; 