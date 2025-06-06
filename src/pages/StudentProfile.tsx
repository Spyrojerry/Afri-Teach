import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/use-toast";
import { ProfileModal } from "@/components/ProfileModal";
import { supabase } from "@/integrations/supabase/client";

const StudentProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Get user data from auth context
  const userData = {
    firstName: user?.user_metadata?.firstName || "",
    lastName: user?.user_metadata?.lastName || "",
    email: user?.email || "",
    bio: user?.user_metadata?.bio || "",
    avatar_url: user?.user_metadata?.avatar_url,
    interests: user?.user_metadata?.interests || [],
  };

  const handleSubmit = async (formData: any) => {
    if (!user) return;

    setIsUpdating(true);
    try {
      // Update the user metadata in Supabase
      const { error } = await supabase.auth.updateUser({
        data: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          bio: formData.bio,
          avatar_url: formData.avatar_url,
        },
      });

      if (error) throw error;

      // Also update the profiles table
      const { error: profileError } = await supabase.from("profiles").upsert({
        user_id: user.id,
        full_name: `${formData.firstName} ${formData.lastName}`.trim(),
        avatar_url: formData.avatar_url,
        role: "student",
      });

      if (profileError) {
        console.error("Error updating profile:", profileError);
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });

      setIsModalOpen(false);

      // Refresh the page to reflect changes
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update failed",
        description: "Could not update your profile. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Get user initials for avatar fallback
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <DashboardLayout userType="student">
      <div className="container mx-auto py-4 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-purple-800"
          >
            Edit Profile
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Summary Card */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Profile Summary</CardTitle>
              <CardDescription>Your public information</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage
                  src={userData.avatar_url}
                  alt={`${userData.firstName} ${userData.lastName}`}
                />
                <AvatarFallback className="bg-gradient-to-r from-purple-600 to-purple-700 text-white text-xl">
                  {getInitials(userData.firstName, userData.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h3 className="text-xl font-medium">
                  {userData.firstName} {userData.lastName}
                </h3>
                <p className="text-sm text-gray-500">{userData.email}</p>
              </div>
              <div className="w-full pt-4 border-t border-gray-200">
                <h4 className="font-medium mb-2">Interests</h4>
                <div className="flex flex-wrap gap-2">
                  {userData.interests.length > 0 ? (
                    userData.interests.map((interest, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
                      >
                        {interest}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">
                      No interests added yet
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Details Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
              <CardDescription>Your personal information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      First Name
                    </h4>
                    <p className="font-medium">{userData.firstName}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Last Name
                    </h4>
                    <p className="font-medium">{userData.lastName}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500">Email</h4>
                  <p className="font-medium">{userData.email}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500">Bio</h4>
                  <p className="whitespace-pre-wrap">
                    {userData.bio || "No bio added yet"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Profile Edit Modal */}
      <ProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={userData}
        profileType="student"
        userId={user?.id || ""}
      />
    </DashboardLayout>
  );
};

export default StudentProfile;
