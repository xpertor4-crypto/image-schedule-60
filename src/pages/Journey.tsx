import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Lock, CheckCircle2, Trophy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { MilestoneDialog } from "@/components/MilestoneDialog";

interface JourneyNode {
  id: number;
  level: string;
  isLocked: boolean;
  isActive: boolean;
  isCompleted: boolean;
  position: { x: number; y: number };
  label?: string;
}

const Journey = () => {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userPoints, setUserPoints] = useState(1250);
  const [selectedMilestone, setSelectedMilestone] = useState<JourneyNode | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();
  const activeNodeRef = useRef<HTMLButtonElement>(null);

  // Define journey nodes with positions along the path (bottom to top)
  const journeyNodes: JourneyNode[] = [
    { id: 1, level: "Level 1", isLocked: false, isActive: false, isCompleted: true, position: { x: 50, y: 95 }, label: "Beginner" },
    { id: 2, level: "Level 2", isLocked: false, isActive: false, isCompleted: true, position: { x: 20, y: 89 } },
    { id: 3, level: "Level 3", isLocked: false, isActive: true, isCompleted: false, position: { x: 75, y: 83 } },
    { id: 4, level: "Level 4", isLocked: true, isActive: false, isCompleted: false, position: { x: 25, y: 77 } },
    { id: 5, level: "Level 5", isLocked: true, isActive: false, isCompleted: false, position: { x: 80, y: 71 } },
    { id: 6, level: "Level 6", isLocked: true, isActive: false, isCompleted: false, position: { x: 20, y: 65 }, label: "Intermediate" },
    { id: 7, level: "Level 7", isLocked: true, isActive: false, isCompleted: false, position: { x: 75, y: 59 } },
    { id: 8, level: "Level 8", isLocked: true, isActive: false, isCompleted: false, position: { x: 25, y: 53 } },
    { id: 9, level: "Level 9", isLocked: true, isActive: false, isCompleted: false, position: { x: 70, y: 47 } },
    { id: 10, level: "Level 10", isLocked: true, isActive: false, isCompleted: false, position: { x: 30, y: 41 } },
    { id: 11, level: "Level 11", isLocked: true, isActive: false, isCompleted: false, position: { x: 75, y: 35 }, label: "Advanced" },
    { id: 12, level: "Level 12", isLocked: true, isActive: false, isCompleted: false, position: { x: 25, y: 29 } },
    { id: 13, level: "Level 13", isLocked: true, isActive: false, isCompleted: false, position: { x: 70, y: 23 } },
    { id: 14, level: "Level 14", isLocked: true, isActive: false, isCompleted: false, position: { x: 30, y: 17 } },
    { id: 15, level: "Level 15", isLocked: true, isActive: false, isCompleted: false, position: { x: 65, y: 11 } },
    { id: 16, level: "Level 16", isLocked: true, isActive: false, isCompleted: false, position: { x: 50, y: 5 }, label: "Master" },
  ];

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      } else {
        fetchUserData();
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!loading && activeNodeRef.current) {
      setTimeout(() => {
        activeNodeRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
    }
  }, [loading]);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("leaderboard_users")
          .select("total_points")
          .eq("id", user.id)
          .single();
        
        if (data) {
          setUserPoints(data.total_points);
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const handleMilestoneClick = (node: JourneyNode) => {
    setSelectedMilestone(node);
    setDialogOpen(true);
  };

  const getRank = (points: number): string => {
    if (points < 500) return "Novice";
    if (points < 1000) return "Apprentice";
    if (points < 2000) return "Expert";
    return "Master";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="text-lg text-muted-foreground">{t('common.loading')}</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const currentRank = getRank(userPoints);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background pb-24 pt-8 px-4">
      <div className="max-w-md mx-auto h-full flex flex-col">
        {/* Header with Avatar, Points, and Rank */}
        <div className="flex items-center gap-4 mb-8 bg-card rounded-3xl p-6 shadow-lg border border-border">
          <Avatar className="w-16 h-16 ring-2 ring-primary/20">
            <AvatarImage src={user.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
              {user.email?.[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-5 h-5 text-primary" />
              <Badge variant="secondary" className="text-xs font-semibold">
                {currentRank}
              </Badge>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {userPoints.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">XP Points</p>
          </div>
        </div>

        {/* Journey Path - Scrollable */}
        <ScrollArea className="flex-1 bg-card rounded-3xl shadow-lg border border-border">
          <div className="relative h-[1800px] p-8">
            {/* SVG Path */}
            <svg
              className="absolute inset-8 w-[calc(100%-4rem)] h-[calc(100%-4rem)]"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="pathGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--journey-path))" stopOpacity="0.3" />
                  <stop offset="50%" stopColor="hsl(var(--journey-path))" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="hsl(var(--journey-path))" stopOpacity="0.3" />
                </linearGradient>
              </defs>
              <path
                d="M 50 96
                   Q 45 94, 35 92
                   Q 25 90, 20 88
                   Q 15 86, 18 84
                   Q 25 82, 40 81
                   Q 60 80, 75 78
                   Q 82 77, 78 75
                   Q 70 73, 50 72
                   Q 30 71, 25 69
                   Q 20 67, 22 65
                   Q 26 63, 45 62
                   Q 65 61, 80 59
                   Q 85 58, 80 56
                   Q 70 54, 50 53
                   Q 30 52, 25 50
                   Q 20 48, 23 46
                   Q 28 44, 48 43
                   Q 65 42, 75 40
                   Q 80 39, 75 37
                   Q 65 35, 50 34
                   Q 35 33, 30 31
                   Q 25 29, 28 27
                   Q 35 25, 55 24
                   Q 70 23, 75 21
                   Q 78 20, 72 18
                   Q 60 16, 45 15
                   Q 30 14, 25 12
                   Q 22 10, 26 8
                   Q 35 6, 55 5
                   Q 68 4, 70 3
                   Q 72 2, 65 1
                   Q 58 0, 50 -1"
                fill="none"
                stroke="url(#pathGradient)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {/* Journey Nodes */}
            {journeyNodes.map((node) => (
              <div key={node.id}>
                {/* Node */}
                <button
                  ref={node.isActive ? activeNodeRef : null}
                  onClick={() => handleMilestoneClick(node)}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full"
                  style={{
                    left: `${node.position.x}%`,
                    top: `${node.position.y}%`,
                  }}
                >
                  <div
                    className={`
                      w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-300
                      ${node.isCompleted 
                        ? 'bg-journey-completed' 
                        : node.isActive 
                        ? 'bg-journey-active animate-pulse-glow' 
                        : 'bg-journey-locked'
                      }
                    `}
                  >
                    {node.isCompleted ? (
                      <CheckCircle2 className="w-8 h-8 text-white" strokeWidth={2.5} />
                    ) : node.isActive ? (
                      <div className="w-6 h-6 rounded-full bg-white" />
                    ) : (
                      <Lock className="w-6 h-6 text-white/70" strokeWidth={2.5} />
                    )}
                  </div>
                </button>

                {/* Label */}
                {node.label && (
                  <div
                    className="absolute transform -translate-x-1/2 z-0 pointer-events-none"
                    style={{
                      left: `${node.position.x}%`,
                      top: `${node.position.y - 5}%`,
                    }}
                  >
                    <Badge variant="outline" className="text-xs font-semibold whitespace-nowrap bg-card/80 backdrop-blur-sm">
                      {node.label}
                    </Badge>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <MilestoneDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        milestone={selectedMilestone}
      />
    </div>
  );
};

export default Journey;
