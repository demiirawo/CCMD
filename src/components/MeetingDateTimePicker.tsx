import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
interface MeetingDateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
}
export const MeetingDateTimePicker = ({
  value,
  onChange
}: MeetingDateTimePickerProps) => {
  const [date, setDate] = React.useState<Date>(() => {
    if (value) {
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    }
    return new Date();
  });
  const [time, setTime] = React.useState(() => {
    if (value) {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        return format(parsed, "HH:mm");
      }
    }
    // Default to current hour with 00 minutes
    const now = new Date();
    now.setMinutes(0, 0, 0);
    return format(now, "HH:mm");
  });
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
            {date ? format(date, "dd/MM/yyyy") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={date} onSelect={handleDateSelect} initialFocus className={cn("p-3 pointer-events-auto bg-white")} />
        </PopoverContent>
      </Popover>
      
      <Input type="time" value={time} onChange={e => handleTimeChange(e.target.value)} className="w-32 bg-white" />
    </div>;
};