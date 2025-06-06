import { supabase } from "@/integrations/supabase/client";
import { checkColumnExists } from "@/utils/databaseDiagnostics";

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending_payout' | 'payout_completed' | 'refunded';
  bookingId: string;
  createdAt: string;
  payoutDate?: string;
  paymentMethod?: string;
  teacherName?: string;
  studentName?: string;
  lessonSubject?: string;
  lessonDate?: string;
}

/**
 * Fetches payment history for a teacher
 * @param teacherId The teacher's ID
 * @returns Array of payments
 */
export const getTeacherPayments = async (teacherId: string): Promise<Payment[]> => {
  try {
    // Check if payments table exists first
    const { data: tableCheck, error: tableError } = await supabase
      .from('payments')
      .select('id')
      .limit(1);
      
    if (tableError && tableError.code === '42P01') {
      console.error('Payments table does not exist:', tableError);
      return [];
    }
    
    // Try to determine the payment table structure
    const hasAmountUsd = await checkColumnExists('payments', 'amount_usd');
    const hasTeacherPayoutUsd = await checkColumnExists('payments', 'teacher_payout_usd');
    const hasBookingId = await checkColumnExists('payments', 'booking_id');
    
    if (hasBookingId && (hasAmountUsd || hasTeacherPayoutUsd)) {
      // New payment structure - join through bookings
      const { data, error } = await supabase
        .from('payments')
        .select(`
          id,
          ${hasTeacherPayoutUsd ? 'teacher_payout_usd' : 'amount_usd'} as amount,
          currency,
          status,
          booking_id,
          created_at,
          payout_date,
          payment_method,
          bookings!inner(
            teacher_id,
            student_id,
            lesson_id,
            lessons(title, subject_id, subjects(name))
          )
        `)
        .eq('bookings.teacher_id', teacherId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching teacher payments with new structure:', error);
        return [];
      }

      // Get teacher and student names
      const teacherIds = [...new Set(data?.map(p => p.bookings?.teacher_id) || [])];
      const studentIds = [...new Set(data?.map(p => p.bookings?.student_id) || [])];

      const { data: teacherData } = await supabase
        .from('teachers')
        .select('id, first_name, last_name')
        .in('id', teacherIds);

      const { data: studentData } = await supabase
        .from('students')
        .select('id, first_name, last_name')
        .in('id', studentIds);

      const teacherMap = new Map(
        (teacherData || []).map(t => [t.id, `${t.first_name} ${t.last_name}`])
      );

      const studentMap = new Map(
        (studentData || []).map(s => [s.id, `${s.first_name} ${s.last_name}`])
      );

      // Transform data to match the expected format
      return (data || []).map(payment => {
        const teacherId = payment.bookings?.teacher_id;
        const studentId = payment.bookings?.student_id;
        
        return {
          id: payment.id,
          amount: payment.amount || 0,
          currency: payment.currency || 'USD',
          status: payment.status || 'pending_payout',
          bookingId: payment.booking_id,
          createdAt: payment.created_at,
          payoutDate: payment.payout_date,
          paymentMethod: payment.payment_method || 'Unknown',
          teacherName: teacherMap.get(teacherId) || 'Unknown Teacher',
          studentName: studentMap.get(studentId) || 'Unknown Student',
          lessonSubject: payment.bookings?.lessons?.title || 
                         payment.bookings?.lessons?.subjects?.name || 'Unknown',
          lessonDate: payment.bookings?.start_time_utc?.split('T')[0] || 'Unknown'
        };
      });
    } else {
      // Legacy payment structure
      console.warn('Using legacy payment structure - this may not work with the new schema');
      
      const { data, error } = await supabase
        .from('payments')
        .select(`
          id,
          amount,
          currency,
          status,
          teacher_id,
          student_id,
          lesson_id,
          created_at,
          payment_method
        `)
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching teacher payments with legacy structure:', error);
        return [];
      }

      return (data || []).map(payment => {
        return {
          id: payment.id,
          amount: payment.amount || 0,
          currency: payment.currency || 'USD',
          status: payment.status || 'paid',
          bookingId: payment.booking_id || payment.lesson_id,
          createdAt: payment.created_at,
          paymentMethod: payment.payment_method || 'Unknown'
        };
      });
    }
  } catch (error) {
    console.error('Unexpected error in getTeacherPayments:', error);
    return [];
  }
};

/**
 * Gets teacher earnings summary
 * @param teacherId The teacher's ID
 * @returns Earnings summary data
 */
