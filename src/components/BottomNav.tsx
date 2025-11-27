import { Home, Compass, MessageCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const navItems = [
  { id: "home", label: "Home", icon: Home, path: "/" },
  { id: "journey", label: "Journey", icon: Compass, path: "/leaderboard" },
  { id: "chat", label: "Chat", icon: MessageCircle, path: "/chat" },
];

export const BottomNav = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50">
      <div className="flex items-center justify-around px-4 py-3 max-w-screen-xl mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center gap-1 min-w-[60px] transition-all duration-200 relative",
                isActive ? "transform scale-105" : ""
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200",
                  isActive
                    ? "bg-primary shadow-md"
                    : "bg-transparent"
                )}
              >
                <Icon
                  className={cn(
                    "w-6 h-6 transition-colors duration-200",
                    isActive ? "text-primary-foreground" : "text-muted-foreground"
                  )}
                  strokeWidth={2}
                />
              </div>
              <span
                className={cn(
                  "text-xs font-medium transition-colors duration-200",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {t(`navigation.${item.id}`)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
