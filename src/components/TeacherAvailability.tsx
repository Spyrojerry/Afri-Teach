import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { addDays, format, getDay, isSameDay, startOfToday } from "date-fns";
import { Clock, Plus, Save, Trash } from "lucide-react";

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

export const TeacherAvailability = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(startOfToday());
  const [recurringSlots, setRecurringSlots] = useState<TimeSlot[]>([]);
  const [specificDates, setSpecificDates] = useState<AvailableDate[]>([]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [isRecurring, setIsRecurring] = useState(true);

  // Days of the week
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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

  // Check if a date has availability
  const hasAvailability = (date: Date) => {
    // Check recurring slots
    const hasRecurring = recurringSlots.some(slot => slot.day === getDay(date));
    
    // Check specific date slots
    const hasSpecific = specificDates.some(d => isSameDay(d.date, date));
    
    return hasRecurring || hasSpecific;
  };

  // Save availability (would connect to backend in real implementation)
  const saveAvailability = () => {
    console.log("Saving availability:", {
      recurringSlots,
      specificDates
    });
    // Here you would make an API call to save the data
    alert("Availability saved successfully!");
  };

  return (
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
              available: (date) => hasAvailability(date)
            }}
            modifiersClassNames={{
              available: "bg-green-50 text-green-600 font-bold border border-green-200"
            }}
            disabled={{ before: startOfToday() }}
          />

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
                        {slot.startTime} - {slot.endTime}
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
                          {slot.startTime} - {slot.endTime}
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

          <Button 
            onClick={saveAvailability} 
            className="w-full bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 hover:from-slate-800 hover:via-purple-800 hover:to-slate-800"
          >
            <Save className="h-4 w-4 mr-2" />
            Save All Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}; 