import { supabase } from "@/integrations/supabase/client";
import { findCommonUserIdColumn } from "@/utils/databaseDiagnostics";

export interface Lesson {
  id: string;
  subject: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled';
  teacherId: string;
  studentId: string;
  teacherName?: string;
  teacherAvatar?: string;
  studentName?: string;
  studentAvatar?: string;
  createdAt?: string;
}

/**
 * Fetches upcoming lessons for a user
 * @param userId The user's ID
 * @param role The user's role (student or teacher)
 * @returns Array of upcoming lessons
 */
export const getUpcomingLessons = async (userId: string, role: 'student' | 'teacher'): Promise<Lesson[]> => {
  try {
    // Use the database function to get upcoming lessons
    let { data, error } = await supabase
      .rpc('get_upcoming_lessons', { 
        user_id: userId,
        role: role
      });

    if (error) {
      console.error('Error fetching upcoming lessons:', error);
      
      // Fallback to direct query if RPC fails
      try {
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select(`
            id,
            lessons(title),
            start_time_utc,
            end_time_utc,
            status,
            teacher_id,
            student_id,
            created_at
          `)
          .eq(role === 'student' ? 'student_id' : 'teacher_id', userId)
          .in('status', ['pending', 'confirmed'])
          .gt('start_time_utc', new Date().toISOString())
          .order('start_time_utc', { ascending: true });
        
        if (bookingsError) {
          console.error('Error in fallback query for upcoming lessons:', bookingsError);
          return [];
        }
        
        data = bookingsData?.map(booking => ({
          id: booking.id,
          subject: booking.lessons?.title || 'Untitled Lesson',
          date: new Date(booking.start_time_utc).toISOString().split('T')[0],
          start_time: new Date(booking.start_time_utc).toTimeString().substring(0, 5),
          end_time: new Date(booking.end_time_utc).toTimeString().substring(0, 5),
          status: booking.status,
          teacher_id: booking.teacher_id,
          student_id: booking.student_id,
          created_at: booking.created_at
        })) || [];
      } catch (fallbackError) {
        console.error('Fallback query failed:', fallbackError);
        return [];
      }
    }
    
    // Get teacher and student profile information separately
    const lessons = data || [];
    
    // Collect unique teacher and student IDs
    const teacherIds = [...new Set(lessons.map(lesson => lesson.teacher_id))];
    const studentIds = [...new Set(lessons.map(lesson => lesson.student_id))];
    
    // Try using the new helper functions first
    let teacherProfiles;
    let teacherError;
    let studentProfiles;
    let studentError;
    
    try {
      // Try using the helper functions
      const { data: tData, error: tError } = await supabase
        .rpc('get_teacher_profile_info', { teacher_ids: teacherIds });
      
      teacherProfiles = tData;
      teacherError = tError;
      
      const { data: sData, error: sError } = await supabase
        .rpc('get_student_profile_info', { student_ids: studentIds });
      
      studentProfiles = sData;
      studentError = sError;
    } catch (funcError) {
      // Fallback to the views if the functions aren't available
      const { data: tData, error: tError } = await supabase
        .from('teacher_profiles')
        .select('id, full_name, avatar_url')
        .in('id', teacherIds);
        
      teacherProfiles = tData;
      teacherError = tError;
      
      const { data: sData, error: sError } = await supabase
        .from('student_profiles')
        .select('id, full_name, avatar_url')
        .in('id', studentIds);
        
      studentProfiles = sData;
      studentError = sError;
      
      // If views also fail, try direct table access
      if (tError || sError) {
        try {
          const { data: teachersData } = await supabase
            .from('teachers')
            .select('id, first_name, last_name, profile_picture_url')
            .in('id', teacherIds);
            
          teacherProfiles = teachersData?.map(t => ({
            id: t.id,
            full_name: `${t.first_name} ${t.last_name}`,
            avatar_url: t.profile_picture_url
          }));
          
          const { data: studentsData } = await supabase
            .from('students')
            .select('id, first_name, last_name, profile_picture_url')
            .in('id', studentIds);
            
          studentProfiles = studentsData?.map(s => ({
            id: s.id,
            full_name: `${s.first_name} ${s.last_name}`,
            avatar_url: s.profile_picture_url
          }));
        } catch (directError) {
          console.error('Direct table access failed:', directError);
        }
      }
    }
    
    if (teacherError) {
      console.error('Error fetching teacher profiles:', teacherError);
    }
    
    if (studentError) {
      console.error('Error fetching student profiles:', studentError);
    }
    
    // Create lookup maps
    const teacherMap = new Map(
      (teacherProfiles || []).map(teacher => [teacher.id, teacher])
    );
    
    const studentMap = new Map(
      (studentProfiles || []).map(student => [student.id, student])
    );

    // Transform data to match the expected format
    return lessons.map(lesson => {
      const teacher = teacherMap.get(lesson.teacher_id);
      const student = studentMap.get(lesson.student_id);
      
      return {
        id: lesson.id,
        subject: lesson.subject,
        date: lesson.date,
        startTime: lesson.start_time,
        endTime: lesson.end_time,
        status: lesson.status,
        teacherId: lesson.teacher_id,
        studentId: lesson.student_id,
        teacherName: teacher?.full_name || 'Unknown Teacher',
        teacherAvatar: teacher?.avatar_url,
        studentName: student?.full_name || 'Unknown Student',
        studentAvatar: student?.avatar_url,
        createdAt: lesson.created_at
      };
    });
  } catch (error) {
    console.error('Unexpected error in getUpcomingLessons:', error);
    return [];
  }
};

