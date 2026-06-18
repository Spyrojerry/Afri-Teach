import { supabase } from "@/integrations/supabase/client";
import { emailService } from "@/services/emailService";

// Interface for booking data
export interface BookingData {
  teacher_id: string;
  student_id: string;
  subject: string;
  module_id?: string; // Optional module ID for tracking progress
  date: string;
  start_time: string;
  end_time: string;
  start_time_utc: string;
  end_time_utc: string;
  message?: string;
  meeting_link?: string;
  notes?: string;
}

// Interface for module data
export interface LearningModule {
  id: string;
  name: string;
  description: string;
  subject: string;
  level: string;
  lessons: number;
  completed_lessons?: number;
  progress?: number;
}

/**
 * Create a new booking request
 * @param bookingData The booking data
 * @returns The created booking request
 */
export const createBookingRequest = async (bookingData: BookingData) => {
  try {
    const { data, error } = await supabase
      .from('booking_requests')
      .insert([{
        teacher_id: bookingData.teacher_id,
        student_id: bookingData.student_id,
        subject: bookingData.subject,
        date: bookingData.date,
        start_time: bookingData.start_time,
        end_time: bookingData.end_time,
        message: bookingData.message || "",
      }])
      .select()
      .single();

    if (error) {
      console.error("Error creating booking request:", error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error("Failed to create booking request:", err);
    throw err;
  }
};

/**
 * Create a booking directly (for immediate booking)
 * @param bookingData The booking data
 * @returns The created booking
 */
export const createBooking = async (bookingData: BookingData) => {
  try {
    const { data, error } = await supabase
      .rpc('create_booking', {
        p_teacher_id: bookingData.teacher_id,
        p_subject: bookingData.subject,
        p_start_time_utc: bookingData.start_time_utc,
        p_end_time_utc: bookingData.end_time_utc,
        p_module_id: bookingData.module_id || null,
        p_notes: bookingData.notes || null,
      });

    if (error) {
      console.error("Error creating booking:", error);
      throw error;
    }

    const booking = Array.isArray(data) ? data[0] : data;
    if (booking?.id) {
      // Email delivery is non-blocking; the confirmed booking remains valid if
      // the mail provider is temporarily unavailable.
      void emailService.sendBookingConfirmation(booking.id);
    }
    return booking;
  } catch (err) {
    console.error("Failed to create booking:", err);
    throw err;
  }
};

/**
 * Get available learning modules for a subject
 * @param subject The subject
 * @returns List of available modules
 */
export const getModulesForSubject = async (subject: string): Promise<LearningModule[]> => {
  try {
    // Try to fetch from actual modules table if it exists
    let { data, error } = await supabase
      .from('learning_modules')
      .select('*')
      .eq('subject', subject);
    
    if (error) throw error;
    
    return data || [];
  } catch (err) {
    console.error("Failed to fetch modules:", err);
    return [];
  }
};

/**
 * Get student progress for a specific module
 * @param studentId The student's ID
 * @param moduleId The module ID
 * @returns The module with progress information
 */
export const getStudentModuleProgress = async (
  studentId: string,
  moduleId: string
): Promise<LearningModule | null> => {
  try {
    const [{ data: progressData, error: progressError }, { data: moduleData, error: moduleError }] =
      await Promise.all([
        supabase
          .from('student_progress')
          .select('completed_lessons')
          .eq('student_id', studentId)
          .eq('module_id', moduleId)
          .maybeSingle(),
        supabase
          .from('learning_modules')
          .select('*')
          .eq('id', moduleId)
          .maybeSingle(),
      ]);

    if (progressError || moduleError || !moduleData) return null;

    const completedLessons = progressData?.completed_lessons || 0;
    return {
      ...moduleData,
      completed_lessons: completedLessons,
      progress: moduleData.lessons > 0
        ? (completedLessons / moduleData.lessons) * 100
        : 0,
    };
  } catch (err) {
    console.error("Failed to fetch module progress:", err);
    return null;
  }
}; 
