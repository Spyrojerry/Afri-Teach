import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Calendar } from "@/components/ui/calendar";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  CalendarDays, 
  Clock, 
  Plus, 
  Trash, 
  User, 
  Calendar as CalendarIcon, 
  BookOpen,
  AlarmCheck,
  Video
} from "lucide-react";
import { 
  format, 
  addDays, 
  getDay, 
  isSameDay, 
  parseISO, 
  startOfToday 
} from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import { getUpcomingLessons, Lesson } from "@/services/lessonService";
import { getTeacherAvailability, saveTeacherAvailability } from "@/services/teacherService";
import { toast } from "@/components/ui/use-toast";

// Time slot interface
interface TimeSlot {
  id: string;
  day: number; // 0-6 (Sunday-Saturday)
  startTime: string;
  endTime: string;
  isRecurring: boolean;
}

// Available date interface (for specific dates)
interface AvailableDate {
  date: Date;
  timeSlots: Omit<TimeSlot, 'day' | 'isRecurring'>[];
}

// Break/Leave interface
interface BreakPeriod {
  id: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  type: "break" | "leave";
}

// Upcoming lesson interface (from lessonService)
interface UpcomingLesson {
  id: string;
  date: string; // ISO date string
  startTime: string;
  endTime: string;
  studentName: string;
  studentAvatar?: string;
  subject: string;
  meetingLink?: string;
}

// Database serialized versions of our interfaces
interface SerializedAvailableDate {
  date: string; // ISO date string
  timeSlots: Omit<TimeSlot, 'day' | 'isRecurring'>[];
}

interface SerializedBreakPeriod {
  id: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  reason: string;
  type: "break" | "leave";
}

// Availability data from database
interface AvailabilityData {
  recurringSlots: TimeSlot[];
  specificDates: SerializedAvailableDate[];
  breakPeriods: SerializedBreakPeriod[];
}

