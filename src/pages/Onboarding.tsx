import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, CalendarClock, CheckCircle2, GraduationCap, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/integrations/supabase/client";

const fallbackSubjects = [
  "Mathematics",
  "English",
  "Science",
  "History",
  "Computer Science",
  "Languages",
  "Biology",
  "Chemistry",
  "Physics",
];

const timeZones = [
  { value: "Africa/Lagos", label: "WAT - West Africa Time" },
  { value: "America/New_York", label: "EST/ET - Eastern Time" },
  { value: "Africa/Accra", label: "GMT - Ghana / UTC" },
  { value: "Africa/Cairo", label: "EET - Egypt Time" },
  { value: "Africa/Nairobi", label: "EAT - East Africa Time" },
  { value: "Africa/Johannesburg", label: "SAST - South Africa Time" },
];

const daysOfWeek = [
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
  { value: "0", label: "Sunday" },
];

type UserType = "student" | "teacher";

const Onboarding = () => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>(fallbackSubjects);

  const [userType, setUserType] = useState<UserType | "">("");
  const [firstName, setFirstName] = useState(user?.user_metadata?.first_name || "");
  const [lastName, setLastName] = useState(user?.user_metadata?.last_name || "");
  const [bio, setBio] = useState("");
  const [experience, setExperience] = useState("");
  const [hourlyRate, setHourlyRate] = useState("15");
  const [timeZone, setTimeZone] = useState("Africa/Lagos");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [availabilityDay, setAvailabilityDay] = useState("1");
  const [availabilityStart, setAvailabilityStart] = useState("09:00");
  const [availabilityEnd, setAvailabilityEnd] = useState("10:00");

  const totalSteps = userType === "teacher" ? 4 : 1;

  useEffect(() => {
    if (userRole === "admin") {
      navigate("/admin", { replace: true });
      return;
    }

    const loadSubjects = async () => {
      const { data, error } = await supabase.from("subjects").select("name").order("name");
      if (!error && data?.length) {
        setAvailableSubjects(data.map((subject) => subject.name).filter(Boolean));
      }
    };

    loadSubjects();
  }, [navigate, userRole]);

  const selectedTimeZoneLabel = useMemo(
    () => timeZones.find((zone) => zone.value === timeZone)?.label || timeZone,
    [timeZone],
  );

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((current) =>
      current.includes(subject)
        ? current.filter((item) => item !== subject)
        : [...current, subject],
    );
  };

  const validateCurrentStep = () => {
    if (step === 1) {
      if (!userType || !firstName.trim() || !lastName.trim()) {
        toast({
          title: "Complete your basic information",
          description: "Choose your account type and enter your name.",
          variant: "destructive",
        });
        return false;
      }
    }

    if (userType === "teacher" && step === 2) {
      if (!bio.trim() || !experience.trim()) {
        toast({
          title: "Tell us about your teaching",
          description: "Add your short bio and experience before continuing.",
          variant: "destructive",
        });
        return false;
      }
    }

    if (userType === "teacher" && step === 3 && selectedSubjects.length === 0) {
      toast({
        title: "Choose at least one subject",
        description: "Admin will review and approve the subjects you request.",
        variant: "destructive",
      });
      return false;
    }

    if (userType === "teacher" && step === 4 && availabilityStart >= availabilityEnd) {
      toast({
        title: "Check your availability time",
        description: "End time must be after start time.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const goNext = () => {
    if (!validateCurrentStep()) return;

    if (userType === "student") {
      void completeStudentOnboarding();
      return;
    }

    setStep((current) => Math.min(current + 1, totalSteps));
  };

  const completeStudentOnboarding = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          role: "student",
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          full_name: fullName,
          onboarding_completed: true,
        },
      });
      if (authError) throw authError;

      const { error: userError } = await supabase.from("users").upsert({
        id: user.id,
        email: user.email,
        role: "student",
        updated_at: new Date().toISOString(),
      });
      if (userError) throw userError;

      const { error: profileError } = await supabase.from("students").upsert({
        id: user.id,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        time_zone: timeZone,
        updated_at: new Date().toISOString(),
      });
      if (profileError) throw profileError;

      await supabase.from("teachers").delete().eq("id", user.id);
      navigate("/student/dashboard");
    } catch (error) {
      toast({
        title: "Onboarding failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const submitTeacherApplication = async () => {
    if (!user || !validateCurrentStep()) return;

    setIsLoading(true);
    try {
      const now = new Date().toISOString();
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      const recurringSlots = [
        {
          id: crypto.randomUUID(),
          dayOfWeek: Number(availabilityDay),
          startTime: availabilityStart,
          endTime: availabilityEnd,
        },
      ];
      const availability = {
        recurringSlots,
        specificDates: [],
        breakPeriods: [],
        timeZone,
      };
      const teacherModules = Object.fromEntries(selectedSubjects.map((subject) => [subject, []]));

      const { error: authError } = await supabase.auth.updateUser({
        data: {
          role: "teacher",
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          full_name: fullName,
          onboarding_completed: true,
          teacher_application_status: "pending",
        },
      });
      if (authError) throw authError;

      const { error: userError } = await supabase.from("users").upsert({
        id: user.id,
        email: user.email,
        role: "teacher",
        updated_at: now,
      });
      if (userError) throw userError;

      const { error: teacherError } = await supabase.from("teachers").upsert({
        id: user.id,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        bio: bio.trim(),
        experience: experience.trim(),
        hourly_rate: Number(hourlyRate) || 0,
        time_zone: timeZone,
        subjects: selectedSubjects,
        teacher_modules: teacherModules,
        is_verified: false,
        application_status: "pending",
        application_submitted_at: now,
        updated_at: now,
      });
      if (teacherError) throw teacherError;

      const { error: availabilityError } = await supabase.from("teacher_availability").upsert({
        teacher_id: user.id,
        recurring_slots: recurringSlots,
        specific_dates: [],
        break_periods: [],
        updated_at: now,
      }, { onConflict: "teacher_id" });
      if (availabilityError) throw availabilityError;

      const { error: applicationError } = await supabase.from("teacher_applications").upsert({
        teacher_id: user.id,
        status: "pending",
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: user.email,
        bio: bio.trim(),
        experience: experience.trim(),
        hourly_rate: Number(hourlyRate) || 0,
        time_zone: timeZone,
        subjects: selectedSubjects,
        teacher_modules: teacherModules,
        availability,
        application_data: {
          submittedFrom: "teacher_onboarding",
          timeZoneLabel: selectedTimeZoneLabel,
        },
        submitted_at: now,
        updated_at: now,
      }, { onConflict: "teacher_id" });
      if (applicationError) throw applicationError;

      await supabase.from("students").delete().eq("id", user.id);

      toast({
        title: "Application submitted",
        description: "An admin will review your teacher application.",
      });
      navigate("/teacher/dashboard");
    } catch (error) {
      toast({
        title: "Could not submit application",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const stepTitle = userType === "teacher"
    ? ["Basic info", "Teaching profile", "Subjects", "Availability"][step - 1]
    : "Basic info";

  return (
    <Layout showFooter={false}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-3xl">
          <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
            <CardHeader className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="bg-gradient-to-r from-emerald-600 to-blue-600 p-3 rounded-xl">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-white">Welcome to AfriTeach</CardTitle>
              <CardDescription className="text-gray-300">
                {userType === "teacher"
                  ? `Step ${step} of ${totalSteps}: ${stepTitle}`
                  : "Tell us how you want to use AfriTeach."}
              </CardDescription>
              {userType === "teacher" && (
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: totalSteps }).map((_, index) => (
                    <div
                      key={index}
                      className={`h-2 rounded-full ${
                        index + 1 <= step ? "bg-emerald-400" : "bg-white/20"
                      }`}
                    />
                  ))}
                </div>
              )}
            </CardHeader>

            <CardContent className="space-y-6">
              {step === 1 && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-white">I am a:</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setUserType("student")}
                        className={`p-4 rounded-lg border transition-all ${
                          userType === "student"
                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                            : "bg-white/10 border-white/30 text-gray-300 hover:bg-white/20"
                        }`}
                      >
                        <User className="h-6 w-6 mx-auto mb-2" />
                        <div className="text-sm font-medium">Student</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setUserType("teacher")}
                        className={`p-4 rounded-lg border transition-all ${
                          userType === "teacher"
                            ? "bg-blue-500/20 border-blue-500 text-blue-300"
                            : "bg-white/10 border-white/30 text-gray-300 hover:bg-white/20"
                        }`}
                      >
                        <BookOpen className="h-6 w-6 mx-auto mb-2" />
                        <div className="text-sm font-medium">Teacher</div>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-white" htmlFor="firstName">First name</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(event) => setFirstName(event.target.value)}
                        placeholder="John"
                        className="bg-white/20 border-white/30 text-white placeholder-gray-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white" htmlFor="lastName">Last name</Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(event) => setLastName(event.target.value)}
                        placeholder="Doe"
                        className="bg-white/20 border-white/30 text-white placeholder-gray-300"
                      />
                    </div>
                  </div>
                </div>
              )}

              {userType === "teacher" && step === 2 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white" htmlFor="bio">Short teaching bio</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(event) => setBio(event.target.value)}
                      placeholder="Tell students and admins about your teaching style..."
                      className="min-h-28 bg-white/20 border-white/30 text-white placeholder-gray-300"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-white" htmlFor="experience">Experience (years)</Label>
                      <Input
                        id="experience"
                        value={experience}
                        onChange={(event) => setExperience(event.target.value)}
                        placeholder="e.g. 5"
                        className="bg-white/20 border-white/30 text-white placeholder-gray-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white" htmlFor="hourlyRate">Hourly rate (USD)</Label>
                      <Input
                        id="hourlyRate"
                        type="number"
                        min="0"
                        value={hourlyRate}
                        onChange={(event) => setHourlyRate(event.target.value)}
                        className="bg-white/20 border-white/30 text-white placeholder-gray-300"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Timezone</Label>
                    <Select value={timeZone} onValueChange={setTimeZone}>
                      <SelectTrigger className="bg-white/20 border-white/30 text-white">
                        <SelectValue placeholder="Choose timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeZones.map((zone) => (
                          <SelectItem key={zone.value} value={zone.value}>
                            {zone.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {userType === "teacher" && step === 3 && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-blue-400/30 bg-blue-500/10 p-4 text-sm text-blue-100">
                    Choose the subjects you want to teach. Admin will review these before your teacher profile is approved.
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {availableSubjects.map((subject) => (
                      <label
                        key={subject}
                        className="flex items-center gap-3 rounded-lg border border-white/20 bg-white/10 p-3 text-white"
                      >
                        <Checkbox
                          checked={selectedSubjects.includes(subject)}
                          onCheckedChange={() => toggleSubject(subject)}
                        />
                        <span className="text-sm">{subject}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {userType === "teacher" && step === 4 && (
                <div className="space-y-5">
                  <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                    Add your first weekly availability slot. You can add more slots from your dashboard later.
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label className="text-white">Day</Label>
                      <Select value={availabilityDay} onValueChange={setAvailabilityDay}>
                        <SelectTrigger className="bg-white/20 border-white/30 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {daysOfWeek.map((day) => (
                            <SelectItem key={day.value} value={day.value}>{day.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white" htmlFor="availabilityStart">Start</Label>
                      <Input
                        id="availabilityStart"
                        type="time"
                        value={availabilityStart}
                        onChange={(event) => setAvailabilityStart(event.target.value)}
                        className="bg-white/20 border-white/30 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white" htmlFor="availabilityEnd">End</Label>
                      <Input
                        id="availabilityEnd"
                        type="time"
                        value={availabilityEnd}
                        onChange={(event) => setAvailabilityEnd(event.target.value)}
                        className="bg-white/20 border-white/30 text-white"
                      />
                    </div>
                  </div>

                  <div className="rounded-xl bg-white/10 p-4 text-white">
                    <div className="flex items-center gap-2 font-medium">
                      <CalendarClock className="h-4 w-4" />
                      Application summary
                    </div>
                    <ul className="mt-3 space-y-2 text-sm text-gray-200">
                      <li>Timezone: {selectedTimeZoneLabel}</li>
                      <li>Subjects: {selectedSubjects.join(", ") || "None selected"}</li>
                      <li>
                        Availability: {daysOfWeek.find((day) => day.value === availabilityDay)?.label},{" "}
                        {availabilityStart} - {availabilityEnd}
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-between">
                {userType === "teacher" && step > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep((current) => Math.max(1, current - 1))}
                    disabled={isLoading}
                  >
                    Back
                  </Button>
                ) : (
                  <span />
                )}

                {userType === "teacher" && step === totalSteps ? (
                  <Button
                    type="button"
                    onClick={submitTeacherApplication}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {isLoading ? "Submitting..." : "Submit Teacher Application"}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={goNext}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600"
                  >
                    {userType === "student" ? "Complete Profile" : "Continue"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Onboarding;
