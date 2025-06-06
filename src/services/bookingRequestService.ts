import { supabase } from "@/integrations/supabase/client";
import { databaseDiagnostics } from "./databaseDiagnostics";

export interface BookingRequest {
  id: string;
  student_id: string;
  teacher_id: string;
  studentName: string;
  studentAvatar?: string;
  subject: string;
  date: string;
  startTime: string;
  endTime: string;
  message?: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

/**
 * Get all booking requests for a teacher
 */
export const getTeacherBookingRequests = async (teacherId: string): Promise<BookingRequest[]> => {
  try {
    // First check if we're using the new schema or old schema
    const { hasTable } = await databaseDiagnostics;
    
    // Check if booking_requests table exists
    if (await hasTable('booking_requests')) {
      const { data, error } = await supabase
        .from('booking_requests')
        .select(`
          *,
          students:student_id (
            id,
            first_name,
            last_name,
            profile_picture_url
          )
        `)
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching booking requests:", error);
        throw error;
      }
      
      return data.map(request => ({
        id: request.id,
        student_id: request.student_id,
        teacher_id: request.teacher_id,
        studentName: request.students ? `${request.students.first_name} ${request.students.last_name}` : 'Unknown Student',
        studentAvatar: request.students?.profile_picture_url,
        subject: request.subject,
        date: request.date,
        startTime: request.start_time,
        endTime: request.end_time,
        message: request.message,
        status: request.status,
        created_at: request.created_at
      }));
    }
    
    // If the booking_requests table doesn't exist, check if there's a bookings table
    // that might have pending status we can use
    if (await hasTable('bookings')) {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          students:student_id (
            id,
            first_name,
            last_name,
            profile_picture_url
          )
        `)
        .eq('teacher_id', teacherId)
        .in('status', ['pending', 'approved', 'rejected'])
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching bookings:", error);
        throw error;
      }
      
      // Transform bookings to booking requests format
      return data.map(booking => ({
        id: booking.id,
        student_id: booking.student_id,
        teacher_id: booking.teacher_id,
        studentName: booking.students ? `${booking.students.first_name} ${booking.students.last_name}` : 'Unknown Student',
        studentAvatar: booking.students?.profile_picture_url,
        subject: booking.subject || 'Lesson',
        date: booking.date,
        startTime: booking.start_time,
        endTime: booking.end_time,
        message: booking.notes,
        status: booking.status,
        created_at: booking.created_at
      }));
    }
    
    // If no appropriate tables exist, return an empty array
    console.warn("No booking_requests or bookings table found - returning empty array");
    return [];
  } catch (error) {
    console.error("Error fetching teacher booking requests:", error);
    return [];
  }
};

/**
 * Update a booking request status
 */
export const updateBookingRequestStatus = async (
  requestId: string, 
  status: "approved" | "rejected"
): Promise<boolean> => {
  try {
    // First check if we're using the new schema or old schema
    const { hasTable } = await databaseDiagnostics;
    
    // Check if booking_requests table exists
    if (await hasTable('booking_requests')) {
      const { error } = await supabase
        .from('booking_requests')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', requestId);
      
      if (error) {
        console.error("Error updating booking request:", error);
        throw error;
      }
      
      return true;
    }
    
    // If booking_requests doesn't exist, try bookings table
    if (await hasTable('bookings')) {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', requestId);
      
      if (error) {
        console.error("Error updating booking:", error);
        throw error;
      }
      
      return true;
    }
    
    console.warn("No booking_requests or bookings table found - update not performed");
    return false;
  } catch (error) {
    console.error("Error updating booking request:", error);
    return false;
  }
};

// Mock data generator for demo purposes
const getMockBookingRequests = (teacherId: string): BookingRequest[] => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  return [
    {
      id: "req-1",
      student_id: "student-1",
      teacher_id: teacherId,
      studentName: "John Smith",
      studentAvatar: "/avatars/student-1.jpg",
      subject: "Mathematics",
      date: tomorrow.toISOString().split('T')[0],
      startTime: "10:00 AM",
      endTime: "11:00 AM",
      message: "I need help with calculus for my upcoming exam.",
      status: "pending",
      created_at: new Date(Date.now() - 2 * 3600000).toISOString() // 2 hours ago
    },
    {
      id: "req-2",
      student_id: "student-2",
      teacher_id: teacherId,
      studentName: "Emily Johnson",
      studentAvatar: "/avatars/student-2.jpg",
      subject: "Physics",
      date: nextWeek.toISOString().split('T')[0],
      startTime: "2:00 PM",
      endTime: "3:30 PM",
      message: "Would like to schedule a recurring lesson for physics support.",
      status: "pending",
      created_at: new Date(Date.now() - 5 * 3600000).toISOString() // 5 hours ago
    },
    {
      id: "req-3",
      student_id: "student-3",
      teacher_id: teacherId,
      studentName: "Michael Brown",
      studentAvatar: "/avatars/student-3.jpg",
      subject: "Chemistry",
      date: tomorrow.toISOString().split('T')[0],
      startTime: "4:00 PM",
      endTime: "5:00 PM",
      message: "I need assistance with understanding chemical equations.",
      status: "pending",
      created_at: new Date(Date.now() - 1 * 24 * 3600000).toISOString() // 1 day ago
    },
    {
      id: "req-4",
      student_id: "student-4",
      teacher_id: teacherId,
      studentName: "Sarah Wilson",
      studentAvatar: "/avatars/student-4.jpg",
      subject: "Biology",
      date: nextWeek.toISOString().split('T')[0],
      startTime: "9:00 AM",
      endTime: "10:00 AM",
      status: "pending",
      created_at: new Date(Date.now() - 2 * 24 * 3600000).toISOString() // 2 days ago
    }
  ];
}; 