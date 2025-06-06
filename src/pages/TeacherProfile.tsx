import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { getTeacherProfile, updateTeacherProfile, Teacher } from "@/services/teacherService";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ProfileModal } from "@/components/ProfileModal";
import { supabase } from "@/integrations/supabase/client";
import { toNumber } from "@/utils/typeConversions";
import { TeacherSubjectsManager } from "@/components/TeacherSubjectsManager";

const TeacherProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [teacherProfile, setTeacherProfile] = useState<Teacher | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch teacher profile data
  useEffect(() => {
    const fetchTeacherProfile = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      try {
        const profile = await getTeacherProfile(user.id);
        setTeacherProfile(profile);
      } catch (error) {
        console.error("Error fetching teacher profile:", error);
        toast({
          title: "Error loading profile",
          description: "Could not load your profile data. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTeacherProfile();
  }, [user?.id, toast]);
  
  const handleProfileUpdate = async (formData: any) => {
    if (!user?.id || !teacherProfile) return;
    
    setIsSaving(true);
    try {
      // Prepare data for update
      const profileData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        bio: formData.bio,
        experience: formData.experience,
        profilePictureUrl: formData.profile_picture_url || formData.avatar_url,
        introVideoUrl: formData.introVideoUrl,
        timeZone: formData.timeZone,
        contactNumber: formData.contactNumber
      };
      
      // Handle update with retry mechanism
      let success = false;
      let attempts = 0;
      const maxAttempts = 2;
      
      while (!success && attempts < maxAttempts) {
        attempts++;
        success = await updateTeacherProfile(user.id, profileData);
        
        if (!success && attempts < maxAttempts) {
          // Short delay before retry
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      if (success) {
        toast({
          title: "Profile updated",
          description: "Your teacher profile has been updated successfully.",
        });
        
        // Update local state
        setTeacherProfile(prev => ({
          ...prev!,
          firstName: formData.firstName,
          lastName: formData.lastName,
          fullName: `${formData.firstName} ${formData.lastName}`,
          bio: formData.bio,
          experience: formData.experience,
          profilePictureUrl: formData.profile_picture_url || formData.avatar_url,
          introVideoUrl: formData.introVideoUrl,
          timeZone: formData.timeZone,
          contactNumber: formData.contactNumber
        }));
        
        setIsModalOpen(false);
        
        // Refresh the page to reflect changes
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        throw new Error(`Failed to update profile after ${attempts} attempts`);
      }
    } catch (error) {
      console.error("Error updating teacher profile:", error);
      toast({
        title: "Update failed",
        description: "Could not update your profile. Please try again or contact support if the issue persists.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Get user initials for avatar fallback
  const getInitials = (firstName: string, lastName: string) => {
    if (!firstName && !lastName) return "T";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Get full name from first and last name
  const getFullName = (firstName: string, lastName: string) => {
    return `${firstName} ${lastName}`.trim() || "Teacher";
  };

  if (isLoading) {
    return (
      <DashboardLayout userType="teacher">
        <div className="flex items-center justify-center min-h-[60vh] w-full">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
            <p className="text-muted-foreground">Loading your profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="teacher">
      <div className="container mx-auto py-4 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Teacher Profile</h1>
            <p className="text-gray-500">Manage your profile and teaching information</p>
          </div>
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-purple-800"
          >
            Edit Profile
          </Button>
        </div>
        
        {/* Profile Summary Card - Now at the top */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Profile Summary</CardTitle>
            <CardDescription>How students see your profile</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={teacherProfile?.profilePictureUrl} alt={getFullName(teacherProfile?.firstName || "", teacherProfile?.lastName || "")} />
                <AvatarFallback className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 text-white text-lg">
                  {getInitials(teacherProfile?.firstName || "", teacherProfile?.lastName || "")}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h3 className="font-bold text-xl">{getFullName(teacherProfile?.firstName || "", teacherProfile?.lastName || "")}</h3>
                {teacherProfile?.timeZone && <p className="text-gray-500">Time Zone: {teacherProfile.timeZone}</p>}
                {teacherProfile?.averageRating !== undefined && teacherProfile.averageRating > 0 && (
                  <div className="flex items-center">
                    <span className="text-amber-500 mr-1">★</span>
                    <span>{teacherProfile.averageRating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
          {/* Profile Details */}
          <Card className="w-full lg:col-span-2">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Your teacher details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">First Name</h4>
                    <p className="font-medium">{teacherProfile?.firstName || "Not provided"}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Last Name</h4>
                    <p className="font-medium">{teacherProfile?.lastName || "Not provided"}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Bio</h4>
                  <p className="whitespace-pre-wrap">{teacherProfile?.bio || "No bio added yet"}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Time Zone</h4>
                    <p className="font-medium">{teacherProfile?.timeZone || "Not provided"}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Contact Number</h4>
                    <p className="font-medium">{teacherProfile?.contactNumber || "Not provided"}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Experience</h4>
                  <p className="whitespace-pre-wrap">{teacherProfile?.experience || "Not provided"}</p>
                </div>
                
                {teacherProfile?.introVideoUrl && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Introduction Video</h4>
                    <a 
                      href={teacherProfile.introVideoUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View introduction video
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Teaching Status */}
          <Card className="w-full lg:col-span-1">
            <CardHeader>
              <CardTitle>Teaching Status</CardTitle>
              <CardDescription>Verification and ratings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-2">Verification Status</h4>
                <Badge 
                  variant={teacherProfile?.isVerified ? "default" : "secondary"} 
                  className="py-1 px-3"
                >
                  {teacherProfile?.isVerified ? "Verified Teacher" : "Pending Verification"}
                </Badge>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Rating</h4>
                {teacherProfile?.averageRating !== undefined && teacherProfile.averageRating > 0 ? (
                  <div className="flex items-center text-lg">
                    <span className="text-amber-500 mr-1">★</span>
                    <span>{teacherProfile.averageRating.toFixed(1)}</span>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No ratings yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Teaching Subjects & Modules Management */}
        <TeacherSubjectsManager />
      </div>
      
      {/* Profile Edit Modal */}
      <ProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleProfileUpdate}
        initialData={{
          firstName: teacherProfile?.firstName || "",
          lastName: teacherProfile?.lastName || "",
          bio: teacherProfile?.bio || "",
          experience: teacherProfile?.experience || "",
          email: user?.email || "",
          profile_picture_url: teacherProfile?.profilePictureUrl || "",
          introVideoUrl: teacherProfile?.introVideoUrl || "",
          timeZone: teacherProfile?.timeZone || "",
          contactNumber: teacherProfile?.contactNumber || ""
        }}
        profileType="teacher"
        userId={user?.id || ""}
      />
    </DashboardLayout>
  );
};

export default TeacherProfile;