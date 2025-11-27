import { Progress } from "@/components/ui/progress";

interface DailyProgressProps {
  completed: number;
  total: number;
}

export const DailyProgress = ({ completed, total }: DailyProgressProps) => {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">Progress</span>
        <span className="text-sm font-semibold text-foreground">{percentage}%</span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
};