/**
 * Fetches past lessons for a user
 * @param userId The user's ID
 * @param role The user's role (student or teacher)
 * @returns Array of past lessons
 */
export const getPastLessons = async (userId: string, role: 'student' | 'teacher'): Promise<Lesson[]> => {
  try {
    // Use the database function to get past lessons
    let { data, error } = await supabase
      .rpc('get_past_lessons', { 
        user_id: userId,
        role: role
      });

    if (error) {
      console.error('Error fetching past lessons:', error);
      
      // Fallback to direct query if RPC fails
      try {
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select(`
            id,
            lessons(title),
            start_time_utc,
            end_time_utc,
            status,
            teacher_id,
            student_id,
            created_at
          `)
          .eq(role === 'student' ? 'student_id' : 'teacher_id', userId)
          .or(`status.eq.completed,start_time_utc.lt.${new Date().toISOString()}`)
          .order('start_time_utc', { ascending: false });
        
        if (bookingsError) {
          console.error('Error in fallback query for past lessons:', bookingsError);
          return [];
        }
        
        data = bookingsData?.map(booking => ({
          id: booking.id,
          subject: booking.lessons?.title || 'Untitled Lesson',
          date: new Date(booking.start_time_utc).toISOString().split('T')[0],
          start_time: new Date(booking.start_time_utc).toTimeString().substring(0, 5),
          end_time: new Date(booking.end_time_utc).toTimeString().substring(0, 5),
          status: booking.status,
          teacher_id: booking.teacher_id,
          student_id: booking.student_id,
          created_at: booking.created_at
        })) || [];
      } catch (fallbackError) {
        console.error('Fallback query failed:', fallbackError);
        return [];
      }
    }
    
    // Rest of the code is the same as getUpcomingLessons...
    const lessons = data || [];
    
    // Collect unique teacher and student IDs
    const teacherIds = [...new Set(lessons.map(lesson => lesson.teacher_id))];
    const studentIds = [...new Set(lessons.map(lesson => lesson.student_id))];
    
    // Try using the new helper functions first
    let teacherProfiles;
    let teacherError;
    let studentProfiles;
    let studentError;
    
    try {
      // Try using the helper functions
      const { data: tData, error: tError } = await supabase
        .rpc('get_teacher_profile_info', { teacher_ids: teacherIds });
      
      teacherProfiles = tData;
      teacherError = tError;
      
      const { data: sData, error: sError } = await supabase
        .rpc('get_student_profile_info', { student_ids: studentIds });
      
      studentProfiles = sData;
      studentError = sError;
    } catch (funcError) {
      // Fallback to the views if the functions aren't available
      const { data: tData, error: tError } = await supabase
        .from('teacher_profiles')
        .select('id, full_name, avatar_url')
        .in('id', teacherIds);
        
      teacherProfiles = tData;
      teacherError = tError;
      
      const { data: sData, error: sError } = await supabase
        .from('student_profiles')
        .select('id, full_name, avatar_url')
        .in('id', studentIds);
        
      studentProfiles = sData;
      studentError = sError;
      
      // If views also fail, try direct table access
      if (tError || sError) {
        try {
          const { data: teachersData } = await supabase
            .from('teachers')
            .select('id, first_name, last_name, profile_picture_url')
            .in('id', teacherIds);
            
          teacherProfiles = teachersData?.map(t => ({
            id: t.id,
            full_name: `${t.first_name} ${t.last_name}`,
            avatar_url: t.profile_picture_url
          }));
          
          const { data: studentsData } = await supabase
            .from('students')
            .select('id, first_name, last_name, profile_picture_url')
            .in('id', studentIds);
            
          studentProfiles = studentsData?.map(s => ({
            id: s.id,
            full_name: `${s.first_name} ${s.last_name}`,
            avatar_url: s.profile_picture_url
          }));
        } catch (directError) {
          console.error('Direct table access failed:', directError);
        }
      }
    }
    
    // Create lookup maps
    const teacherMap = new Map(
      (teacherProfiles || []).map(teacher => [teacher.id, teacher])
    );
    
    const studentMap = new Map(
      (studentProfiles || []).map(student => [student.id, student])
    );

    // Transform data to match the expected format
    return lessons.map(lesson => {
      const teacher = teacherMap.get(lesson.teacher_id);
      const student = studentMap.get(lesson.student_id);
      
      return {
        id: lesson.id,
        subject: lesson.subject,
        date: lesson.date,
        startTime: lesson.start_time,
        endTime: lesson.end_time,
        status: lesson.status,
        teacherId: lesson.teacher_id,
        studentId: lesson.student_id,
        teacherName: teacher?.full_name || 'Unknown Teacher',
        teacherAvatar: teacher?.avatar_url,
        studentName: student?.full_name || 'Unknown Student',
        studentAvatar: student?.avatar_url,
        createdAt: lesson.created_at
      };
    });
  } catch (error) {
    console.error('Unexpected error in getPastLessons:', error);
    return [];
  }
};

