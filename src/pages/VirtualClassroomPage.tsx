import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { VirtualClassroom } from "@/components/VirtualClassroom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/integrations/supabase/client";

interface ClassroomLesson {
  id: string;
  subject: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "scheduled" | "active" | "completed" | "cancelled";
  meetingLink?: string;
  teacher: { id: string; name: string; avatar?: string };
  student: { id: string; name: string; avatar?: string };
  notes?: string;
}

const VirtualClassroomPage = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [lesson, setLesson] = useState<ClassroomLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLesson = async () => {
      if (!lessonId || !user?.id) return;

      setLoading(true);
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .select("id, subject, student_id, teacher_id, start_time_utc, end_time_utc, status, meeting_link, notes")
        .eq("id", lessonId)
        .maybeSingle();

      if (bookingError || !booking) {
        setError(bookingError?.message || "Lesson not found.");
        setLoading(false);
        return;
      }

      if (booking.student_id !== user.id && booking.teacher_id !== user.id) {
        setError("You do not have access to this classroom.");
        setLoading(false);
        return;
      }

      const [{ data: teacher }, { data: student }] = await Promise.all([
        supabase
          .from("teachers")
          .select("id, first_name, last_name, profile_picture_url")
          .eq("id", booking.teacher_id)
          .single(),
        supabase
          .from("students")
          .select("id, first_name, last_name, profile_picture_url")
          .eq("id", booking.student_id)
          .single(),
      ]);

      const start = new Date(booking.start_time_utc);
      const end = new Date(booking.end_time_utc);
      const now = new Date();
      const status =
        booking.status === "cancelled"
          ? "cancelled"
          : booking.status === "completed" || end < now
            ? "completed"
            : start <= now && end >= now
              ? "active"
              : "scheduled";

      setLesson({
        id: booking.id,
        subject: booking.subject || "Lesson",
        date: start.toISOString().slice(0, 10),
        startTime: start.toTimeString().slice(0, 5),
        endTime: end.toTimeString().slice(0, 5),
        status,
        meetingLink: booking.meeting_link,
        notes: booking.notes,
        teacher: {
          id: booking.teacher_id,
          name: teacher ? `${teacher.first_name} ${teacher.last_name}` : "Teacher",
          avatar: teacher?.profile_picture_url,
        },
        student: {
          id: booking.student_id,
          name: student ? `${student.first_name} ${student.last_name}` : "Student",
          avatar: student?.profile_picture_url,
        },
      });
      setLoading(false);
    };

    fetchLesson();
  }, [lessonId, user?.id]);

  const backToDashboard = () =>
    navigate(userRole === "teacher" ? "/teacher/dashboard" : "/student/dashboard");

  if (loading) {
    return (
      <DashboardLayout userType={userRole || undefined}>
        <div className="flex h-[70vh] items-center justify-center">Loading classroom…</div>
      </DashboardLayout>
    );
  }

  if (error || !lesson) {
    return (
      <DashboardLayout userType={userRole || undefined}>
        <div className="flex h-[70vh] flex-col items-center justify-center gap-4">
          <p className="text-red-500">{error || "Lesson not found."}</p>
          <Button onClick={backToDashboard}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType={userRole || undefined}>
      <Button variant="outline" size="sm" onClick={backToDashboard} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>
      <VirtualClassroom
        lesson={lesson}
        userRole={userRole === "teacher" ? "teacher" : "student"}
        userId={user?.id || ""}
        onEndSession={backToDashboard}
      />
    </DashboardLayout>
  );
};

export default VirtualClassroomPage;
