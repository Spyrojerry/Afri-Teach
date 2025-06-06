import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth-context";

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
      .from('bookings')
      .insert([{
        teacher_id: bookingData.teacher_id,
        student_id: bookingData.student_id,
        subject: bookingData.subject,
        module_id: bookingData.module_id,
        date: bookingData.date,
        start_time: bookingData.start_time,
        end_time: bookingData.end_time,
        start_time_utc: bookingData.start_time_utc,
        end_time_utc: bookingData.end_time_utc,
        notes: bookingData.notes || "",
        meeting_link: bookingData.meeting_link || "",
        status: "confirmed"
      }])
      .select()
      .single();

    if (error) {
      console.error("Error creating booking:", error);
      throw error;
    }

    // Create a notification for the teacher
    await createBookingNotification(
      bookingData.teacher_id, 
      bookingData.student_id, 
      data.id,
      bookingData.subject
    );

    return data;
  } catch (err) {
    console.error("Failed to create booking:", err);
    throw err;
  }
};

/**
 * Create a notification for a new booking
 * @param teacherId The teacher's ID
 * @param studentId The student's ID
 * @param bookingId The booking ID
 * @param subject The subject of the booking
 */
const createBookingNotification = async (
  teacherId: string,
  studentId: string,
  bookingId: string,
  subject: string
) => {
  try {
    // Get student name
    const { data: studentData } = await supabase
      .from('students')
      .select('first_name, last_name')
      .eq('id', studentId)
      .single();

    const studentName = studentData 
      ? `${studentData.first_name} ${studentData.last_name}`
      : "A student";

    // Create notification for teacher
    await supabase
      .from('notifications')
      .insert([{
        user_id: teacherId,
        type: 'new_booking',
        message: `${studentName} has booked a ${subject} lesson with you.`,
        is_read: false,
        related_entity_id: bookingId,
        related_entity_type: 'booking'
      }]);

  } catch (err) {
    console.error("Failed to create notification:", err);
    // Don't throw here, as this is a non-critical operation
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
    
    if (error || !data || data.length === 0) {
      // If no modules found or table doesn't exist, return mock modules
      return getMockModules(subject);
    }
    
    return data;
  } catch (err) {
    console.error("Failed to fetch modules:", err);
    return getMockModules(subject);
  }
};

/**
 * Get mock modules for testing when no real modules exist
 * @param subject The subject
 * @returns List of mock modules
 */
const getMockModules = (subject: string): LearningModule[] => {
  // Create subject-specific mock modules
  let modules: LearningModule[] = [];
  
  if (subject.toLowerCase().includes('math')) {
    modules = [
      {
        id: 'm1',
        name: 'Algebra Fundamentals',
        description: 'Master the basics of algebraic expressions and equations',
        subject: 'Mathematics',
        level: 'Beginner',
        lessons: 10
      },
      {
        id: 'm2',
        name: 'Geometry Essentials',
        description: 'Learn about shapes, angles, and spatial relationships',
        subject: 'Mathematics',
        level: 'Intermediate',
        lessons: 8
      },
      {
        id: 'm3',
        name: 'Calculus Introduction',
        description: 'Begin your journey into differential and integral calculus',
        subject: 'Mathematics',
        level: 'Advanced',
        lessons: 12
      }
    ];
  } else if (subject.toLowerCase().includes('physics')) {
    modules = [
      {
        id: 'p1',
        name: 'Mechanics Basics',
        description: 'Understand motion, forces, and energy',
        subject: 'Physics',
        level: 'Beginner',
        lessons: 9
      },
      {
        id: 'p2',
        name: 'Electricity & Magnetism',
        description: 'Explore electric charges, fields, and magnetic phenomena',
        subject: 'Physics',
        level: 'Intermediate',
        lessons: 10
      }
    ];
  } else if (subject.toLowerCase().includes('english')) {
    modules = [
      {
        id: 'e1',
        name: 'Grammar Foundations',
        description: 'Master English grammar rules and applications',
        subject: 'English',
        level: 'Beginner',
        lessons: 8
      },
      {
        id: 'e2',
        name: 'Essay Writing',
        description: 'Learn to craft compelling essays with proper structure',
        subject: 'English',
        level: 'Intermediate',
        lessons: 6
      }
    ];
  } else {
    // Generic modules for any other subject
    modules = [
      {
        id: 'g1',
        name: 'Fundamentals',
        description: `Basic concepts in ${subject}`,
        subject: subject,
        level: 'Beginner',
        lessons: 8
      },
      {
        id: 'g2',
        name: 'Intermediate Concepts',
        description: `Build on the basics of ${subject}`,
        subject: subject,
        level: 'Intermediate',
        lessons: 10
      },
      {
        id: 'g3',
        name: 'Advanced Topics',
        description: `Tackle complex problems in ${subject}`,
        subject: subject,
        level: 'Advanced',
        lessons: 12
      }
    ];
  }
  
  return modules;
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
    // First check if we have a student_progress table
    const { data: progressData, error: progressError } = await supabase
      .from('student_progress')
      .select('*')
      .eq('student_id', studentId)
      .eq('module_id', moduleId)
      .single();
    
    if (!progressError && progressData) {
      // Get the module details
      const { data: moduleData } = await supabase
        .from('learning_modules')
        .select('*')
        .eq('id', moduleId)
        .single();
      
      if (moduleData) {
        return {
          ...moduleData,
          completed_lessons: progressData.completed_lessons,
          progress: (progressData.completed_lessons / moduleData.lessons) * 100
        };
      }
    }
    
    // If no real data, create mock progress
    const allModules = await getModulesForSubject('');
    const module = allModules.find(m => m.id === moduleId);
    
    if (module) {
      const completed = Math.floor(Math.random() * module.lessons);
      return {
        ...module,
        completed_lessons: completed,
        progress: (completed / module.lessons) * 100
      };
    }
    
    return null;
  } catch (err) {
    console.error("Failed to fetch module progress:", err);
    return null;
  }
}; 