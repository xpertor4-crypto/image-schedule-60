import { cn } from "@/lib/utils";

interface Event {
  id: string;
  title: string;
  type: "visit" | "appointment" | "activity" | "livestream";
  startTime: string;
  endTime: string;
}

interface CalendarEventProps {
  event: Event;
  onClick: () => void;
}

const eventStyles = {
  visit: "bg-event-visit-light border-event-visit text-event-visit",
  appointment: "bg-event-appointment-light border-event-appointment text-event-appointment",
  activity: "bg-event-activity-light border-event-activity text-event-activity",
  livestream: "bg-red-50 border-red-500 text-red-700",
};

export const CalendarEvent = ({ event, onClick }: CalendarEventProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-2 rounded-md border-l-4 mb-1 transition-all hover:shadow-md hover:scale-[1.02]",
        eventStyles[event.type]
      )}
    >
      <div className="text-xs font-semibold mb-0.5">{event.startTime}</div>
      <div className="text-sm font-medium truncate">{event.title}</div>
    </button>
  );
};