const TeacherSchedule = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(startOfToday());
  const [activeTab, setActiveTab] = useState("availability");
  const [recurringSlots, setRecurringSlots] = useState<TimeSlot[]>([]);
  const [specificDates, setSpecificDates] = useState<AvailableDate[]>([]);
  const [breakPeriods, setBreakPeriods] = useState<BreakPeriod[]>([]);
  const [upcomingLessons, setUpcomingLessons] = useState<UpcomingLesson[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [isRecurring, setIsRecurring] = useState(true);
  const [breakStartDate, setBreakStartDate] = useState<Date | undefined>(undefined);
  const [breakEndDate, setBreakEndDate] = useState<Date | undefined>(undefined);
  const [breakReason, setBreakReason] = useState("");
  const [breakType, setBreakType] = useState<"break" | "leave">("break");

  // Days of the week
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Fetch teacher availability on component mount
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!user?.id) return;
      
      try {
        const availabilityData = await getTeacherAvailability(user.id) as AvailabilityData;
        
        // Parse dates from string to Date objects for specific dates and break periods
        if (availabilityData.recurringSlots?.length > 0) {
          setRecurringSlots(availabilityData.recurringSlots);
        }
        
        if (availabilityData.specificDates?.length > 0) {
          const parsedDates = availabilityData.specificDates.map((dateObj: SerializedAvailableDate) => ({
            ...dateObj,
            date: new Date(dateObj.date)
          }));
          setSpecificDates(parsedDates);
        }
        
        if (availabilityData.breakPeriods?.length > 0) {
          const parsedBreaks = availabilityData.breakPeriods.map((breakObj: SerializedBreakPeriod) => ({
            ...breakObj,
            startDate: new Date(breakObj.startDate),
            endDate: new Date(breakObj.endDate)
          }));
          setBreakPeriods(parsedBreaks);
        }
      } catch (error) {
        console.error("Error fetching availability:", error);
        toast({
          title: "Error",
          description: "Failed to load your availability settings. Please try again later.",
          variant: "destructive"
        });
      }
    };
    
    fetchAvailability();
  }, [user?.id]);

  // Fetch real upcoming lessons
  useEffect(() => {
    const fetchLessons = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      try {
        const lessons = await getUpcomingLessons(user.id, "teacher");
        
        // Convert lessons to UpcomingLesson format
        const formattedLessons: UpcomingLesson[] = lessons.map(lesson => ({
          id: lesson.id,
          date: lesson.date,
          startTime: lesson.startTime,
          endTime: lesson.endTime,
          studentName: lesson.studentName || "Unknown Student",
          studentAvatar: lesson.studentAvatar,
          subject: lesson.subject,
          meetingLink: `https://meet.google.com/lesson-${lesson.id.substring(0, 8)}` // Mock meeting link
        }));
        
        setUpcomingLessons(formattedLessons);
      } catch (error) {
        console.error("Error fetching lessons:", error);
        toast({
          title: "Error",
          description: "Failed to load your upcoming lessons. Please try again later.",
          variant: "destructive"
        });
        
        // Fallback to empty array
        setUpcomingLessons([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLessons();
  }, [user?.id]);

  // Generate a unique ID
  const generateId = () => Math.random().toString(36).substring(2, 9);

  // Handler for adding a new time slot
  const handleAddTimeSlot = () => {
    if (!selectedDate) return;

    if (isRecurring) {
      // Add recurring slot
      const day = getDay(selectedDate);
      const newSlot: TimeSlot = {
        id: generateId(),
        day,
        startTime,
        endTime,
        isRecurring: true
      };
      setRecurringSlots([...recurringSlots, newSlot]);
    } else {
      // Add specific date slot
      const existingDateIndex = specificDates.findIndex(d => isSameDay(d.date, selectedDate));
      
      if (existingDateIndex >= 0) {
        // Add to existing date
        const updatedDates = [...specificDates];
        updatedDates[existingDateIndex].timeSlots.push({
          id: generateId(),
          startTime,
          endTime
        });
        setSpecificDates(updatedDates);
      } else {
        // Add new date
        setSpecificDates([
          ...specificDates,
          {
            date: selectedDate,
            timeSlots: [{
              id: generateId(),
              startTime,
              endTime
            }]
          }
        ]);
      }
    }
  };

  // Handler for adding a break or leave period
  const handleAddBreak = () => {
    if (!breakStartDate || !breakEndDate || !breakReason) return;

    const newBreak: BreakPeriod = {
      id: generateId(),
      startDate: breakStartDate,
      endDate: breakEndDate,
      reason: breakReason,
      type: breakType
    };

    setBreakPeriods([...breakPeriods, newBreak]);
    
    // Reset form
    setBreakStartDate(undefined);
    setBreakEndDate(undefined);
    setBreakReason("");
    setBreakType("break");
  };

  // Handler for removing a recurring time slot
  const removeRecurringSlot = (id: string) => {
    setRecurringSlots(recurringSlots.filter(slot => slot.id !== id));
  };

  // Handler for removing a specific date time slot
  const removeSpecificDateSlot = (dateIndex: number, slotId: string) => {
    const updatedDates = [...specificDates];
    updatedDates[dateIndex].timeSlots = updatedDates[dateIndex].timeSlots.filter(
      slot => slot.id !== slotId
    );
    
    // If no more time slots for this date, remove the date
    if (updatedDates[dateIndex].timeSlots.length === 0) {
      updatedDates.splice(dateIndex, 1);
    }
    
    setSpecificDates(updatedDates);
  };

  // Handler for removing a break period
  const removeBreakPeriod = (id: string) => {
    setBreakPeriods(breakPeriods.filter(period => period.id !== id));
  };

  // Check if a date has availability
  const hasAvailability = (date: Date) => {
    // Check recurring slots
    const hasRecurring = recurringSlots.some(slot => slot.day === getDay(date));
    
    // Check specific date slots
    const hasSpecific = specificDates.some(d => isSameDay(d.date, date));
    
    return hasRecurring || hasSpecific;
  };

  // Check if a date has a scheduled lesson
  const hasLesson = (date: Date) => {
    return upcomingLessons.some(lesson => isSameDay(parseISO(lesson.date), date));
  };

  // Check if a date is during a break or leave period
  const isBreakOrLeave = (date: Date) => {
    return breakPeriods.some(period => 
      date >= period.startDate && date <= period.endDate
    );
  };

  // Format time to AM/PM
  const formatTimeDisplay = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hourNum = parseInt(hours, 10);
    const period = hourNum >= 12 ? 'PM' : 'AM';
    const hour12 = hourNum % 12 === 0 ? 12 : hourNum % 12;
    return `${hour12}:${minutes} ${period}`;
  };

  // Function to save availability to the database
  const saveAvailability = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You need to be logged in to save your availability.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Convert Date objects to ISO strings for storage
      const formattedSpecificDates = specificDates.map(dateObj => ({
        ...dateObj,
        date: dateObj.date.toISOString()
      }));
      
      const formattedBreakPeriods = breakPeriods.map(breakObj => ({
        ...breakObj,
        startDate: breakObj.startDate.toISOString(),
        endDate: breakObj.endDate.toISOString()
      }));
      
      const success = await saveTeacherAvailability(user.id, {
        recurringSlots,
        specificDates: formattedSpecificDates,
        breakPeriods: formattedBreakPeriods
      });
      
      if (success) {
        toast({
          title: "Success",
          description: "Your availability has been saved successfully.",
          variant: "default"
        });
      } else {
        throw new Error("Failed to save availability");
      }
    } catch (error) {
      console.error("Error saving availability:", error);
      toast({
        title: "Error",
        description: "Failed to save your availability. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout userType="teacher" showBackButton={true} backTo="/teacher/profile">
      <div className="mx-auto px-4 py-8 pt-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold">My Schedule</h1>
          <Button 
            onClick={saveAvailability} 
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSaving ? (
              <>
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                Saving...
              </>
            ) : "Save Changes"}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="overflow-x-auto pb-2">
            <TabsList className="ml-8 w-full max-w-[600px] min-w-[400px]">
              <TabsTrigger value="availability" className="flex items-center gap-1">
                <CalendarDays className="h-4 w-4" />
                Manage Availability
              </TabsTrigger>
              <TabsTrigger value="schedule" className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" />
                Upcoming Schedule
              </TabsTrigger>
              <TabsTrigger value="breaks" className="flex items-center gap-1">
                <AlarmCheck className="h-4 w-4" />
                Breaks & Leave
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Availability Tab */}
          <TabsContent value="availability" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Calendar and Add Time Slot */}
              <Card>
                <CardHeader>
                  <CardTitle>Set Your Availability</CardTitle>
                  <CardDescription>
                    Select dates and times when you're available to teach
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                    modifiers={{
                      available: (date) => hasAvailability(date),
                      booked: (date) => hasLesson(date),
                      unavailable: (date) => isBreakOrLeave(date)
                    }}
                    modifiersClassNames={{
                      available: "bg-green-50 text-green-600 font-bold border border-green-200",
                      booked: "bg-blue-50 text-blue-600 font-bold border border-blue-200",
                      unavailable: "bg-orange-50 text-orange-600 font-bold border border-orange-200"
                    }}
                    disabled={{ before: startOfToday() }}
                  />

                  <div className="mt-4 text-sm text-center space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-200 border border-green-300"></div>
                      <span>Available</span>
                      <div className="w-3 h-3 rounded-full bg-blue-200 border border-blue-300 ml-2"></div>
                      <span>Booked</span>
                      <div className="w-3 h-3 rounded-full bg-orange-200 border border-orange-300 ml-2"></div>
                      <span>Break/Leave</span>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="recurring-switch" className="font-medium">Recurring weekly</Label>
                      <Switch 
                        id="recurring-switch" 
                        checked={isRecurring} 
                        onCheckedChange={setIsRecurring} 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="start-time">Start time</Label>
                        <Input
                          id="start-time"
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end-time">End time</Label>
                        <Input
                          id="end-time"
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                        />
                      </div>
                    </div>

                    <Button 
                      onClick={handleAddTimeSlot} 
                      className="w-full"
                      disabled={!selectedDate}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Time Slot
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Available Time Slots */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Available Time Slots</CardTitle>
                  <CardDescription>
                    Manage your weekly schedule and specific dates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Recurring Slots */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Weekly Recurring Slots</h3>
                    {recurringSlots.length > 0 ? (
                      <div className="space-y-2">
                        {recurringSlots.map((slot) => (
                          <div key={slot.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                            <div>
                              <p className="font-medium">{daysOfWeek[slot.day]}</p>
                              <p className="text-sm text-gray-500">
                                <Clock className="h-3 w-3 inline mr-1" />
                                {formatTimeDisplay(slot.startTime)} - {formatTimeDisplay(slot.endTime)}
                              </p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => removeRecurringSlot(slot.id)}
                            >
                              <Trash className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No recurring slots set</p>
                    )}
                  </div>

                  {/* Specific Dates */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Specific Dates</h3>
                    {specificDates.length > 0 ? (
                      <div className="space-y-4">
                        {specificDates.map((dateObj, dateIndex) => (
                          <div key={format(dateObj.date, 'yyyy-MM-dd')} className="space-y-2">
                            <p className="font-medium">{format(dateObj.date, 'EEEE, MMMM d, yyyy')}</p>
                            {dateObj.timeSlots.map((slot) => (
                              <div key={slot.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                                <p className="text-sm">
                                  <Clock className="h-3 w-3 inline mr-1" />
                                  {formatTimeDisplay(slot.startTime)} - {formatTimeDisplay(slot.endTime)}
                                </p>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => removeSpecificDateSlot(dateIndex, slot.id)}
                                >
                                  <Trash className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No specific dates set</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Upcoming Schedule Tab */}
          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Lessons</CardTitle>
                <CardDescription>
                  Your scheduled lessons with students
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-6">
                    <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your upcoming lessons...</p>
                  </div>
                ) : upcomingLessons.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingLessons.map(lesson => (
                      <Card key={lesson.id} className="overflow-hidden">
                        <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-semibold">{lesson.subject}</h3>
                              <p className="text-sm text-gray-500">
                                {format(parseISO(lesson.date), 'EEEE, MMMM d, yyyy')}
                              </p>
                            </div>
                            <Badge className="bg-blue-500">
                              {formatTimeDisplay(lesson.startTime)} - {formatTimeDisplay(lesson.endTime)}
                            </Badge>
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12 border-2 border-blue-100">
                              <AvatarImage src={lesson.studentAvatar} alt={lesson.studentName} />
                              <AvatarFallback>
                                {lesson.studentName.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-medium">{lesson.studentName}</h4>
                              <div className="flex items-center text-sm text-gray-500">
                                <BookOpen className="h-3.5 w-3.5 mr-1" />
                                {lesson.subject}
                              </div>
                            </div>
                          </div>
                          
                          {lesson.meetingLink && (
                            <div className="mt-4">
                              <Button className="w-full sm:w-auto" size="sm">
                                <Video className="h-4 w-4 mr-2" />
                                Join Lesson
                              </Button>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <Calendar className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                    <h3 className="text-lg font-medium text-gray-600">No upcoming lessons</h3>
                    <p className="text-gray-500 mt-1">
                      You don't have any lessons scheduled
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Breaks & Leave Tab */}
          <TabsContent value="breaks" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Add Break/Leave Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Schedule Break or Leave</CardTitle>
                  <CardDescription>
                    Set periods when you won't be available to teach
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="break-type">Type</Label>
                    <Select 
                      value={breakType} 
                      onValueChange={(value) => setBreakType(value as "break" | "leave")}
                    >
                      <SelectTrigger id="break-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="break">Short Break</SelectItem>
                        <SelectItem value="leave">Extended Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Calendar
                        mode="single"
                        selected={breakStartDate}
                        onSelect={setBreakStartDate}
                        className="rounded-md border"
                        disabled={{ before: startOfToday() }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Calendar
                        mode="single"
                        selected={breakEndDate}
                        onSelect={setBreakEndDate}
                        className="rounded-md border"
                        disabled={{ 
                          before: breakStartDate || startOfToday()
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="break-reason">Reason (optional)</Label>
                    <Input
                      id="break-reason"
                      placeholder="e.g., Vacation, Family visit, etc."
                      value={breakReason}
                      onChange={(e) => setBreakReason(e.target.value)}
                    />
                  </div>
                  
                  <Button 
                    onClick={handleAddBreak} 
                    className="w-full"
                    disabled={!breakStartDate || !breakEndDate}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Break Period
                  </Button>
                </CardContent>
              </Card>
              
              {/* Break Periods List */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Scheduled Breaks</CardTitle>
                  <CardDescription>
                    Manage your breaks and leave periods
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {breakPeriods.length > 0 ? (
                    <div className="space-y-4">
                      {breakPeriods.map((period) => (
                        <div key={period.id} className="p-4 bg-gray-50 rounded-md">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <Badge className={period.type === "break" ? "bg-orange-500" : "bg-red-500"}>
                                {period.type === "break" ? "Break" : "Extended Leave"}
                              </Badge>
                              {period.reason && (
                                <p className="text-sm mt-1 text-gray-600">{period.reason}</p>
                              )}
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => removeBreakPeriod(period.id)}
                            >
                              <Trash className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                          <div className="text-sm text-gray-600">
                            <p className="flex items-center">
                              <Calendar className="h-3.5 w-3.5 mr-1 inline" />
                              {format(period.startDate, 'MMMM d, yyyy')} - {format(period.endDate, 'MMMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-gray-50 rounded-lg">
                      <AlarmCheck className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                      <h3 className="text-lg font-medium text-gray-600">No breaks scheduled</h3>
                      <p className="text-gray-500 mt-1">
                        You haven't set any break or leave periods
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default TeacherSchedule; 