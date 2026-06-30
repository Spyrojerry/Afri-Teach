import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  CheckCircle2,
  Clock,
  GraduationCap,
  Loader2,
  LogOut,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/integrations/supabase/client";

type ApplicationStatus = "pending" | "approved" | "rejected";

interface TeacherApplication {
  id: string;
  teacher_id: string;
  status: ApplicationStatus;
  first_name: string;
  last_name: string;
  email?: string;
  bio?: string;
  experience?: string;
  hourly_rate?: number;
  time_zone: string;
  subjects: string[];
  availability?: {
    recurringSlots?: Array<{
      dayOfWeek?: number;
      startTime?: string;
      endTime?: string;
    }>;
    timeZone?: string;
  };
  submitted_at: string;
  reviewed_at?: string;
  review_notes?: string;
}

const statusClasses: Record<ApplicationStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
};

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const AdminCenter = () => {
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const [applications, setApplications] = useState<TeacherApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<ApplicationStatus | "all">("pending");
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const filteredApplications = useMemo(
    () => applications.filter((application) => filter === "all" || application.status === filter),
    [applications, filter],
  );

  const counts = useMemo(() => ({
    pending: applications.filter((application) => application.status === "pending").length,
    approved: applications.filter((application) => application.status === "approved").length,
    rejected: applications.filter((application) => application.status === "rejected").length,
  }), [applications]);

  const loadApplications = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("teacher_applications")
        .select("*")
        .order("submitted_at", { ascending: false });

      if (error) throw error;
      setApplications((data || []) as TeacherApplication[]);
    } catch (error) {
      toast({
        title: "Could not load applications",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  const reviewApplication = async (applicationId: string, status: "approved" | "rejected") => {
    setReviewingId(applicationId);
    try {
      const { data, error } = await supabase.rpc("review_teacher_application", {
        application_id: applicationId,
        new_status: status,
        notes: reviewNotes[applicationId] || null,
      });

      if (error) throw error;

      setApplications((current) =>
        current.map((application) =>
          application.id === applicationId ? (data as TeacherApplication) : application,
        ),
      );

      toast({
        title: status === "approved" ? "Teacher approved" : "Teacher rejected",
        description: "The teacher can now see the updated application status.",
      });
    } catch (error) {
      toast({
        title: "Review failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setReviewingId(null);
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-purple-600 to-purple-800 p-2">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">AfriTeach Admin Center</h1>
              <p className="text-sm text-gray-500">Teacher applications and platform decisions</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-gray-500 sm:inline">{user?.email}</span>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-3xl font-bold">{counts.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-gray-500">Approved</p>
                <p className="text-3xl font-bold">{counts.approved}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-gray-500">Rejected</p>
                <p className="text-3xl font-bold">{counts.rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Teacher Applications</CardTitle>
              <CardDescription>Review subject requests, profile details, timezone, and first availability slot.</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={filter} onValueChange={(value) => setFilter(value as ApplicationStatus | "all")}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={loadApplications}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12 text-gray-500">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading applications...
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="rounded-lg bg-gray-50 py-12 text-center text-gray-500">
                No applications found for this filter.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredApplications.map((application) => {
                  const slot = application.availability?.recurringSlots?.[0];
                  const isReviewing = reviewingId === application.id;

                  return (
                    <div key={application.id} className="rounded-xl border bg-white p-4 shadow-sm">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold">
                              {application.first_name} {application.last_name}
                            </h3>
                            <Badge variant="outline" className={statusClasses[application.status]}>
                              {application.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500">{application.email || "No email provided"}</p>
                          <p className="max-w-3xl text-sm text-gray-700">{application.bio || "No bio provided."}</p>
                          <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                              <p className="font-medium text-gray-500">Experience</p>
                              <p>{application.experience || "Not provided"}</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-500">Rate</p>
                              <p>${application.hourly_rate || 0}/hour</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-500">Timezone</p>
                              <p>{application.time_zone}</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-500">Submitted</p>
                              <p>{format(new Date(application.submitted_at), "MMM d, yyyy")}</p>
                            </div>
                          </div>
                          <div>
                            <p className="mb-2 text-sm font-medium text-gray-500">Requested subjects</p>
                            <div className="flex flex-wrap gap-2">
                              {application.subjects.map((subject) => (
                                <Badge key={subject} variant="secondary">
                                  <GraduationCap className="mr-1 h-3 w-3" />
                                  {subject}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          {slot && (
                            <p className="text-sm text-gray-600">
                              First availability: {dayNames[slot.dayOfWeek || 0]}, {slot.startTime} - {slot.endTime}
                            </p>
                          )}
                          {application.review_notes && (
                            <p className="rounded-md bg-gray-50 p-3 text-sm text-gray-600">
                              Admin note: {application.review_notes}
                            </p>
                          )}
                        </div>

                        <div className="w-full space-y-3 lg:w-80">
                          <Textarea
                            placeholder="Optional review note..."
                            value={reviewNotes[application.id] || ""}
                            onChange={(event) =>
                              setReviewNotes((current) => ({
                                ...current,
                                [application.id]: event.target.value,
                              }))
                            }
                            disabled={application.status !== "pending"}
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              variant="outline"
                              className="border-red-200 text-red-600 hover:bg-red-50"
                              disabled={application.status !== "pending" || isReviewing}
                              onClick={() => reviewApplication(application.id, "rejected")}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Reject
                            </Button>
                            <Button
                              className="bg-green-600 hover:bg-green-700"
                              disabled={application.status !== "pending" || isReviewing}
                              onClick={() => reviewApplication(application.id, "approved")}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Approve
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminCenter;
