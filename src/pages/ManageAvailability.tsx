import { DashboardLayout } from "@/components/DashboardLayout";
import { TeacherAvailability } from "@/components/TeacherAvailability";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, Clock, Info } from "lucide-react";

const ManageAvailability = () => {
  return (
    <DashboardLayout userType="teacher">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manage Availability</h1>
          <p className="text-gray-500">Set your teaching schedule and manage your available time slots</p>
        </div>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 flex gap-3 items-start">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-blue-800 font-medium">How availability works</p>
              <p className="text-sm text-blue-700 mt-1">
                Set recurring weekly time slots or specific dates when you're available to teach. 
                Students will only be able to book lessons during these times. All times are shown in your local timezone.
              </p>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="availability">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="availability" className="flex gap-2 items-center">
              <CalendarClock className="h-4 w-4" />
              Set Availability
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex gap-2 items-center">
              <Clock className="h-4 w-4" />
              Scheduling Settings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="availability" className="pt-6">
            <TeacherAvailability />
          </TabsContent>
          
          <TabsContent value="settings" className="pt-6">
            <Card>
              <CardHeader>
                <CardTitle>Scheduling Settings</CardTitle>
                <CardDescription>
                  Configure how students can book your available time slots
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Minimum advance notice</h3>
                    <p className="text-sm text-gray-500">
                      Students must book this far in advance
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge>24 hours</Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Lesson duration</h3>
                    <p className="text-sm text-gray-500">
                      Default length of your lessons
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge>60 minutes</Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Buffer time</h3>
                    <p className="text-sm text-gray-500">
                      Break between consecutive lessons
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge>15 minutes</Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Cancellation policy</h3>
                    <p className="text-sm text-gray-500">
                      When students can cancel without penalty
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge>24 hours before</Badge>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-500 border-t pt-4">
                  These settings are simplified for the MVP version. In future updates, you'll be able to customize each of these parameters.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ManageAvailability; 