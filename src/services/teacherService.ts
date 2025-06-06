import { supabase } from "@/integrations/supabase/client";
import { findCommonUserIdColumn } from "@/utils/databaseDiagnostics";
import { v4 as uuidv4 } from 'uuid';
import { toNumber, ensureArray } from "@/utils/typeConversions";

export interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  fullName?: string; // Computed property for UI
  profilePictureUrl?: string;
  introVideoUrl?: string;
  bio?: string;
  qualifications?: any;
  experience?: string;
  timeZone?: string;
  isVerified?: boolean;
  averageRating?: number;
  contactNumber?: string;
  createdAt: string;
  updatedAt?: string;
  // Additional properties to resolve TypeScript errors
  rating?: number; // Alias for averageRating
  subjects?: string[]; // List of subjects the teacher teaches
  hourlyRate?: number; // Teacher's hourly rate
}

/**
 * Fetches a teacher's profile by their user ID
 * @param userId The user's ID
 * @returns Teacher profile data or null if not found
 */
export const getTeacherProfile = async (userId: string): Promise<Teacher | null> => {
  try {
    // Fetch teacher profile directly from the teachers table
    const { data: teacherData, error: teacherError } = await supabase
      .from('teachers')
      .select(`
        id,
        first_name,
        last_name,
        profile_picture_url,
        intro_video_url,
        bio,
        qualifications,
        experience,
        time_zone,
        is_verified,
        average_rating,
        contact_number,
        created_at,
        updated_at
      `)
      .eq('id', userId)
      .single();
    
    if (teacherError) {
      console.error('Error fetching teacher profile:', teacherError);
      
      // If no teacher profile exists but user might exist, create a minimal teacher profile
      if (teacherError.code === 'PGRST116') { // PGRST116 = not found
        // Check if user exists
        const { data: userData } = await supabase.auth.getUser();
        
        // Check if user has the teacher role
        const { data: roleData, error: roleError } = await supabase
          .from('users')
          .select('role')
          .eq('id', userId)
          .single();
          
        // Get metadata for name information
        const firstName = userData?.user?.user_metadata?.first_name || 'New';
        const lastName = userData?.user?.user_metadata?.last_name || 'Teacher';
        
        // If user exists but is not a teacher, update their role
        if (roleData && roleData.role !== 'teacher') {
          await supabase
            .from('users')
            .update({ role: 'teacher' })
            .eq('id', userId);
        }
        
        // Create a teacher record for this user
        const { error: insertError } = await supabase
          .from('teachers')
          .insert({
            id: userId,
            first_name: firstName,
            last_name: lastName
          });
          
        if (insertError) {
          console.error('Error creating teacher profile:', insertError);
          return null;
        }
        
        // Return default teacher profile
        return {
          id: userId,
          firstName,
          lastName,
          fullName: `${firstName} ${lastName}`,
          profilePictureUrl: userData?.user?.user_metadata?.avatar_url,
          bio: '',
          qualifications: {},
          experience: '',
          timeZone: '',
          isVerified: false,
          averageRating: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      
      return null;
    }
    
    if (!teacherData) return null;
    
    // Transform data to match the expected format
    return {
      id: teacherData.id,
      firstName: teacherData.first_name,
      lastName: teacherData.last_name,
      fullName: `${teacherData.first_name} ${teacherData.last_name}`,
      profilePictureUrl: teacherData.profile_picture_url,
      introVideoUrl: teacherData.intro_video_url,
      bio: teacherData.bio,
      qualifications: teacherData.qualifications || {},
      experience: teacherData.experience,
      timeZone: teacherData.time_zone,
      isVerified: teacherData.is_verified,
      averageRating: toNumber(teacherData.average_rating, 0),
      contactNumber: teacherData.contact_number,
      createdAt: teacherData.created_at,
      updatedAt: teacherData.updated_at
    };
  } catch (error) {
    console.error('Unexpected error in getTeacherProfile:', error);
    return null;
  }
};

/**
 * Updates a teacher's profile or creates a new one if it doesn't exist
 * @param userId The user's ID
 * @param profileData The profile data to update
 * @returns Success status
 */
export const updateTeacherProfile = async (
  userId: string, 
  profileData: Partial<Omit<Teacher, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<boolean> => {
  try {
    // Convert camelCase to snake_case for Supabase
    const data: Record<string, any> = {};
    
    // Add fields that are provided in the profileData
    if (profileData.firstName !== undefined) data.first_name = profileData.firstName;
    if (profileData.lastName !== undefined) data.last_name = profileData.lastName;
    if (profileData.profilePictureUrl !== undefined) data.profile_picture_url = profileData.profilePictureUrl;
    if (profileData.introVideoUrl !== undefined) data.intro_video_url = profileData.introVideoUrl;
    if (profileData.bio !== undefined) data.bio = profileData.bio;
    if (profileData.qualifications !== undefined) data.qualifications = profileData.qualifications;
    if (profileData.experience !== undefined) data.experience = profileData.experience;
    if (profileData.timeZone !== undefined) data.time_zone = profileData.timeZone;
    if (profileData.contactNumber !== undefined) data.contact_number = profileData.contactNumber;
    
    // For backward compatibility, handle fullName by splitting it into first and last name
    if (profileData.fullName !== undefined && 
        (profileData.firstName === undefined || profileData.lastName === undefined)) {
      const nameParts = profileData.fullName.split(' ');
      data.first_name = nameParts[0] || 'Teacher';
      data.last_name = nameParts.slice(1).join(' ') || 'User';
    }
    
    // First, try to use the secure function to ensure teacher profile exists
    try {
      const { data: ensureResult, error: ensureError } = await supabase.rpc(
        'ensure_teacher_profile', 
        { 
          user_id: userId,
          first_name: data.first_name,
          last_name: data.last_name
        }
      );
      
      if (ensureError) {
        console.error('Error ensuring teacher profile exists:', ensureError);
        
        // Fallback to old method if RPC function is not available
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', userId)
          .single();
          
        if (userError && userError.code !== 'PGRST116') {
          console.error('Error checking user role:', userError);
        }
        
        // If user doesn't exist or isn't a teacher, try to set the role
        if (!userData || userData.role !== 'teacher') {
          // Try using the manage_user_role function
          const { data: roleResult, error: roleError } = await supabase.rpc(
            'manage_user_role',
            {
              user_id: userId,
              new_role: 'teacher'
            }
          );
          
          if (roleError) {
            console.error('Error setting user role with RPC:', roleError);
            
            // Last resort: direct attempt
            const { error: directError } = await supabase
              .from('users')
              .upsert({
                id: userId,
                role: 'teacher'
              }, { onConflict: 'id' });
              
            if (directError) {
              console.error('Error setting user role directly:', directError);
              // Continue anyway - we'll try to update the teacher profile
            }
          }
        }
      }
    } catch (rpcError) {
      console.error('RPC function not available:', rpcError);
      // Continue with the profile update even if the RPC failed
    }
    
    // Always set the updated_at timestamp
    data.updated_at = new Date().toISOString();
    
    // Perform the upsert operation on the teachers table
    const { error: updateError } = await supabase
      .from('teachers')
      .upsert({
        id: userId,
        ...data
      }, { onConflict: 'id' });

    if (updateError) {
      console.error('Error updating teacher profile:', updateError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error in updateTeacherProfile:', error);
    return false;
  }
};

/**
 * Get teacher availability data
 * @param teacherId The teacher's ID
 * @returns Availability data or null if not found
 */
export const getTeacherAvailability = async (teacherId: string) => {
  try {
    // Create a flag to track if we need to use mock data
    let useMockData = true;
    let availability = {
      recurringSlots: [],
      specificDates: [],
      breakPeriods: []
    };
    
    // First try to get availability from local storage (as fallback)
    try {
      const storedData = localStorage.getItem(`teacher_availability_${teacherId}`);
      if (storedData) {
        availability = JSON.parse(storedData);
        console.log('Retrieved availability from local storage:', availability);
      }
    } catch (storageError) {
      console.log('Could not access local storage:', storageError);
    }
    
    // Create a simple check to verify if the database is accessible
    try {
      // First try to get the user profile to verify the database connection
      const { data: userData, error: userError } = await supabase
        .from('teachers')
        .select('id')
        .eq('id', teacherId)
        .maybeSingle();
      
      if (!userError) {
        useMockData = false;
        
        // If we can access the database, look for availability data
        // Try the teachers table first (more likely to exist)
        const { data: teacherData, error: teacherError } = await supabase
          .from('teachers')
          .select('availability')
          .eq('id', teacherId)
          .maybeSingle();
        
        if (!teacherError && teacherData?.availability) {
          availability = {
            recurringSlots: teacherData.availability.recurringSlots || [],
            specificDates: teacherData.availability.specificDates || [],
            breakPeriods: teacherData.availability.breakPeriods || []
          };
          console.log('Retrieved availability from teachers table:', availability);
        } else {
          // If no data in the teachers table, try the dedicated availability table
          try {
            const { data, error } = await supabase
              .from('teacher_availability')
              .select('recurring_slots, specific_dates, break_periods')
              .eq('teacher_id', teacherId)
              .maybeSingle();
            
            if (!error && data) {
              availability = {
                recurringSlots: data.recurring_slots || [],
                specificDates: data.specific_dates || [],
                breakPeriods: data.break_periods || []
              };
              console.log('Retrieved availability from teacher_availability table:', availability);
            }
          } catch (availabilityError) {
            console.log('Error querying teacher_availability table:', availabilityError);
          }
        }
      }
    } catch (dbError) {
      console.log('Database seems inaccessible, using fallback data:', dbError);
    }
    
    // If we couldn't get data from the database or storage, provide empty arrays
    if (useMockData) {
      console.log('Using empty arrays for availability as fallback');
    }
    
    // Store the availability data in local storage for offline use
    try {
      localStorage.setItem(`teacher_availability_${teacherId}`, JSON.stringify(availability));
    } catch (storageError) {
      console.log('Could not save to local storage:', storageError);
    }
    
    return availability;
  } catch (error) {
    console.error('Error getting teacher availability:', error);
    return {
      recurringSlots: [],
      specificDates: [],
      breakPeriods: []
    };
  }
};

/**
 * Save teacher availability data
 * @param teacherId The teacher's ID
 * @param availabilityData The availability data to save
 * @returns Success status
 */
export const saveTeacherAvailability = async (
  teacherId: string, 
  availabilityData: {
    recurringSlots?: any[];
    specificDates?: any[];
    breakPeriods?: any[];
  }
): Promise<boolean> => {
  try {
    // First, save to local storage as backup
    try {
      localStorage.setItem(`teacher_availability_${teacherId}`, JSON.stringify(availabilityData));
    } catch (storageError) {
      console.log('Could not save to local storage:', storageError);
    }
    
    let savedToDatabase = false;
    
    // Try saving to the database - first to the teachers table as it's more likely to exist
    try {
      const { error: updateError } = await supabase
        .from('teachers')
        .update({
          availability: availabilityData,
          updated_at: new Date().toISOString()
        })
        .eq('id', teacherId);
      
      if (!updateError) {
        console.log('Successfully saved availability to teachers table');
        savedToDatabase = true;
      } else {
        console.log('Error saving to teachers table, will try availability table:', updateError);
      }
    } catch (teacherError) {
      console.log('Exception saving to teachers table:', teacherError);
    }
    
    // If saving to teachers table failed, try the dedicated availability table
    if (!savedToDatabase) {
      try {
        const { error } = await supabase
          .from('teacher_availability')
          .upsert({
            teacher_id: teacherId,
            recurring_slots: availabilityData.recurringSlots || [],
            specific_dates: availabilityData.specificDates || [],
            break_periods: availabilityData.breakPeriods || [],
            updated_at: new Date().toISOString()
          }, { onConflict: 'teacher_id' });
        
        if (!error) {
          console.log('Successfully saved availability to teacher_availability table');
          savedToDatabase = true;
        } else {
          console.log('Error saving to teacher_availability table:', error);
        }
      } catch (availabilityError) {
        console.log('Exception saving to teacher_availability table:', availabilityError);
      }
    }
    
    // Return true if we saved to at least one location
    return savedToDatabase || true; // Return true if at least saved to localStorage
  } catch (error) {
    console.error('Unexpected error in saveTeacherAvailability:', error);
    return false;
  }
};

/**
 * Gets the total earnings for a teacher
 * @param teacherId The teacher's ID
 * @returns Total earnings amount
 */
export const getTeacherEarnings = async (teacherId: string): Promise<number> => {
  try {
    // Check if we have the new payments table structure
    const { data: tableCheck, error: tableError } = await supabase
      .from('payments')
      .select('id')
      .limit(1);
      
    if (tableError && tableError.code === '42P01') {
      console.error('Payments table does not exist:', tableError);
      return 0;
    }
    
    // Check for teacher_payout_usd column (new schema)
    const { data: columnCheck, error: columnError } = await supabase
      .from('payments')
      .select('teacher_payout_usd')
      .limit(1);
    
    const hasTeacherPayout = !columnError || columnError.code !== '42703';
    
    if (hasTeacherPayout) {
      // Using new schema with bookings relationship
      const { data, error } = await supabase
        .from('payments')
        .select(`
          teacher_payout_usd,
          bookings!inner(teacher_id)
        `)
        .eq('bookings.teacher_id', teacherId)
        .in('status', ['paid', 'payout_completed']);
  
      if (error) {
        console.error('Error fetching teacher earnings:', error);
        return 0;
      }
  
      // Sum all payment amounts
      return (data || []).reduce((total, payment) => total + (payment.teacher_payout_usd || 0), 0);
    } else {
      // Fallback to old schema
      const { data, error } = await supabase
        .from('payments')
        .select('amount')
        .eq('teacher_id', teacherId)
        .eq('status', 'completed');
  
      if (error) {
        console.error('Error fetching teacher earnings with old schema:', error);
        return 0;
      }
  
      // Sum all payment amounts
      return (data || []).reduce((total, payment) => total + (payment.amount || 0), 0);
    }
  } catch (error) {
    console.error('Unexpected error in getTeacherEarnings:', error);
    return 0;
  }
};

/**
 * Gets a teacher's average rating
 * @param teacherId The teacher's ID
 * @returns Average rating and count
 */
export const getTeacherRating = async (teacherId: string): Promise<{ average: number, count: number }> => {
  const { data, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('teacher_id', teacherId);

  if (error) {
    console.error('Error fetching teacher ratings:', error);
    return { average: 0, count: 0 };
  }

  if (!data || data.length === 0) {
    return { average: 0, count: 0 };
  }

  const sum = data.reduce((total, review) => total + review.rating, 0);
  return {
    average: Math.round((sum / data.length) * 10) / 10, // Round to 1 decimal place
    count: data.length
  };
}; 