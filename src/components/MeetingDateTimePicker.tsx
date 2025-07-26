import { useState } from "react";
import { format } from "date-fns";
import { Calendar, Clock } from "lucide-react";
import { Button } from "./ui/button";
import { Calendar as CalendarComponent } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { cn } from "@/lib/utils";

interface MeetingDateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
}

export const MeetingDateTimePicker = ({ value, onChange }: MeetingDateTimePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Parse current value or set defaults
  const parseCurrentValue = () => {
    if (value && value !== "24/07/2025") {
      // Try to parse existing value
      const parts = value.split(' ');
      if (parts.length >= 2) {
        const datePart = parts[0];
        const timePart = parts[1];
        
        try {
          const [day, month, year] = datePart.split('/');
          const selectedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          return { date: selectedDate, time: timePart };
        } catch {
          // Fall back to defaults if parsing fails
        }
      }
    }
    
    // Default to today and current hour
    const now = new Date();
    const currentHour = now.getHours().toString().padStart(2, '0');
    return {
      date: now,
      time: `${currentHour}:00`
    };
  };

  const { date: selectedDate, time: selectedTime } = parseCurrentValue();
  
  // Generate time options (every hour from 00:00 to 23:00)
  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return `${hour}:00`;
  });

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      const formattedDate = format(newDate, "dd/MM/yyyy");
      const newValue = `${formattedDate} ${selectedTime}`;
      onChange(newValue);
    }
  };

  const handleTimeSelect = (newTime: string) => {
    if (selectedDate) {
      const formattedDate = format(selectedDate, "dd/MM/yyyy");
      const newValue = `${formattedDate} ${newTime}`;
      onChange(newValue);
    }
  };

  const displayValue = `${format(selectedDate, "dd/MM/yyyy")} ${selectedTime}`;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal h-auto p-3 min-h-[80px] bg-accent/5 hover:bg-accent/10 border-border/20"
        >
          <div className="flex items-start gap-2 w-full">
            <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="flex-1">
              <div className="text-sm font-medium text-foreground">
                {displayValue}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Click to change meeting date and time
              </div>
            </div>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-white border shadow-lg" align="start">
        <div className="bg-white rounded-lg p-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Select Date</label>
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              initialFocus
              className="p-3 pointer-events-auto bg-white rounded-lg"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Select Time</label>
            <Select value={selectedTime} onValueChange={handleTimeSelect}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {selectedTime}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-white max-h-60">
                {timeOptions.map((time) => (
                  <SelectItem key={time} value={time}>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {time}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end pt-2">
            <Button 
              onClick={() => setIsOpen(false)}
              size="sm"
            >
              Done
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};