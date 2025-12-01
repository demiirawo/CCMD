import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Parse dd/MM/yyyy HH:mm format correctly
const parseDateTimeString = (value: string): { date: Date; time: string } | null => {
  if (!value) return null;
  
  // Try to match dd/MM/yyyy HH:mm format
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/);
  if (match) {
    const [, day, month, year, hours, minutes] = match;
    const parsed = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
    if (!isNaN(parsed.getTime())) {
      return { date: parsed, time: `${hours}:${minutes}` };
    }
  }
  
  // Try to match dd/MM/yyyy format (without time)
  const dateOnlyMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dateOnlyMatch) {
    const [, day, month, year] = dateOnlyMatch;
    const parsed = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(parsed.getTime())) {
      return { date: parsed, time: "00:00" };
    }
  }
  
  // Try ISO format as fallback
  const isoParsed = new Date(value);
  if (!isNaN(isoParsed.getTime())) {
    return { date: isoParsed, time: format(isoParsed, "HH:mm") };
  }
  
  return null;
};

interface MeetingDateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
}
export const MeetingDateTimePicker = ({
  value,
  onChange
}: MeetingDateTimePickerProps) => {
  const [date, setDate] = React.useState<Date>(() => {
    const parsed = parseDateTimeString(value);
    return parsed ? parsed.date : new Date();
  });
  const [time, setTime] = React.useState(() => {
    const parsed = parseDateTimeString(value);
    if (parsed) {
      return parsed.time;
    }
    // Default to current hour with 00 minutes
    const now = new Date();
    now.setMinutes(0, 0, 0);
    return format(now, "HH:mm");
  });

  // Set the initial value when component mounts
  React.useEffect(() => {
    if (!value) {
      // If no value is provided, set the default datetime
      const now = new Date();
      now.setMinutes(0, 0, 0); // Set to current hour with 00 minutes
      const formattedDateTime = format(now, "dd/MM/yyyy HH:mm");
      onChange(formattedDateTime);
    }
  }, [value, onChange]);
  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate);
      updateDateTime(newDate, time);
    }
  };
  const handleTimeChange = (newTime: string) => {
    setTime(newTime);
    updateDateTime(date, newTime);
  };
  const updateDateTime = (selectedDate: Date, selectedTime: string) => {
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const dateTime = new Date(selectedDate);
    dateTime.setHours(hours, minutes, 0, 0);
    const formattedDateTime = format(dateTime, "dd/MM/yyyy HH:mm");
    onChange(formattedDateTime);
  };
  return <div className="flex gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant={"outline"} className={cn("flex-1 justify-start text-left font-normal bg-white border border-gray-200", !date && "text-muted-foreground")}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "dd/MM/yyyy") : <span>Pick a date (DD/MM/YYYY)</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-white" align="start">
          <Calendar mode="single" selected={date} onSelect={handleDateSelect} initialFocus className={cn("p-3 pointer-events-auto bg-white")} />
        </PopoverContent>
      </Popover>
      
      <Input type="time" value={time} onChange={e => handleTimeChange(e.target.value)} className="w-32 bg-white border border-gray-200" />
    </div>;
};