export const getTeacherEarningsSummary = async (teacherId: string) => {
  try {
    // Check for new payment structure
    const hasTeacherPayoutUsd = await checkColumnExists('payments', 'teacher_payout_usd');
    const hasBookingId = await checkColumnExists('payments', 'booking_id');
    
    if (hasBookingId && hasTeacherPayoutUsd) {
      // New payment structure - join through bookings
      // Get total earnings (all time)
      const { data: allTimeData, error: allTimeError } = await supabase
        .from('payments')
        .select(`
          teacher_payout_usd,
          bookings!booking_id(teacher_id)
        `)
        .eq('bookings.teacher_id', teacherId)
        .in('status', ['paid', 'payout_completed']);

      if (allTimeError) {
        console.error('Error fetching all-time earnings:', allTimeError);
        
        // Alternative approach using direct query if the join fails
        try {
          const { data: altData } = await supabase
            .rpc('get_teacher_earnings', { teacher_id: teacherId });
            
          return {
            totalEarnings: altData?.total_earnings || 0,
            thisMonthEarnings: altData?.this_month_earnings || 0,
            lastMonthEarnings: altData?.last_month_earnings || 0,
            pendingPayouts: altData?.pending_payouts || 0
          };
        } catch (rpcError) {
          console.error('RPC fallback failed:', rpcError);
          return {
            totalEarnings: 0,
            thisMonthEarnings: 0,
            lastMonthEarnings: 0,
            pendingPayouts: 0
          };
        }
      }

      // Get this month's earnings
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
      const currentYear = currentDate.getFullYear();
      const firstDayOfMonth = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
      
      const { data: thisMonthData, error: thisMonthError } = await supabase
        .from('payments')
        .select(`
          teacher_payout_usd,
          bookings!booking_id(teacher_id)
        `)
        .eq('bookings.teacher_id', teacherId)
        .in('status', ['paid', 'payout_completed'])
        .gte('created_at', firstDayOfMonth);

      if (thisMonthError) {
        console.error('Error fetching this month earnings:', thisMonthError);
      }

      // Get last month's earnings
      let lastMonth = currentMonth - 1;
      let lastMonthYear = currentYear;
      if (lastMonth === 0) {
        lastMonth = 12;
        lastMonthYear--;
      }
      
      const firstDayOfLastMonth = `${lastMonthYear}-${lastMonth.toString().padStart(2, '0')}-01`;
      const firstDayOfCurrentMonth = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
      
      const { data: lastMonthData, error: lastMonthError } = await supabase
        .from('payments')
        .select(`
          teacher_payout_usd,
          bookings!booking_id(teacher_id)
        `)
        .eq('bookings.teacher_id', teacherId)
        .in('status', ['paid', 'payout_completed'])
        .gte('created_at', firstDayOfLastMonth)
        .lt('created_at', firstDayOfCurrentMonth);

      if (lastMonthError) {
        console.error('Error fetching last month earnings:', lastMonthError);
      }

      // Get pending payouts
      const { data: pendingData, error: pendingError } = await supabase
        .from('payments')
        .select(`
          teacher_payout_usd,
          bookings!booking_id(teacher_id)
        `)
        .eq('bookings.teacher_id', teacherId)
        .eq('status', 'pending_payout');

      if (pendingError) {
        console.error('Error fetching pending payouts:', pendingError);
      }

      // Calculate total amounts
      const totalEarnings = (allTimeData || []).reduce((sum, payment) => sum + (payment.teacher_payout_usd || 0), 0);
      const thisMonthEarnings = (thisMonthData || []).reduce((sum, payment) => sum + (payment.teacher_payout_usd || 0), 0);
      const lastMonthEarnings = (lastMonthData || []).reduce((sum, payment) => sum + (payment.teacher_payout_usd || 0), 0);
      const pendingPayouts = (pendingData || []).reduce((sum, payment) => sum + (payment.teacher_payout_usd || 0), 0);

      return {
        totalEarnings,
        thisMonthEarnings,
        lastMonthEarnings,
        pendingPayouts
      };
    } else {
      // Legacy structure
      console.warn('Using legacy payment structure - this may not work with the new schema');
      
      // Get total earnings (all time)
      const { data: allTimeData, error: allTimeError } = await supabase
        .from('payments')
        .select('amount')
        .eq('teacher_id', teacherId)
        .eq('status', 'completed');

      if (allTimeError) {
        console.error('Error fetching all-time earnings:', allTimeError);
        return {
          totalEarnings: 0,
          thisMonthEarnings: 0,
          lastMonthEarnings: 0,
          pendingPayouts: 0
        };
      }

      // Calculate total amounts (simplified for legacy structure)
      const totalEarnings = (allTimeData || []).reduce((sum, payment) => sum + (payment.amount || 0), 0);

      return {
        totalEarnings,
        thisMonthEarnings: 0,
        lastMonthEarnings: 0,
        pendingPayouts: 0
      };
    }
  } catch (error) {
    console.error('Unexpected error in getTeacherEarningsSummary:', error);
    return {
      totalEarnings: 0,
      thisMonthEarnings: 0,
      lastMonthEarnings: 0,
      pendingPayouts: 0
    };
  }
}; 