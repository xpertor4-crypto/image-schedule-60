import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Lock, CheckCircle2 } from "lucide-react";

interface MilestoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  milestone: {
    level: string;
    isLocked: boolean;
    isActive: boolean;
    isCompleted: boolean;
  } | null;
}

export const MilestoneDialog = ({ open, onOpenChange, milestone }: MilestoneDialogProps) => {
  if (!milestone) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {milestone.isCompleted && (
              <CheckCircle2 className="w-6 h-6 text-journey-completed" />
            )}
            {milestone.isActive && (
              <div className="w-6 h-6 rounded-full bg-journey-active" />
            )}
            {milestone.isLocked && (
              <Lock className="w-6 h-6 text-journey-locked" />
            )}
            <DialogTitle className="text-2xl">{milestone.level}</DialogTitle>
          </div>
          <DialogDescription>
            {milestone.isCompleted && "You've completed this milestone! Great work!"}
            {milestone.isActive && "This is your current milestone. Keep going!"}
            {milestone.isLocked && "Complete previous milestones to unlock this level."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center gap-2">
            <Badge variant={milestone.isCompleted ? "default" : milestone.isActive ? "secondary" : "outline"}>
              {milestone.isCompleted ? "Completed" : milestone.isActive ? "In Progress" : "Locked"}
            </Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
