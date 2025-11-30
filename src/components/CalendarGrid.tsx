import { useRef, useEffect } from "react";
import { format, addDays, startOfWeek, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from "date-fns";
import { CalendarEvent } from "./CalendarEvent";
import { ScrollArea } from "./ui/scroll-area";

interface Event {
  id: string;
  title: string;
  type: "visit" | "appointment" | "activity";
  startTime: string;
  endTime: string;
  date: Date;
}

interface CalendarGridProps {
  currentDate: Date;
  events: Event[];
  onEventClick: (event: Event) => void;
  viewMode: "day" | "week" | "month" | "list";
}

const timeSlots = Array.from({ length: 24 }, (_, i) => i); // 0 (12 AM) to 23 (11 PM)

export const CalendarGrid = ({ currentDate, events, onEventClick, viewMode }: CalendarGridProps) => {
  const currentTimeRef = useRef<HTMLDivElement>(null);
  const currentDayRef = useRef<HTMLDivElement>(null);
  const weekViewRef = useRef<HTMLDivElement>(null);
  
  // Generate 8 weeks of days for horizontal scrolling (4 weeks before and after current week)
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const scrollStart = addDays(weekStart, -28); // 4 weeks before
  const allDays = Array.from({ length: 56 }, (_, i) => addDays(scrollStart, i)); // 8 weeks total
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  const currentHour = new Date().getHours();
  const today = new Date();
  
  // Responsive column widths
  const isMobile = window.innerWidth < 768;
  const TIME_COLUMN_WIDTH = isMobile ? 50 : 80;
  const DAY_COLUMN_WIDTH = isMobile ? 80 : 150;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (viewMode === "week" && weekViewRef.current) {
        // Find the viewport element (ScrollArea creates this)
        const viewport = weekViewRef.current.closest('[data-radix-scroll-area-viewport]') as HTMLElement;
        if (viewport) {
          // Find the start of the current week in allDays
          const currentWeekStartIndex = allDays.findIndex(day => isSameDay(day, weekStart));
          if (currentWeekStartIndex !== -1) {
            // Position the start of the current week at the left edge of the viewport
            const isMobile = window.innerWidth < 768;
            const scrollTimeWidth = isMobile ? 50 : 80;
            const scrollDayWidth = isMobile ? 80 : 150;
            const currentWeekLeftEdge = scrollTimeWidth + (currentWeekStartIndex * scrollDayWidth);
            
            viewport.scrollTo({
              left: Math.max(0, currentWeekLeftEdge),
              behavior: 'smooth'
            });
          }
        }
        // Scroll to current time after horizontal scroll
        setTimeout(() => {
          currentTimeRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }, 300);
      } else if (viewMode === "day") {
        currentTimeRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      } else if (viewMode === "month") {
        currentDayRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [viewMode, allDays, today]);

  const getEventsForDayAndTime = (day: Date, hour: number) => {
    return events.filter((event) => {
      if (!isSameDay(event.date, day)) return false;
      const eventHour = parseInt(event.startTime.split(":")[0]);
      return eventHour === hour;
    });
  };

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => isSameDay(event.date, day));
  };

  // Day view - show only current day
  if (viewMode === "day") {
    const currentDay = currentDate;
    return (
      <div className="flex-1 overflow-auto bg-background">
      <div className="min-w-[300px] md:min-w-[500px]">
          <div className="grid grid-cols-[50px_1fr] md:grid-cols-[80px_1fr] bg-card sticky top-0 z-10 border-b border-border">
            <div className="p-2 md:p-4"></div>
            <div className="p-2 md:p-4 text-center border-l border-border">
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                {format(currentDay, "EEEE")}
              </div>
              <div className="text-2xl font-semibold text-primary">
                {format(currentDay, "MMMM d, yyyy")}
              </div>
            </div>
          </div>
          <div className="relative">
            {timeSlots.map((hour) => {
              const dayEvents = getEventsForDayAndTime(currentDay, hour);
              const isCurrentHour = hour === currentHour && isSameDay(currentDay, today);
              return (
                <div
                  key={hour}
                  ref={isCurrentHour ? currentTimeRef : null}
                  className="grid grid-cols-[50px_1fr] md:grid-cols-[80px_1fr] border-b border-grid-line"
                  style={{ minHeight: "60px" }}
                >
                  <div className="p-2 md:p-4 text-xs md:text-sm text-muted-foreground">
                    {format(new Date().setHours(hour, 0), "HH:mm")}
                  </div>
                  <div className="border-l border-grid-line p-1 hover:bg-grid-hover transition-colors relative">
                    {dayEvents.map((event) => (
                      <CalendarEvent
                        key={event.id}
                        event={event}
                        onClick={() => onEventClick(event)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Month view - calendar grid
  if (viewMode === "month") {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = addDays(startOfWeek(monthEnd, { weekStartsOn: 0 }), 6);
    const monthDays = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="flex-1 overflow-auto bg-background p-4">
        <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="bg-card p-2 text-center text-sm font-semibold text-muted-foreground">
              {day}
            </div>
          ))}
          {monthDays.map((day) => {
            const dayEvents = getEventsForDay(day);
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = isSameDay(day, today);
            
            return (
              <div
                key={day.toISOString()}
                ref={isToday ? currentDayRef : null}
                className={`bg-card p-2 min-h-[120px] ${
                  !isCurrentMonth ? "opacity-40" : ""
                }`}
              >
                <div
                  className={`text-sm font-semibold mb-1 ${
                    isToday
                      ? "bg-primary text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center"
                      : ""
                  }`}
                >
                  {format(day, "d")}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className="text-xs p-1 rounded cursor-pointer hover:opacity-80 truncate"
                      style={{
                        backgroundColor:
                          event.type === "visit"
                            ? "hsl(var(--chart-1))"
                            : event.type === "appointment"
                            ? "hsl(var(--chart-2))"
                            : "hsl(var(--chart-3))",
                      }}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // List view - scrollable list of all events
  if (viewMode === "list") {
    // Get a wider date range for scrolling (3 months before and after)
    const rangeStart = subMonths(currentDate, 3);
    const rangeEnd = addMonths(currentDate, 3);
    const allDays = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
    
    // Group events by day
    const daysWithEvents = allDays
      .map(day => ({
        day,
        events: getEventsForDay(day)
      }))
      .filter(item => item.events.length > 0);

    return (
      <ScrollArea className="flex-1 bg-background">
        <div className="p-6 space-y-6">
          {daysWithEvents.map(({ day, events }) => (
            <div key={day.toISOString()} className="space-y-3">
              <div className="flex items-center gap-3 sticky top-0 bg-background py-2 z-10">
                <div className={`text-3xl font-bold ${
                  isSameDay(day, new Date()) ? "text-primary" : "text-foreground"
                }`}>
                  {format(day, "d")}
                </div>
                <div>
                  <div className="text-sm font-semibold uppercase text-muted-foreground">
                    {format(day, "EEEE")}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(day, "MMMM yyyy")}
                  </div>
                </div>
              </div>
              <div className="space-y-2 pl-4">
                {events.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    className="p-4 rounded-lg border border-border bg-card hover:bg-accent cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="font-semibold text-foreground mb-1">
                          {event.title}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {event.startTime} - {event.endTime}
                        </div>
                      </div>
                      <div
                        className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor:
                            event.type === "visit"
                              ? "hsl(var(--chart-1))"
                              : event.type === "appointment"
                              ? "hsl(var(--chart-2))"
                              : "hsl(var(--chart-3))",
                        }}
                      >
                        {event.type}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {daysWithEvents.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No events found in the selected period
            </div>
          )}
        </div>
      </ScrollArea>
    );
  }

  // Week view (default) - horizontally and vertically scrollable
  return (
    <ScrollArea className="flex-1 bg-background" orientation="both">
      <div ref={weekViewRef} className="min-w-max h-full">
        {/* Header with days */}
        <div className="grid bg-card sticky top-0 z-10 border-b border-border" style={{ gridTemplateColumns: `${TIME_COLUMN_WIDTH}px repeat(${allDays.length}, ${DAY_COLUMN_WIDTH}px)` }}>
          <div className="p-2 md:p-4"></div>
          {allDays.map((day) => {
            const isToday = isSameDay(day, today);
            return (
              <div
                key={day.toISOString()}
                className="p-1 md:p-4 text-center border-l border-border"
              >
                <div className="text-[9px] md:text-xs uppercase tracking-wide text-muted-foreground mb-0.5 md:mb-1">
                  {format(day, "EEE")}
                </div>
                <div
                  className={`text-sm md:text-2xl font-semibold ${
                    isToday ? "text-primary" : "text-foreground"
                  }`}
                >
                  {format(day, "d")}
                </div>
                <div className="text-[9px] md:text-xs text-muted-foreground">
                  {format(day, "MMM")}
                </div>
              </div>
            );
          })}
        </div>

        {/* Time grid */}
        <div className="relative">
          {timeSlots.map((hour) => {
            const isCurrentHour = hour === currentHour;
            return (
              <div
                key={hour}
                ref={isCurrentHour ? currentTimeRef : null}
                className="grid border-b border-grid-line"
                style={{ gridTemplateColumns: `${TIME_COLUMN_WIDTH}px repeat(${allDays.length}, ${DAY_COLUMN_WIDTH}px)`, minHeight: isMobile ? "60px" : "80px" }}
              >
              <div className="p-2 md:p-4 text-xs md:text-sm text-muted-foreground sticky left-0 bg-background z-10">
                {format(new Date().setHours(hour, 0), "HH:mm")}
              </div>
              {allDays.map((day) => {
                const dayEvents = getEventsForDayAndTime(day, hour);
                return (
                  <div
                    key={`${day.toISOString()}-${hour}`}
                    className="border-l border-grid-line p-1 hover:bg-grid-hover transition-colors relative"
                  >
                    {dayEvents.map((event) => (
                      <CalendarEvent
                        key={event.id}
                        event={event}
                        onClick={() => onEventClick(event)}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
};
