// This is a mock email service for the MVP
// In a real implementation, this would integrate with a backend email service
// like SendGrid, Mailgun, AWS SES, etc.

interface BookingEmailData {
  teacherName: string;
  teacherEmail: string;
  studentName: string;
  studentEmail: string;
  subject: string;
  date: string;
  startTime: string;
  endTime: string;
  zoomLink?: string;
}

export const emailService = {
  /**
   * Send booking confirmation emails to both teacher and student
   */
  sendBookingConfirmation: async (bookingData: BookingEmailData): Promise<{ success: boolean, message?: string }> => {
    try {
      console.log('Sending booking confirmation email to teacher:', bookingData.teacherEmail);
      console.log('Sending booking confirmation email to student:', bookingData.studentEmail);
      
      // In a real implementation, this would call a backend API endpoint
      // that would use an email service to send emails
      
      // Mock successful API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        message: 'Booking confirmation emails sent successfully'
      };
    } catch (error) {
      console.error('Error sending booking confirmation emails:', error);
      return {
        success: false,
        message: 'Failed to send booking confirmation emails'
      };
    }
  },
  
  /**
   * Send booking cancellation emails to both teacher and student
   */
  sendBookingCancellation: async (bookingData: BookingEmailData): Promise<{ success: boolean, message?: string }> => {
    try {
      console.log('Sending booking cancellation email to teacher:', bookingData.teacherEmail);
      console.log('Sending booking cancellation email to student:', bookingData.studentEmail);
      
      // Mock successful API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        message: 'Booking cancellation emails sent successfully'
      };
    } catch (error) {
      console.error('Error sending booking cancellation emails:', error);
      return {
        success: false,
        message: 'Failed to send booking cancellation emails'
      };
    }
  },
  
  /**
   * Send reminder emails about upcoming lessons
   */
  sendLessonReminder: async (bookingData: BookingEmailData): Promise<{ success: boolean, message?: string }> => {
    try {
      console.log('Sending lesson reminder email to teacher:', bookingData.teacherEmail);
      console.log('Sending lesson reminder email to student:', bookingData.studentEmail);
      
      // Mock successful API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        message: 'Lesson reminder emails sent successfully'
      };
    } catch (error) {
      console.error('Error sending lesson reminder emails:', error);
      return {
        success: false,
        message: 'Failed to send lesson reminder emails'
      };
    }
  }
}; 