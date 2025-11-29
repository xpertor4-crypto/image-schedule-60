import { format, addDays, isSameDay, subDays } from "date-fns";
import { cn } from "@/lib/utils";

interface WeekStripProps {
  currentDate: Date;
  onDateSelect: (date: Date) => void;
}

export const WeekStrip = ({ currentDate, onDateSelect }: WeekStripProps) => {
  // Center the current day by starting 3 days before it
  const centerStart = subDays(currentDate, 3);
  const days = Array.from({ length: 7 }, (_, i) => addDays(centerStart, i));
  const today = new Date();

  return (
    <div className="flex gap-2 px-4 py-3 overflow-x-auto">
      {days.map((day) => {
        const isToday = isSameDay(day, today);
        const isSelected = isSameDay(day, currentDate);
        
        return (
          <button
            key={day.toISOString()}
            onClick={() => onDateSelect(day)}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-2 rounded-lg min-w-[50px] transition-colors",
              isSelected && "bg-app-accent text-app-accent-foreground",
              !isSelected && "hover:bg-muted"
            )}
          >
            <span className="text-xs font-medium opacity-70">
              {format(day, "EEE")}
            </span>
            <span className={cn(
              "text-lg font-semibold",
              isToday && !isSelected && "text-app-accent"
            )}>
              {format(day, "d")}
            </span>
          </button>
        );
      })}
    </div>
  );
};
