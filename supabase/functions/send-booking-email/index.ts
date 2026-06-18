import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) throw new Error("Authentication required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const emailFrom = Deno.env.get("EMAIL_FROM");

    if (!resendApiKey || !emailFrom) {
      throw new Error("RESEND_API_KEY and EMAIL_FROM must be configured");
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await callerClient.auth.getUser();
    if (userError || !user) throw new Error("Invalid session");

    const { bookingId, event = "confirmation" } = await request.json();
    if (!bookingId) throw new Error("bookingId is required");

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data: booking, error: bookingError } = await admin
      .from("bookings")
      .select("id, student_id, teacher_id, subject, start_time_utc, end_time_utc, meeting_link")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) throw new Error("Booking not found");
    if (booking.student_id !== user.id && booking.teacher_id !== user.id) {
      throw new Error("You do not have access to this booking");
    }

    const [{ data: studentUser }, { data: teacherUser }, { data: student }, { data: teacher }] =
      await Promise.all([
        admin.from("users").select("email").eq("id", booking.student_id).single(),
        admin.from("users").select("email").eq("id", booking.teacher_id).single(),
        admin.from("students").select("first_name, last_name").eq("id", booking.student_id).single(),
        admin.from("teachers").select("first_name, last_name").eq("id", booking.teacher_id).single(),
      ]);

    const recipients = [studentUser?.email, teacherUser?.email].filter(Boolean);
    if (!recipients.length) throw new Error("No recipient email addresses found");

    const start = new Date(booking.start_time_utc).toLocaleString("en", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "UTC",
    });
    const studentName = `${student?.first_name || ""} ${student?.last_name || ""}`.trim();
    const teacherName = `${teacher?.first_name || ""} ${teacher?.last_name || ""}`.trim();
    const subjectByEvent = {
      confirmation: `AfriTeach booking confirmed: ${booking.subject}`,
      cancellation: `AfriTeach booking cancelled: ${booking.subject}`,
      reminder: `AfriTeach lesson reminder: ${booking.subject}`,
    }[event as "confirmation" | "cancellation" | "reminder"];

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: emailFrom,
        to: recipients,
        subject: subjectByEvent,
        html: `
          <h2>${subjectByEvent}</h2>
          <p><strong>Student:</strong> ${studentName}</p>
          <p><strong>Teacher:</strong> ${teacherName}</p>
          <p><strong>Time:</strong> ${start} UTC</p>
          ${booking.meeting_link ? `<p><a href="${booking.meeting_link}">Join classroom</a></p>` : ""}
        `,
      }),
    });

    if (!response.ok) {
      throw new Error(`Resend rejected the email: ${await response.text()}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
