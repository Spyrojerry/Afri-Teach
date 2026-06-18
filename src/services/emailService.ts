import { supabase } from "@/integrations/supabase/client";

type BookingEmailEvent = "confirmation" | "cancellation" | "reminder";

const sendBookingEmail = async (
  bookingId: string,
  event: BookingEmailEvent
): Promise<{ success: boolean; message?: string }> => {
  const { error } = await supabase.functions.invoke("send-booking-email", {
    body: { bookingId, event },
  });

  if (error) {
    console.error(`Failed to send booking ${event} email:`, error);
    return { success: false, message: error.message };
  }

  return { success: true };
};

export const emailService = {
  sendBookingConfirmation: (bookingId: string) =>
    sendBookingEmail(bookingId, "confirmation"),
  sendBookingCancellation: (bookingId: string) =>
    sendBookingEmail(bookingId, "cancellation"),
  sendLessonReminder: (bookingId: string) =>
    sendBookingEmail(bookingId, "reminder"),
};
