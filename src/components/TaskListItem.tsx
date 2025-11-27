import { format } from "date-fns";
import { CheckCircle2, XCircle, Clock, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CalendarEvent {
  id: string;
  title: string;
  type: "visit" | "appointment" | "activity";
  startTime: string;
  endTime: string;
  date: Date;
  description?: string;
  status?: string;
  category?: string;
}

interface TaskListItemProps {
  event: CalendarEvent;
  onClick: () => void;
}

const typeColors = {
  visit: "bg-event-visit",
  appointment: "bg-event-appointment",
  activity: "bg-event-activity",
};

const typeLabels = {
  visit: "Habit",
  appointment: "Task",
  activity: "Habit",
};

export const TaskListItem = ({ event, onClick }: TaskListItemProps) => {
  const getStatusIcon = () => {
    if (event.status === "completed") {
      return <CheckCircle2 className="h-5 w-5 text-status-completed" />;
    }
    if (event.status === "cancelled") {
      return <XCircle className="h-5 w-5 text-status-failed" />;
    }
    return <Clock className="h-5 w-5 text-status-pending" />;
  };

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors group"
    >
      {/* Icon */}
      <div className={cn("rounded-xl p-2 flex-shrink-0", typeColors[event.type])}>
        <div className="h-5 w-5 bg-background/20 rounded" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 text-left">
        <div className="font-medium text-sm mb-1 truncate">{event.title}</div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="text-xs px-2 py-0 h-5">
            {typeLabels[event.type]}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {event.startTime}
          </span>
          {event.description && (
            <span className="text-xs text-muted-foreground truncate">
              {event.description}
            </span>
          )}
        </div>
      </div>

      {/* Status & Menu */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {getStatusIcon()}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
    </button>
  );
};
