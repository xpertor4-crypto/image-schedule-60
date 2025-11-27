import { useEffect } from "react";
import { useTheme } from "next-themes";

export function useAutoTheme(enabled: boolean) {
  const { setTheme } = useTheme();

  useEffect(() => {
    if (!enabled) return;

    const updateTheme = () => {
      const hour = new Date().getHours();
      // Dark mode from 18:00 (6 PM) to 6:00 (6 AM)
      const shouldBeDark = hour >= 18 || hour < 6;
      setTheme(shouldBeDark ? "dark" : "light");
    };

    // Update theme immediately
    updateTheme();

    // Check every minute
    const interval = setInterval(updateTheme, 60000);

    return () => clearInterval(interval);
  }, [enabled, setTheme]);
}
