import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import logo from "@/assets/logo.png";

interface CalendarHeaderProps {
  currentDate: Date;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  viewMode: "day" | "week" | "month" | "list";
  onViewModeChange: (mode: "day" | "week" | "month" | "list") => void;
  onDownload: () => void;
  showDownload: boolean;
}

export const CalendarHeader = ({
  currentDate,
  onPreviousWeek,
  onNextWeek,
  onToday,
  viewMode,
  onViewModeChange,
  onDownload,
  showDownload,
}: CalendarHeaderProps) => {
  const { t } = useTranslation();
  
  return (
    <header className="bg-card border-b border-border px-3 md:px-6 py-3 md:py-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Date and Navigation - Stack on mobile */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <img src={logo} alt="Logo" className="w-8 h-8 md:w-10 md:h-10" />
            <h1 className="text-xl md:text-2xl font-bold">
              {format(currentDate, "MMMM yyyy")}
            </h1>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="outline" size="sm" className="h-8 w-8 md:h-10 md:w-10" onClick={onPreviousWeek}>
              <ChevronLeft className="w-3 h-3 md:w-4 md:h-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-8 px-2 md:h-10 md:px-4 text-xs md:text-sm" onClick={onToday}>
              {t("calendar.today")}
            </Button>
            <Button variant="outline" size="sm" className="h-8 w-8 md:h-10 md:w-10" onClick={onNextWeek}>
              <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
            </Button>
          </div>
        </div>

        {/* Controls - Stack on mobile */}
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <LanguageSwitcher />
          
          {/* View Mode Toggle - Compact on mobile */}
          <div className="flex items-center gap-0.5 md:gap-1 bg-secondary rounded-lg p-0.5 md:p-1">
            {(["day", "week", "month", "list"] as const).map((mode) => (
              <Button
                key={mode}
                variant={viewMode === mode ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewModeChange(mode)}
                className="capitalize h-7 px-2 text-xs md:h-9 md:px-3 md:text-sm"
              >
                {t(`calendar.${mode}`)}
              </Button>
            ))}
          </div>
          
          {showDownload && (
            <Button onClick={onDownload} size="sm" className="shadow-sm h-7 md:h-9 text-xs md:text-sm">
              <Download className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">{t("calendar.downloadApp")}</span>
              <span className="sm:hidden">Install</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
