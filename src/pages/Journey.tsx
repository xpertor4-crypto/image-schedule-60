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
  requiredPoints: number;
}

// Level requirements array - each value * 4 = points needed for that level
const LEVEL_REQUIREMENTS = [3, 6, 12, 14, 7, 10, 14, 7, 20, 30, 30, 30, 30, 30, 30, 30];

const calculateLevel = (totalPoints: number): number => {
  let level = 1;
  for (let i = 0; i < LEVEL_REQUIREMENTS.length; i++) {
    const requiredPoints = LEVEL_REQUIREMENTS[i] * 4;
    if (totalPoints >= requiredPoints) {
      level = i + 1;
    } else {
      break;
    }
  }
  return level;
};

const checkConsecutiveMissedDays = async (userId: string): Promise<number> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let consecutiveMissed = 0;
  let checkDate = new Date(today);
  checkDate.setDate(checkDate.getDate() - 1); // Start from yesterday
  
  // Check last 30 days for missed days
  for (let i = 0; i < 30; i++) {
    const dateStr = checkDate.toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('events')
      .select('id, status, completed_at')
      .eq('user_id', userId)
      .gte('start_time', `${dateStr}T00:00:00`)
      .lt('start_time', `${dateStr}T23:59:59`);
    
    if (error) break;
    
    const hasCompletedTask = data?.some(event => event.status === 'completed');
    
    if (!hasCompletedTask && data && data.length > 0) {
      consecutiveMissed++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break; // Stop at first completed or no tasks day
    }
  }
  
  return consecutiveMissed;
};

const Journey = () => {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userPoints, setUserPoints] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [consecutiveMissedDays, setConsecutiveMissedDays] = useState(0);
  const [selectedMilestone, setSelectedMilestone] = useState<JourneyNode | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();
  const activeNodeRef = useRef<HTMLButtonElement>(null);

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
        fetchUserData(session.user.id);
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

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch completed events - each completed task = 4 points
      const { data, error } = await supabase
        .from('events')
        .select('status, completed_at')
        .eq('user_id', userId)
        .eq('status', 'completed');

      if (!error && data) {
        const points = data.length * 4; // Each completed task = 4 points
        let calculatedLevel = calculateLevel(points);
        
        // Check for consecutive missed days
        const missedDays = await checkConsecutiveMissedDays(userId);
        setConsecutiveMissedDays(missedDays);
        
        // Apply level fallback for missed consecutive days
        if (missedDays > 0) {
          calculatedLevel = Math.max(1, calculatedLevel - missedDays);
        }
        
        setUserPoints(points);
        setCurrentLevel(calculatedLevel);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const handleMilestoneClick = (node: JourneyNode) => {
    setSelectedMilestone(node);
    setDialogOpen(true);
  };

  const getRank = (level: number): string => {
    if (level >= 15) return "Master";
    if (level >= 10) return "Advanced";
    if (level >= 5) return "Intermediate";
    return "Beginner";
  };

  // Generate journey nodes dynamically based on level requirements
  const journeyNodes: JourneyNode[] = LEVEL_REQUIREMENTS.map((req, index) => {
    const levelNumber = index + 1;
    const requiredPoints = req * 4;
    const isCompleted = currentLevel > levelNumber;
    const isActive = currentLevel === levelNumber;
    const isLocked = currentLevel < levelNumber;
    
    // Define positions along a winding path (bottom to top)
    const positions = [
      { x: 50, y: 95 }, { x: 20, y: 89 }, { x: 75, y: 83 }, { x: 25, y: 77 },
      { x: 80, y: 71 }, { x: 20, y: 65 }, { x: 75, y: 59 }, { x: 25, y: 53 },
      { x: 70, y: 47 }, { x: 30, y: 41 }, { x: 75, y: 35 }, { x: 25, y: 29 },
      { x: 70, y: 23 }, { x: 30, y: 17 }, { x: 65, y: 11 }, { x: 50, y: 5 },
    ];
    
    const position = positions[index] || { x: 50, y: 50 };
    
    // Add labels at certain milestones
    let label;
    if (levelNumber === 1) label = "Beginner";
    else if (levelNumber === 5) label = "Intermediate";
    else if (levelNumber === 10) label = "Advanced";
    else if (levelNumber === 16) label = "Master";
    
    return {
      id: levelNumber,
      level: `Level ${levelNumber}`,
      isLocked,
      isActive,
      isCompleted,
      position,
      label,
      requiredPoints,
    };
  });

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

  const currentRank = getRank(currentLevel);

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
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold text-foreground">
                {userPoints.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">pts</p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm font-semibold text-foreground">Level {currentLevel}</p>
              {consecutiveMissedDays > 0 && (
                <Badge variant="destructive" className="text-xs">
                  -{consecutiveMissedDays} level
                </Badge>
              )}
            </div>
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
