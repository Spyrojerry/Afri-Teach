import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/integrations/supabase/client";
import {
  Lock,
  Bell,
  Shield,
  User,
  DollarSign,
  Calendar,
  Clock,
  Video,
  VideoOff,
  Zap
} from "lucide-react";

const TeacherSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [lessonReminders, setLessonReminders] = useState(true);
  const [bookingNotifications, setBookingNotifications] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [paymentNotifications, setPaymentNotifications] = useState(true);
  
  // Privacy settings
  const [showRatings, setShowRatings] = useState(true);
  const [shareAvailability, setShareAvailability] = useState(true);
  const [language, setLanguage] = useState("english");
  const [timezone, setTimezone] = useState("UTC");
  
  // Payment info
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [swiftCode, setSwiftCode] = useState("");
  
  // Teaching preferences
  const [autoAcceptBookings, setAutoAcceptBookings] = useState(false);
  const [lessonBufferTime, setLessonBufferTime] = useState("15");
  const [maxDailyLessons, setMaxDailyLessons] = useState("5");
  const [preferredPlatform, setPreferredPlatform] = useState("zoom");
  const [defaultMeetingLink, setDefaultMeetingLink] = useState("");

  // Form handlers
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
    } catch (error: any) {
      console.error("Error updating password:", error);
      toast({
        title: "Update failed",
        description: error.message || "Could not update your password. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleNotificationSettingsSave = () => {
    toast({
      title: "Notification settings saved",
      description: "Your notification preferences have been updated.",
    });
  };

  const handlePrivacySettingsSave = () => {
    toast({
      title: "Privacy settings saved",
      description: "Your privacy settings have been updated.",
    });
  };
  
  const handlePaymentInfoSave = () => {
    toast({
      title: "Payment information saved",
      description: "Your payment details have been updated.",
    });
  };
  
  const handleTeachingPreferencesSave = () => {
    toast({
      title: "Teaching preferences saved",
      description: "Your teaching preferences have been updated.",
    });
  };

  return (
    <DashboardLayout userType="teacher">
      <div className="container mx-auto py-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Teacher Settings</h1>
          <p className="text-gray-500">Manage your account preferences and teaching settings</p>
        </div>

        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid grid-cols-5 w-full max-w-3xl">
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
            <TabsTrigger value="payment" className="flex items-center gap-2">
              <DollarSign size={16} />
              <span>Payment</span>
            </TabsTrigger>
            <TabsTrigger value="teaching" className="flex items-center gap-2">
              <Zap size={16} />
              <span>Teaching</span>
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
                      required
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
                    <Label>Booking Notifications</Label>
                    <p className="text-sm text-gray-500">
                      Get notified when a student books a lesson
                    </p>
                  </div>
                  <Checkbox 
                    checked={bookingNotifications}
                    onCheckedChange={(checked) => 
                      setBookingNotifications(checked === true)
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
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Payment Notifications</Label>
                    <p className="text-sm text-gray-500">
                      Get notified about payment processing and transfers
                    </p>
                  </div>
                  <Checkbox 
                    checked={paymentNotifications}
                    onCheckedChange={(checked) => 
                      setPaymentNotifications(checked === true)
                    }
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleNotificationSettingsSave}
                  className="bg-gradient-to-r from-purple-600 to-purple-800"
                >
                  Save Notification Settings
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
                    <Label>Show Ratings</Label>
                    <p className="text-sm text-gray-500">
                      Display your ratings and reviews publicly
                    </p>
                  </div>
                  <Checkbox 
                    checked={showRatings}
                    onCheckedChange={(checked) => 
                      setShowRatings(checked === true)
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Share Availability</Label>
                    <p className="text-sm text-gray-500">
                      Allow students to see your availability calendar
                    </p>
                  </div>
                  <Checkbox 
                    checked={shareAvailability}
                    onCheckedChange={(checked) => 
                      setShareAvailability(checked === true)
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
                  className="bg-gradient-to-r from-purple-600 to-purple-800"
                >
                  Save Privacy Settings
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Payment Settings */}
          <TabsContent value="payment" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Payment Information
                </CardTitle>
                <CardDescription>
                  Update your payment details for receiving funds
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="payment-method">Payment Method</Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="mobile_money">Mobile Money</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {paymentMethod === "bank_transfer" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="bank-name">Bank Name</Label>
                      <Input
                        id="bank-name"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="Enter your bank name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="account-name">Account Holder Name</Label>
                      <Input
                        id="account-name"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        placeholder="Enter account holder's name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="account-number">Account Number</Label>
                      <Input
                        id="account-number"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="Enter your account number"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="swift-code">SWIFT/BIC Code (For International Transfers)</Label>
                      <Input
                        id="swift-code"
                        value={swiftCode}
                        onChange={(e) => setSwiftCode(e.target.value)}
                        placeholder="Enter SWIFT code"
                      />
                    </div>
                  </>
                )}
                
                {paymentMethod === "mobile_money" && (
                  <div className="space-y-2">
                    <Label htmlFor="mobile-number">Mobile Money Number</Label>
                    <Input
                      id="mobile-number"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="Enter your mobile money number"
                    />
                  </div>
                )}
                
                {paymentMethod === "paypal" && (
                  <div className="space-y-2">
                    <Label htmlFor="paypal-email">PayPal Email</Label>
                    <Input
                      id="paypal-email"
                      type="email"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="Enter your PayPal email"
                    />
                  </div>
                )}
                
                <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-700">
                  <p>Payment processing can take 3-5 business days. Ensure your payment details are accurate to avoid delays.</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handlePaymentInfoSave}
                  className="bg-gradient-to-r from-purple-600 to-purple-800"
                >
                  Save Payment Information
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Teaching Preferences */}
          <TabsContent value="teaching" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Teaching Preferences</CardTitle>
                <CardDescription>
                  Customize your teaching experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-Accept Bookings</Label>
                    <p className="text-sm text-gray-500">
                      Automatically accept booking requests from students
                    </p>
                  </div>
                  <Checkbox 
                    checked={autoAcceptBookings}
                    onCheckedChange={(checked) => 
                      setAutoAcceptBookings(checked === true)
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="buffer-time">Lesson Buffer Time (minutes)</Label>
                  <Select
                    value={lessonBufferTime}
                    onValueChange={setLessonBufferTime}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select buffer time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No buffer</SelectItem>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500 mt-1">
                    Buffer time between consecutive lessons
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max-lessons">Maximum Daily Lessons</Label>
                  <Select
                    value={maxDailyLessons}
                    onValueChange={setMaxDailyLessons}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select maximum lessons" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 lessons</SelectItem>
                      <SelectItem value="4">4 lessons</SelectItem>
                      <SelectItem value="5">5 lessons</SelectItem>
                      <SelectItem value="6">6 lessons</SelectItem>
                      <SelectItem value="7">7 lessons</SelectItem>
                      <SelectItem value="8">8 lessons</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="preferred-platform">Preferred Video Platform</Label>
                  <Select
                    value={preferredPlatform}
                    onValueChange={setPreferredPlatform}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select video platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zoom">Zoom</SelectItem>
                      <SelectItem value="google_meet">Google Meet</SelectItem>
                      <SelectItem value="microsoft_teams">Microsoft Teams</SelectItem>
                      <SelectItem value="skype">Skype</SelectItem>
                      <SelectItem value="afriteach">AfriTeach Virtual Classroom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="default-link">Default Meeting Link (Optional)</Label>
                  <Input
                    id="default-link"
                    value={defaultMeetingLink}
                    onChange={(e) => setDefaultMeetingLink(e.target.value)}
                    placeholder="Enter your default meeting room link"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    This link will be used for all lessons unless specified otherwise
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleTeachingPreferencesSave}
                  className="bg-gradient-to-r from-purple-600 to-purple-800"
                >
                  Save Teaching Preferences
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default TeacherSettings; 