/**
 * Gets lesson statistics for a user
 * @param userId The user's ID
 * @param role The user's role (student or teacher)
 * @returns Object containing lesson statistics
 */
export const getLessonStats = async (userId: string, role: 'student' | 'teacher') => {
  try {
    // First try to use the RPC function
    const { data, error } = await supabase
      .rpc('get_lesson_stats', {
        user_id: userId,
        role: role
      });

    if (error) {
      console.error('Error fetching lesson stats:', error);
      
      // Fallback to direct query
      try {
        const today = new Date().toISOString();
        
        // Get number of upcoming bookings
        const { count: upcomingCount, error: upcomingError } = await supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq(role === 'student' ? 'student_id' : 'teacher_id', userId)
          .gte('start_time_utc', today)
          .in('status', ['pending', 'confirmed']);
    
        // Get number of completed bookings
        const { count: completedCount, error: completedError } = await supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq(role === 'student' ? 'student_id' : 'teacher_id', userId)
          .eq('status', 'completed');
    
        // Get unique teachers or students the user has had lessons with
        const { data: uniqueUsers, error: uniqueError } = await supabase
          .from('bookings')
          .select(role === 'student' ? 'teacher_id' : 'student_id')
          .eq(role === 'student' ? 'student_id' : 'teacher_id', userId)
          .not('status', 'is', null);
    
        // Calculate total study hours (from lesson durations)
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('bookings')
          .select('lessons(duration_minutes)')
          .eq(role === 'student' ? 'student_id' : 'teacher_id', userId)
          .eq('status', 'completed');
    
        if (upcomingError || completedError || uniqueError || lessonsError) {
          console.error('Error in fallback queries:', upcomingError || completedError || uniqueError || lessonsError);
          return {
            upcomingLessons: 0,
            completedLessons: 0,
            uniqueConnections: 0,
            totalHours: 0
          };
        }
    
        // Calculate total hours
        let totalMinutes = 0;
        lessonsData?.forEach(booking => {
          if (booking.lessons && booking.lessons.duration_minutes) {
            totalMinutes += booking.lessons.duration_minutes;
          }
        });
    
        return {
          upcomingLessons: upcomingCount || 0,
          completedLessons: completedCount || 0,
          uniqueConnections: new Set(uniqueUsers?.map(u => role === 'student' ? u.teacher_id : u.student_id)).size,
          totalHours: Math.round(totalMinutes / 60)
        };
      } catch (fallbackError) {
        console.error('Fallback stats query failed:', fallbackError);
        return {
          upcomingLessons: 0,
          completedLessons: 0,
          uniqueConnections: 0,
          totalHours: 0
        };
      }
    }

    return {
      upcomingLessons: data.upcomingLessons || 0,
      completedLessons: data.completedLessons || 0,
      uniqueConnections: data.uniqueConnections || 0,
      totalHours: data.totalHours || 0
    };
  } catch (error) {
    console.error('Unexpected error in getLessonStats:', error);
    return {
      upcomingLessons: 0,
      completedLessons: 0,
      uniqueConnections: 0,
      totalHours: 0
    };
  }
}; 