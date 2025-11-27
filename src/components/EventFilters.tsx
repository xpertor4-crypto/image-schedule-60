import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "react-i18next";

interface EventFiltersProps {
  filters: {
    visits: boolean;
    appointments: boolean;
    activities: boolean;
  };
  onFilterChange: (filter: keyof EventFiltersProps["filters"]) => void;
}

export const EventFilters = ({ filters, onFilterChange }: EventFiltersProps) => {
  const { t } = useTranslation();
  
  return (
    <div className="bg-card border-t border-border px-3 md:px-6 py-3 md:py-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
        <span className="text-xs md:text-sm font-medium text-muted-foreground whitespace-nowrap">{t("calendar.showAll")}</span>
        
        <div className="flex flex-wrap items-center gap-3 md:gap-6">
          <label className="flex items-center gap-2 cursor-pointer touch-manipulation">
            <Checkbox
              checked={filters.visits}
              onCheckedChange={() => onFilterChange("visits")}
              className="border-event-visit data-[state=checked]:bg-event-visit h-4 w-4 md:h-5 md:w-5"
            />
            <span className="text-xs md:text-sm font-medium">{t("calendar.visits")}</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer touch-manipulation">
            <Checkbox
              checked={filters.appointments}
              onCheckedChange={() => onFilterChange("appointments")}
              className="border-event-appointment data-[state=checked]:bg-event-appointment h-4 w-4 md:h-5 md:w-5"
            />
            <span className="text-xs md:text-sm font-medium">{t("calendar.appointments")}</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer touch-manipulation">
            <Checkbox
              checked={filters.activities}
              onCheckedChange={() => onFilterChange("activities")}
              className="border-event-activity data-[state=checked]:bg-event-activity h-4 w-4 md:h-5 md:w-5"
            />
            <span className="text-xs md:text-sm font-medium">{t("calendar.activities")}</span>
          </label>
        </div>
      </div>
    </div>
  );
};
