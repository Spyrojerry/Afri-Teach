import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Lock, Bell, Shield, User } from "lucide-react";
import { getUserSettings, saveUserSettings } from "@/services/settingsService";

const StudentSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isEmailUser = user?.app_metadata?.provider === "email";
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [lessonReminders, setLessonReminders] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [messageNotifications, setMessageNotifications] = useState(true);

  // Privacy settings
  const [showProfileToTeachers, setShowProfileToTeachers] = useState(true);
  const [shareActivity, setShareActivity] = useState(true);
  const [language, setLanguage] = useState("english");
  const [timezone, setTimezone] = useState("UTC");

  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.id) return;
      try {
        const settings = await getUserSettings(user.id);
        const notifications = settings.notification_preferences;
        const privacy = settings.privacy_preferences;
        setEmailNotifications(notifications.emailNotifications ?? true);
        setLessonReminders(notifications.lessonReminders ?? true);
        setMarketingEmails(notifications.marketingEmails ?? false);
        setMessageNotifications(notifications.messageNotifications ?? true);
        setShowProfileToTeachers(privacy.showProfileToTeachers ?? true);
        setShareActivity(privacy.shareActivity ?? true);
        setLanguage(settings.language);
        setTimezone(settings.time_zone);
      } catch (error) {
        console.error("Failed to load student settings:", error);
      }
    };
    loadSettings();
  }, [user?.id]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Your new password and confirmation password do not match.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      if (isEmailUser) {
        if (!user.email || !currentPassword) {
          throw new Error("Enter your current password.");
        }
        const { error: reauthError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });
        if (reauthError) throw new Error("Your current password is incorrect.");
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: "Password updated",
        description: "Your password has been successfully updated.",
      });
      
      // Clear form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      console.error("Error updating password:", error);
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Could not update your password. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleNotificationSettingsSave = async () => {
    if (!user?.id) return;
    setIsUpdating(true);
    try {
      await saveUserSettings(user.id, {
        notification_preferences: {
          emailNotifications,
          lessonReminders,
          marketingEmails,
          messageNotifications,
        },
      });
      toast({ title: "Notification settings saved", description: "Your preferences will be used across AfriTeach." });
    } catch (error: unknown) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Your settings could not be saved.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePrivacySettingsSave = async () => {
    if (!user?.id) return;
    setIsUpdating(true);
    try {
      const { error: profileError } = await supabase
        .from("students")
        .update({ time_zone: timezone })
        .eq("id", user.id);
      if (profileError) throw profileError;

      await saveUserSettings(user.id, {
        privacy_preferences: { showProfileToTeachers, shareActivity },
        language,
        time_zone: timezone,
      });
      toast({ title: "Privacy settings saved", description: "Your privacy and regional preferences were updated." });
    } catch (error: unknown) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Your settings could not be saved.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <DashboardLayout userType="student">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
          <p className="text-gray-500">Manage your account preferences and settings</p>
        </div>

        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User size={16} />
              <span>Account</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell size={16} />
              <span>Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Shield size={16} />
              <span>Privacy</span>
            </TabsTrigger>
          </TabsList>

          {/* Account Settings */}
          <TabsContent value="account" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  Your basic account details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={user?.email || ""}
                      disabled
                    />
                    <p className="text-sm text-gray-500">
                      To change your email, please contact support
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Change Password
                </CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <form onSubmit={handlePasswordChange}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required={isEmailUser}
                      disabled={!isEmailUser}
                      placeholder={isEmailUser ? undefined : "Not required for social sign-in"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    disabled={isUpdating}
                    className="bg-gradient-to-r from-purple-600 to-purple-800"
                  >
                    {isUpdating ? "Updating..." : "Update Password"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Manage how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-gray-500">
                      Receive notifications via email
                    </p>
                  </div>
                  <Checkbox 
                    checked={emailNotifications}
                    onCheckedChange={(checked) => 
                      setEmailNotifications(checked === true)
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Lesson Reminders</Label>
                    <p className="text-sm text-gray-500">
                      Get reminders before your scheduled lessons
                    </p>
                  </div>
                  <Checkbox 
                    checked={lessonReminders}
                    onCheckedChange={(checked) => 
                      setLessonReminders(checked === true)
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Marketing Emails</Label>
                    <p className="text-sm text-gray-500">
                      Receive news and special offers
                    </p>
                  </div>
                  <Checkbox 
                    checked={marketingEmails}
                    onCheckedChange={(checked) => 
                      setMarketingEmails(checked === true)
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Message Notifications</Label>
                    <p className="text-sm text-gray-500">
                      Get notified when you receive new messages
                    </p>
                  </div>
                  <Checkbox 
                    checked={messageNotifications}
                    onCheckedChange={(checked) => 
                      setMessageNotifications(checked === true)
                    }
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleNotificationSettingsSave}
                  disabled={isUpdating}
                  className="bg-gradient-to-r from-purple-600 to-purple-800"
                  >
                  {isUpdating ? "Saving..." : "Save Notification Settings"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Privacy Settings */}
          <TabsContent value="privacy" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Privacy & Regional Settings</CardTitle>
                <CardDescription>
                  Control your privacy and regional preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show Profile to Teachers</Label>
                    <p className="text-sm text-gray-500">
                      Allow teachers to see your full profile
                    </p>
                  </div>
                  <Checkbox 
                    checked={showProfileToTeachers}
                    onCheckedChange={(checked) => 
                      setShowProfileToTeachers(checked === true)
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Share Activity</Label>
                    <p className="text-sm text-gray-500">
                      Share your learning progress with your teachers
                    </p>
                  </div>
                  <Checkbox 
                    checked={shareActivity}
                    onCheckedChange={(checked) => 
                      setShareActivity(checked === true)
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={language}
                    onValueChange={setLanguage}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Languages</SelectLabel>
                        <SelectItem value="english">English</SelectItem>
                        <SelectItem value="french">French</SelectItem>
                        <SelectItem value="swahili">Swahili</SelectItem>
                        <SelectItem value="arabic">Arabic</SelectItem>
                        <SelectItem value="portuguese">Portuguese</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timezone">Time Zone</Label>
                  <Select
                    value={timezone}
                    onValueChange={setTimezone}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Africa</SelectLabel>
                        <SelectItem value="Africa/Accra">Ghana (GMT)</SelectItem>
                        <SelectItem value="Africa/Lagos">West Africa (GMT+1)</SelectItem>
                        <SelectItem value="Africa/Cairo">Egypt (GMT+2)</SelectItem>
                        <SelectItem value="Africa/Nairobi">East Africa (GMT+3)</SelectItem>
                        <SelectItem value="Africa/Johannesburg">South Africa (GMT+2)</SelectItem>
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel>Other</SelectLabel>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="Europe/London">London (GMT)</SelectItem>
                        <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handlePrivacySettingsSave}
                  disabled={isUpdating}
                  className="bg-gradient-to-r from-purple-600 to-purple-800"
                  >
                  {isUpdating ? "Saving..." : "Save Privacy Settings"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default StudentSettings;
