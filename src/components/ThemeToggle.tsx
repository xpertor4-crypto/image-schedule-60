import { Moon, Sun, Monitor, Clock } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useAutoTheme } from "@/hooks/use-auto-theme";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const { t } = useTranslation();
  const [autoThemeEnabled, setAutoThemeEnabled] = useState(false);

  useAutoTheme(autoThemeEnabled);

  // Load auto-theme preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("auto-theme");
    if (saved === "true") {
      setAutoThemeEnabled(true);
    }
  }, []);

  const handleThemeChange = (newTheme: string) => {
    if (newTheme === "auto") {
      setAutoThemeEnabled(true);
      localStorage.setItem("auto-theme", "true");
    } else {
      setAutoThemeEnabled(false);
      localStorage.setItem("auto-theme", "false");
      setTheme(newTheme);
    }
  };

  const currentMode = autoThemeEnabled ? "auto" : theme;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="w-full justify-start gap-3 h-auto py-3">
          {currentMode === "light" && <Sun className="h-5 w-5" />}
          {currentMode === "dark" && <Moon className="h-5 w-5" />}
          {currentMode === "system" && <Monitor className="h-5 w-5" />}
          {currentMode === "auto" && <Clock className="h-5 w-5" />}
          <span className="text-base">
            {currentMode === "light" && t('settings.theme.light')}
            {currentMode === "dark" && t('settings.theme.dark')}
            {currentMode === "system" && t('settings.theme.system')}
            {currentMode === "auto" && t('settings.theme.auto')}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleThemeChange("light")}>
          <Sun className="mr-2 h-4 w-4" />
          <span>{t('settings.theme.light')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          <span>{t('settings.theme.dark')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("system")}>
          <Monitor className="mr-2 h-4 w-4" />
          <span>{t('settings.theme.system')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("auto")}>
          <Clock className="mr-2 h-4 w-4" />
          <span>{t('settings.theme.auto')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
