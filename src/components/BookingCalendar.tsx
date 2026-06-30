import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format, addDays, isToday, isSameDay, parseISO, startOfToday } from "date-fns";
import { CalendarClock, CheckCircle, Clock, CreditCard, ArrowRight, BookOpen } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { createBooking, LearningModule } from "@/services/bookingService";
import { ModuleSelector } from "./ModuleSelector";

// Teacher type
interface Teacher {
  id: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  subject?: string;
  specialties?: string[];
  subjects?: string[];
  hourly_rate?: number;
  price?: string;
  avatar?: string;
  profile_picture_url?: string;
  timezone?: string;
  time_zone?: string;
  email?: string;
}

// Time slot type
export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
}

// Available dates type
interface AvailableDay {
  date: string; // ISO string
  slots: TimeSlot[];
}

// Props for the BookingCalendar component
interface BookingCalendarProps {
  teacher: Teacher;
  studentName?: string;
  studentEmail?: string;
  onBookLesson?: (teacherId: string, slot: TimeSlot, date: Date, moduleId?: string, moduleName?: string) => void;
}

export const BookingCalendar = ({ teacher, onBookLesson }: BookingCalendarProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(startOfToday());
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [currentStep, setCurrentStep] = useState<'date' | 'time' | 'module' | 'confirm'>('date');
  const [isBooking, setIsBooking] = useState(false);
  const [availableDays, setAvailableDays] = useState<AvailableDay[]>([]);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(true);
  const [selectedModule, setSelectedModule] = useState<LearningModule | null>(null);

  const requestedTeacherTimeZone = teacher.time_zone || teacher.timezone || "UTC";
  const teacherTimeZone = (() => {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: requestedTeacherTimeZone }).format();
      return requestedTeacherTimeZone;
    } catch {
      return "UTC";
    }
  })();

  const teacherLocalTimeToUtc = (date: string, time: string) => {
    const [year, month, day] = date.split("-").map(Number);
    const [hour, minute] = time.split(":").map(Number);
    const desired = Date.UTC(year, month - 1, day, hour, minute);
    let guess = desired;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: teacherTimeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).formatToParts(new Date(guess));
      const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
      const represented = Date.UTC(
        Number(values.year),
        Number(values.month) - 1,
        Number(values.day),
        Number(values.hour),
        Number(values.minute)
      );
      guess += desired - represented;
    }

    return new Date(guess);
  };

  const getRecurringDay = (slot: Record<string, unknown>) => {
    const rawDay = slot.dayOfWeek ?? slot.day ?? slot.day_of_week;
    const day = Number(rawDay);
    return Number.isFinite(day) ? day : null;
  };

  const getSlotTimes = (slot: Record<string, unknown>) => {
    const startTime = slot.startTime ?? slot.start_time;
    const endTime = slot.endTime ?? slot.end_time;

    if (typeof startTime !== "string" || typeof endTime !== "string") {
      return null;
    }

    return { startTime, endTime };
  };

  const normalizeSlot = (slot: Record<string, unknown>, id: string): TimeSlot | null => {
    const times = getSlotTimes(slot);
    return times ? { id, ...times } : null;
  };

  const getSpecificDateSlots = (specificDate: Record<string, unknown>) => {
    const slots = specificDate.slots ?? specificDate.timeSlots ?? specificDate.time_slots;
    return Array.isArray(slots) ? slots : [];
  };
  
  // Fetch real teacher availability
  useEffect(() => {
    const fetchTeacherAvailability = async () => {
      if (!teacher?.id) return;
      
      setIsLoadingAvailability(true);
      try {
        // Fetch teacher availability from Supabase
        const { data, error } = await supabase
          .from('teacher_availability')
          .select('*')
          .eq('teacher_id', teacher.id);
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
          setAvailableDays([]);
          return;
        }
        
        const availabilityData = data[0]; // Use the first record
        
        // Process the availability data
        const availableDays: AvailableDay[] = [];
        
        // Handle recurring slots
        const recurringSlots = availabilityData.recurring_slots;
        if (recurringSlots && Array.isArray(recurringSlots)) {
          // Calculate available days for the next 2 weeks based on recurring slots
          const today = startOfToday();
          
          for (let i = 0; i < 14; i++) {
            const currentDate = addDays(today, i);
            const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
            
            // Find slots for this day of the week
            const slotsForDay = recurringSlots.filter(slot => 
              getRecurringDay(slot) === dayOfWeek
            );
            
            if (slotsForDay.length > 0) {
              const formattedSlots = slotsForDay
                .map((slot, index) => normalizeSlot(slot, `recurring-${i}-${index}`))
                .filter((slot): slot is TimeSlot => Boolean(slot));
              
              if (formattedSlots.length > 0) {
                availableDays.push({
                  date: format(currentDate, 'yyyy-MM-dd'),
                  slots: formattedSlots
                });
              }
            }
          }
        }
        
        // Handle specific dates
        const specificDates = availabilityData.specific_dates;
        if (specificDates && Array.isArray(specificDates)) {
          specificDates.forEach(specificDate => {
            const slots = getSpecificDateSlots(specificDate);
            if (typeof specificDate.date === "string" && slots.length > 0) {
              const date = specificDate.date;
              const parsedDate = parseISO(date);
              
              // Include today and future dates.
              if (parsedDate >= startOfToday()) {
                const formattedSlots = slots
                  .map((slot, index) => normalizeSlot(slot, `specific-${date}-${index}`))
                  .filter((slot): slot is TimeSlot => Boolean(slot));
                
                // Check if we already have this date from recurring slots
                const existingDayIndex = availableDays.findIndex(day => day.date === date);
                if (formattedSlots.length === 0) {
                  return;
                } else if (existingDayIndex >= 0) {
                  // Merge slots
                  availableDays[existingDayIndex].slots = [
                    ...availableDays[existingDayIndex].slots,
                    ...formattedSlots
                  ];
                } else {
                  // Add new day
                  availableDays.push({
                    date,
                    slots: formattedSlots
                  });
                }
              }
            }
          });
        }
        
        // Remove slots during break periods
        const breakPeriods = availabilityData.break_periods;
        const publishAvailableDays = (days: AvailableDay[]) => {
          const sortedDays = [...days].sort((a, b) => a.date.localeCompare(b.date));
          setAvailableDays(sortedDays);
        };

        if (breakPeriods && Array.isArray(breakPeriods)) {
          // Filter out days that fall within break periods
          const filteredDays = availableDays.filter(day => {
            const dayDate = parseISO(day.date);
            
            // Check if this day is within any break period
            return !breakPeriods.some(period => {
              const startDate = parseISO(period.startDate);
              const endDate = parseISO(period.endDate);
              return dayDate >= startDate && dayDate <= endDate;
            });
          });
          
          publishAvailableDays(filteredDays);
        } else {
          publishAvailableDays(availableDays);
        }
      } catch (err) {
        console.error("Failed to fetch teacher availability:", err);
        setAvailableDays([]);
        toast({
          title: "Could not load availability",
          description: "Please refresh and try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingAvailability(false);
      }
    };
    
    fetchTeacherAvailability();
  }, [teacher?.id]);
  
  // Check if a date has available slots
  const hasAvailableSlots = (date: Date) => {
    return availableDays.some(day => 
      isSameDay(parseISO(day.date), date) && day.slots.length > 0
    );
  };

  // Get slots for the selected date
  const getSlotsForDate = (date: Date): TimeSlot[] => {
    if (!date) return [];
    
    const day = availableDays.find(day => 
      isSameDay(parseISO(day.date), date)
    );
    
    return day ? day.slots : [];
  };

  // Format the time to display
  const formatTimeDisplay = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hourNum = parseInt(hours, 10);
    const period = hourNum >= 12 ? 'PM' : 'AM';
    const hour12 = hourNum % 12 === 0 ? 12 : hourNum % 12;
    return `${hour12}:${minutes} ${period}`;
  };

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setSelectedModule(null);

    if (date && hasAvailableSlots(date)) {
      setCurrentStep('time');
    } else {
      setCurrentStep('date');
    }
  };

  // Handle time slot selection
  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    
    // Move to module selection if the teacher has a subject
    if (teacher.subject || (teacher.subjects && teacher.subjects.length > 0)) {
      setCurrentStep('module');
    } else {
      // Skip to confirmation if no subject available
      setCurrentStep('confirm');
    }
  };
  
  // Fetch teacher's modules for a subject
  const getTeacherModules = async (subject: string) => {
    try {
      // Fetch the teacher's selected modules for this subject
      const { data, error } = await supabase
        .from('teachers')
        .select('teacher_modules')
        .eq('id', teacher.id)
        .single();
      
      if (error) {
        console.error("Error fetching teacher modules:", error);
        return null;
      }
      
      // Get the selected module IDs for this subject
      const teacherModules = data.teacher_modules || {};
      return teacherModules[subject] || [];
    } catch (err) {
      console.error("Failed to fetch teacher modules:", err);
      return null;
    }
  };
  
  // Handle module selection
  const handleModuleSelect = (module: LearningModule | null) => {
    setSelectedModule(module);
    setCurrentStep('confirm');
  };

  // Handle booking confirmation
  const handleConfirmBooking = async () => {
    if (!selectedDate || !selectedSlot || !user?.id) {
      toast({
        title: "Booking Error",
        description: "Missing required booking information",
        variant: "destructive",
      });
      return;
    }
    
    setIsBooking(true);
    
    try {
      // Get teacher's subject
      const subject = selectedModule?.subject || 
                     teacher.subject || 
                     (teacher.subjects && teacher.subjects.length > 0 ? teacher.subjects[0] : "General");
      
      // Create start and end time in UTC
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const startDate = teacherLocalTimeToUtc(dateStr, selectedSlot.startTime);
      const endDate = teacherLocalTimeToUtc(dateStr, selectedSlot.endTime);
      
      // Create the booking
      const bookingData = {
        teacher_id: teacher.id,
        student_id: user.id,
        subject: subject,
        module_id: selectedModule?.id,
        date: dateStr,
        start_time: selectedSlot.startTime,
        end_time: selectedSlot.endTime,
        start_time_utc: startDate.toISOString(),
        end_time_utc: endDate.toISOString(),
        notes: selectedModule ? `Module: ${selectedModule.name}` : ""
      };
      
      // Call the booking service
      const booking = await createBooking(bookingData);
      
      toast({
        title: "Booking Confirmed!",
        description: "Your lesson has been booked successfully.",
      });
      
      // Call the parent component's callback if provided
      if (onBookLesson) {
        onBookLesson(teacher.id, selectedSlot, selectedDate, selectedModule?.id, selectedModule?.name);
      }
      
      // Reset the form
      resetBooking();
      
    } catch (error) {
      console.error("Error during booking:", error);
      toast({
        title: "Booking Error",
        description: "There was an error processing your booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBooking(false);
    }
  };

  // Reset the booking flow
  const resetBooking = () => {
    setSelectedDate(undefined);
    setSelectedSlot(null);
    setSelectedModule(null);
    setCurrentStep('date');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <CalendarClock className="h-5 w-5" />
          Book a Lesson
        </CardTitle>
        <CardDescription>
          Select an available date and time for your lesson with {teacher.name || `${teacher.first_name} ${teacher.last_name}`}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {isLoadingAvailability ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            <span className="ml-2">Loading availability...</span>
          </div>
        ) : (
          <>
            {currentStep === 'date' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-md text-sm text-blue-800">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span>
                    Select a date that shows availability. Times are shown in {teacherTimeZone}.
                  </span>
                </div>
                
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  className="rounded-md border"
                  modifiers={{
                    available: (date) => hasAvailableSlots(date)
                  }}
                  modifiersClassNames={{
                    available: "bg-green-50 text-green-600 font-bold border border-green-200"
                  }}
                  disabled={{ before: startOfToday() }}
                />

                {availableDays.length === 0 ? (
                  <div className="rounded-md border border-dashed p-4 text-sm text-gray-600">
                    This teacher has not added any available lesson times yet.
                  </div>
                ) : selectedDate && !hasAvailableSlots(selectedDate) ? (
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    <p className="font-medium">No bookable time slots on {format(selectedDate, "MMMM d")}.</p>
                    <p className="mt-1">Choose one of the highlighted dates, or pick the next available day below.</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {availableDays.slice(0, 4).map(day => {
                        const date = parseISO(day.date);
                        return (
                          <Button
                            key={day.date}
                            type="button"
                            variant="outline"
                            size="sm"
                            className="bg-white"
                            onClick={() => handleDateSelect(date)}
                          >
                            {format(date, "MMM d")}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
            
            {currentStep === 'time' && selectedDate && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">
                    {isToday(selectedDate) ? "Today" : format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentStep('date')}>
                    Change date
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {getSlotsForDate(selectedDate).length > 0 ? (
                    getSlotsForDate(selectedDate).map(slot => (
                      <div 
                        key={slot.id}
                        className="p-3 border rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleSlotSelect(slot)}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span>
                              {formatTimeDisplay(slot.startTime)} - {formatTimeDisplay(slot.endTime)}
                            </span>
                          </div>
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-4">
                      No available time slots for this date
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {currentStep === 'module' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Select Learning Module</h3>
                    <p className="text-sm text-gray-500">
                      Track your progress with a structured learning path
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentStep('time')}>
                    Back to time selection
                  </Button>
                </div>
                
                <ModuleSelector 
                  subject={teacher.subject || (teacher.subjects && teacher.subjects.length > 0 ? teacher.subjects[0] : "General")}
                  onModuleSelect={handleModuleSelect}
                  teacherId={teacher.id}
                />
              </div>
            )}
            
            {currentStep === 'confirm' && selectedDate && selectedSlot && (
              <div className="space-y-6">
                <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={teacher.avatar || teacher.profile_picture_url} alt={teacher.name} />
                      <AvatarFallback className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                        {teacher.first_name?.[0]}{teacher.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{teacher.name || `${teacher.first_name} ${teacher.last_name}`}</h3>
                      <p className="text-sm text-gray-500">
                        {teacher.subject || (teacher.subjects && teacher.subjects.length > 0 ? teacher.subjects[0] : "Tutor")}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                    <div>
                      <p className="text-xs text-gray-500">Date</p>
                      <p className="font-medium">
                        {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Time</p>
                      <p className="font-medium">
                        {formatTimeDisplay(selectedSlot.startTime)} - {formatTimeDisplay(selectedSlot.endTime)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Price</p>
                      <p className="font-medium text-green-600">
                        ${teacher.hourly_rate || teacher.price?.replace(/\D/g, '') || "25"}/hour
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Timezone</p>
                      <p className="font-medium">{teacher.timezone || teacher.time_zone || "Your local time"}</p>
                    </div>
                  </div>
                  
                  {selectedModule && (
                    <div className="pt-3 border-t">
                      <p className="text-xs text-gray-500 mb-2">Selected Module</p>
                      <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                        <BookOpen className="h-3 w-3 mr-1" />
                        {selectedModule.name}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-2">{selectedModule.description}</p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium">Payment Information</h3>
                  <div className="p-3 border rounded-md flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-gray-500" />
                    <span className="text-gray-600">Payment will be collected upon booking confirmation</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between pt-4 border-t">
        {currentStep !== 'date' ? (
          <>
            <Button 
              variant="ghost" 
              onClick={() => {
                if (currentStep === 'time') setCurrentStep('date');
                else if (currentStep === 'module') setCurrentStep('time');
                else if (currentStep === 'confirm') {
                  // If we came from module selection, go back to module selection
                  if (teacher.subject || (teacher.subjects && teacher.subjects.length > 0)) {
                    setCurrentStep('module');
                  } else {
                    // Otherwise go back to time selection
                    setCurrentStep('time');
                  }
                }
              }}
            >
              Back
            </Button>
            {currentStep === 'confirm' && (
              <Button 
                className="bg-gradient-to-r from-green-600 to-emerald-600" 
                onClick={handleConfirmBooking}
                disabled={isBooking}
              >
                {isBooking ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm Booking
                  </>
                )}
              </Button>
            )}
          </>
        ) : (
          <Button variant="ghost" onClick={resetBooking} className="ml-auto">
            Cancel
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}; 
